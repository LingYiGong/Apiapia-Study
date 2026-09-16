// Study Hub 统一后端入口 (Cloudflare Worker)
// 支持多模块 API 路由分发 (日语、汉字等) 与全站静态网页托管

import { handleJapanese } from './routes/japanese.js';
import { handleHanzi } from './routes/hanzi.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // 1. 日语学习模块 API (/api/sync 或 /api/japanese/*)
    // ==========================================
    if (url.pathname === '/api/sync' || url.pathname.startsWith('/api/japanese/')) {
      return handleJapanese(request, env, url);
    }

    // ==========================================
    // 2. 汉字学习模块 API (/api/hanzi/*)
    // ==========================================
    if (url.pathname.startsWith('/api/hanzi/')) {
      return handleHanzi(request, env, url);
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
