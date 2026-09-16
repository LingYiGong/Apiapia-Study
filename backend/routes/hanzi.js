/**
 * 汉字识字与字帖模块 API 处理器
 * 支持 /api/hanzi/sync 云端多端数据同步 (基于 Cloudflare KV)
 */

export async function handleHanzi(request, env, url) {
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

  // 路由: /api/hanzi/sync
  if (url.pathname === '/api/hanzi/sync') {
    return handleHanziSync(request, env, url);
  }

  return new Response(JSON.stringify({
    success: false,
    message: '未知汉字模块接口'
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * 汉字学习进度与错字本同步
 */
async function handleHanziSync(request, env, url) {
  const syncKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key') || 'default';

  // 检查 KV 绑定
  if (!env.STUDY_KV) {
    return jsonResponse({
      success: false,
      error: 'KV_NOT_BOUND',
      message: 'Cloudflare KV 命名空间 [STUDY_KV] 尚未在 Worker 设置中绑定。'
    }, 200);
  }

  // GET: 从 KV 获取汉字学习统计、错题本与笔画进度
  if (request.method === 'GET') {
    try {
      const raw = await env.STUDY_KV.get(`user_hanzi_${syncKey}`, 'json');
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

  // POST: 将汉字学习数据存入 KV
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const targetKey = url.searchParams.get('key') || request.headers.get('X-Sync-Key') || body.syncKey || 'default';

      const payload = {
        stats: body.stats && typeof body.stats === 'object' ? body.stats : { totalPracticed: 0, totalCorrect: 0, characters: {} },
        strokeProgress: body.strokeProgress || '',
        speechSettings: body.speechSettings && typeof body.speechSettings === 'object' ? body.speechSettings : {},
        updatedAt: Date.now()
      };

      await env.STUDY_KV.put(`user_hanzi_${targetKey}`, JSON.stringify(payload));

      return jsonResponse({
        success: true,
        updatedAt: payload.updatedAt,
        syncKey: targetKey,
        totalPracticed: payload.stats.totalPracticed || 0,
        totalCorrect: payload.stats.totalCorrect || 0,
        charactersCount: Object.keys(payload.stats.characters || {}).length
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
