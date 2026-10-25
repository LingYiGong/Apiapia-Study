/**
 * 日语学习模块 API 处理器
 * 支持 /api/sync 与 /api/japanese/sync
 */

import { jsonResponse, corsPreflightResponse, handleSync } from './utils.js';

export async function handleJapanese(request, env, url) {
  // CORS 预检处理
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // 路由校验：仅支持 /api/sync 与 /api/japanese/sync
  if (url.pathname !== '/api/sync' && url.pathname !== '/api/japanese/sync') {
    return jsonResponse({
      success: false,
      message: '未知日语模块接口'
    }, 404);
  }

  return handleSync(request, env, url, {
    kvPrefix: 'user_study_',
    buildPayload: (body) => ({
      words: Array.isArray(body.words) ? body.words : [],
      sentences: Array.isArray(body.sentences) ? body.sentences : []
    }),
    buildSummary: (payload) => ({
      wordsCount: payload.words.length,
      sentencesCount: payload.sentences.length
    })
  });
}
