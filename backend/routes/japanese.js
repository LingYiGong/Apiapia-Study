/**
 * 日语学习模块 API 处理器
 * 支持 /api/sync 与 /api/japanese/*
 */

export async function handleJapanese(request, env, url) {
  // CORS 预检处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Key'
      }
    });
  }

  const syncKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key') || 'default';

  // 检查 KV 绑定
  if (!env.STUDY_KV) {
    return jsonResponse({
      success: false,
      error: 'KV_NOT_BOUND',
      message: 'Cloudflare KV 命名空间 [STUDY_KV] 尚未在 Worker 设置中绑定。'
    }, 200);
  }

  // GET: 读取日语学习进度
  if (request.method === 'GET') {
    try {
      const raw = await env.STUDY_KV.get(`user_study_${syncKey}`, 'json');
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

  // POST: 保存/更新日语学习进度
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const targetKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key') || body.syncKey || 'default';
      const payload = {
        words: Array.isArray(body.words) ? body.words : [],
        sentences: Array.isArray(body.sentences) ? body.sentences : [],
        updatedAt: Date.now()
      };

      await env.STUDY_KV.put(`user_study_${targetKey}`, JSON.stringify(payload));

      return jsonResponse({
        success: true,
        updatedAt: payload.updatedAt,
        syncKey: targetKey,
        wordsCount: payload.words.length,
        sentencesCount: payload.sentences.length
      });
    } catch (err) {
      return jsonResponse({
        success: false,
        error: err.message
      }, 500);
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
