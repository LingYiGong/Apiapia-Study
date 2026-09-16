// Cloudflare Worker 入口文件
// 支持静态资源托管 (Workers Assets) 与 /api/sync 云端多端进度同步接口

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 处理云同步 API 路由 (/api/sync)
    if (url.pathname === '/api/sync') {
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

      // GET: 读取进度
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

      // POST: 保存/更新进度
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
    }

    // 2. 托管静态网页文件 (index.html, vocab_data.js, sentence_data.js)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
