/**
 * 共享工具：统一的 JSON 响应、CORS 预检与学习进度云同步处理
 */

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
  return new Response('Method Not Allowed', { status: 405 });
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
    }, 200);
  }

  // GET: 读取学习进度
  if (request.method === 'GET') {
    const syncKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key');
    if (!syncKey) {
      return jsonResponse({
        success: false,
        error: 'MISSING_SYNC_KEY',
        message: '缺少同步密钥 (key 参数或 X-Sync-Key 请求头)。'
      }, 400);
    }

    try {
      const raw = await env.STUDY_KV.get(`${options.kvPrefix}${syncKey}`, 'json');
      return jsonResponse({
        success: true,
        data: raw || null,
        syncKey
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
      const body = await request.json();
      const syncKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key') || body.syncKey;
      if (!syncKey) {
        return jsonResponse({
          success: false,
          error: 'MISSING_SYNC_KEY',
          message: '缺少同步密钥 (key 参数、X-Sync-Key 请求头或 body.syncKey)。'
        }, 400);
      }

      const payload = {
        ...options.buildPayload(body),
        updatedAt: Date.now()
      };

      await env.STUDY_KV.put(`${options.kvPrefix}${syncKey}`, JSON.stringify(payload));

      return jsonResponse({
        success: true,
        updatedAt: payload.updatedAt,
        syncKey,
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
