/**
 * 共享工具：统一的 JSON 响应、CORS 预检、参数校验与学习进度云同步处理
 */

const MAX_SYNC_PAYLOAD_BYTES = 2 * 1024 * 1024;
const SYNC_KEY_PATTERN = /^[\w\u4e00-\u9fa5@.-]{1,64}$/;

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

export function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export function methodNotAllowedResponse() {
  return jsonResponse({
    success: false,
    error: 'METHOD_NOT_ALLOWED',
    message: '不支持的请求方法'
  }, 405);
}

export function validateSyncKey(rawKey) {
  if (typeof rawKey !== 'string') {
    return { valid: false, error: 'MISSING_SYNC_KEY', message: '缺少同步密钥 (key 参数或 X-Sync-Key 请求头)。' };
  }
  const key = rawKey.trim();
  if (!key) {
    return { valid: false, error: 'MISSING_SYNC_KEY', message: '缺少同步密钥 (key 参数或 X-Sync-Key 请求头)。' };
  }
  if (!SYNC_KEY_PATTERN.test(key)) {
    return {
      valid: false,
      error: 'INVALID_SYNC_KEY',
      message: '同步密钥格式无效（仅支持 1~64 位字母、数字、中文及 _ . @ -）。'
    };
  }
  return { valid: true, key };
}

/**
 * 通用学习进度云同步处理器
 * GET 读取 / POST 写入 Cloudflare KV；各模块只需提供 KV 前缀与数据构造器。
 */
export async function handleSync(request, env, url, options) {
  // 检查 KV 绑定
  if (!env.STUDY_KV) {
    return jsonResponse({
      success: false,
      error: 'KV_NOT_BOUND',
      message: 'Cloudflare KV 命名空间 [STUDY_KV] 尚未在 Worker 设置中绑定。'
    }, 503);
  }

  // GET: 读取学习进度
  if (request.method === 'GET') {
    const rawKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key');
    const keyCheck = validateSyncKey(rawKey);
    if (!keyCheck.valid) {
      return jsonResponse({
        success: false,
        error: keyCheck.error,
        message: keyCheck.message
      }, 400);
    }

    try {
      const raw = await env.STUDY_KV.get(`${options.kvPrefix}${keyCheck.key}`, 'json');
      return jsonResponse({
        success: true,
        data: raw || null,
        syncKey: keyCheck.key
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        error: err.message
      }, 500);
    }
  }

  // POST: 保存/更新学习进度
  if (request.method === 'POST') {
    try {
      const contentLengthHeader = request.headers.get('Content-Length');
      if (contentLengthHeader) {
        const declaredSize = Number(contentLengthHeader);
        if (!Number.isNaN(declaredSize) && declaredSize > MAX_SYNC_PAYLOAD_BYTES) {
          return jsonResponse({
            success: false,
            error: 'PAYLOAD_TOO_LARGE',
            message: '同步数据体积超出 2MB 上限。'
          }, 413);
        }
      }

      const rawText = await request.text();
      const byteLength = new TextEncoder().encode(rawText).byteLength;
      if (byteLength > MAX_SYNC_PAYLOAD_BYTES) {
        return jsonResponse({
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: '同步数据体积超出 2MB 上限。'
        }, 413);
      }

      let body;
      try {
        body = JSON.parse(rawText);
      } catch (parseErr) {
        return jsonResponse({
          success: false,
          error: 'INVALID_JSON',
          message: '请求体不是有效的 JSON 格式。'
        }, 400);
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonResponse({
          success: false,
          error: 'INVALID_JSON',
          message: '请求体必须为 JSON 对象。'
        }, 400);
      }

      const rawKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key') || body.syncKey;
      const keyCheck = validateSyncKey(rawKey);
      if (!keyCheck.valid) {
        return jsonResponse({
          success: false,
          error: keyCheck.error,
          message: keyCheck.message
        }, 400);
      }

      const payload = {
        ...options.buildPayload(body),
        updatedAt: Date.now()
      };

      await env.STUDY_KV.put(`${options.kvPrefix}${keyCheck.key}`, JSON.stringify(payload));

      return jsonResponse({
        success: true,
        updatedAt: payload.updatedAt,
        syncKey: keyCheck.key,
        ...options.buildSummary(payload)
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        error: err.message
      }, 500);
    }
  }

  return methodNotAllowedResponse();
}
