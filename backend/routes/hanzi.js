/**
 * 汉字识字与字帖模块 API 处理器
 * 支持 /api/hanzi/sync 云端多端数据同步 (基于 Cloudflare KV)
 */

import { jsonResponse, corsPreflightResponse, handleSync } from './utils.js';

export async function handleHanzi(request, env, url) {
  // CORS 预检处理
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // 路由: /api/hanzi/sync
  if (url.pathname === '/api/hanzi/sync') {
    return handleSync(request, env, url, {
      kvPrefix: 'user_hanzi_',
      buildPayload: (body) => ({
        stats: body.stats && typeof body.stats === 'object'
          ? body.stats
          : { totalPracticed: 0, totalCorrect: 0, characters: {} },
        strokeProgress: body.strokeProgress || '',
        speechSettings: body.speechSettings && typeof body.speechSettings === 'object'
          ? body.speechSettings
          : {}
      }),
      buildSummary: (payload) => ({
        totalPracticed: payload.stats.totalPracticed || 0,
        totalCorrect: payload.stats.totalCorrect || 0,
        charactersCount: Object.keys(payload.stats.characters || {}).length
      })
    });
  }

  return jsonResponse({
    success: false,
    message: '未知汉字模块接口'
  }, 404);
}
