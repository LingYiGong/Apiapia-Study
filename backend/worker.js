// Study Hub 统一后端入口 (Cloudflare Worker)
// 支持多模块 API 路由分发 (日语、汉字等) 与全站静态网页托管

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // 1. 日语学习模块 API (/api/sync 或 /api/japanese/sync)
    // ==========================================
    if (url.pathname === '/api/sync' || url.pathname === '/api/japanese/sync') {
      return handleJapaneseSync(request, env, url);
    }

    // ==========================================
    // 2. 汉字学习模块 API (预留接口位置，未来扩展)
    // ==========================================
    if (url.pathname.startsWith('/api/hanzi/')) {
      return new Response(JSON.stringify({
        success: false,
        message: '汉字模块云端接口正在开发中...'
      }), {
        status: 501,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // ==========================================
    // 3. 全站静态网页托管 (index.html, japanese, hanzi, english)
    // ==========================================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};

/**
 * 处理日语学习进度的云端 KV 同步
 */
async function handleJapaneseSync(request, env, url) {
  // CORS 预检
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
    return new Response(JSON.stringify({
      success: false,
      error: 'KV_NOT_BOUND',
      message: 'Cloudflare KV 命名空间 [STUDY_KV] 尚未在 Worker 设置中绑定。'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // GET: 读取日语学习进度
  if (request.method === 'GET') {
    try {
      const raw = await env.STUDY_KV.get(`user_study_${syncKey}`, 'json');
      return new Response(JSON.stringify({
        success: true,
        data: raw || null,
        syncKey
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: err.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
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

      return new Response(JSON.stringify({
        success: true,
        updatedAt: payload.updatedAt,
        syncKey: targetKey,
        wordsCount: payload.words.length,
        sentencesCount: payload.sentences.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: err.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
