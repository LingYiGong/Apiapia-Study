// Apiapia 学习中心 - PWA Service Worker
const CACHE_NAME = 'apiapia-pwa-v2.3.0-r2';

// 基础核心缓存资源（仅包含首屏与全站公共依赖，模块专属库按需缓存）
// 注意：不要预缓存 './index.html'。Cloudflare 静态资源会把 /index.html 重定向到 /，
// 缓存下来的“重定向响应”不能用于页面导航，否则从桌面图标启动 PWA 会直接网络错误。
const CORE_ASSETS = [
    './',
    './app.js',
    './manifest.json',
    './css/style.css',
    './js/theme.js',
    './js/kid-dialog.js',
    './js/viewport.js',
    './libs/vue.global.prod.js',
    './libs/vant.min.js',
    './libs/vant.min.css',
    './libs/tailwindcss.js',
    './libs/fonts/quicksand-600.woff2',
    './libs/fonts/quicksand-700.woff2',
    './icons/favicon.ico',
    './icons/apple-touch-icon.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apiapia-real.jpg',
    './icons/apiapia-cartoon.jpg'
];

function offlineResponse() {
    return new Response(
        '<!DOCTYPE html><html lang="zh-CN"><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>暂时无法连接</title>' +
        '<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 20px;color:#334155">' +
        '<h1>📡 网络暂时不可用</h1><p>请检查网络连接后再试一次。</p></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
}

// 安装阶段：逐个预缓存核心文件，单个资源失败不会导致整个缓存失败
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(CORE_ASSETS.map(async (asset) => {
            try {
                const request = new Request(new URL(asset, self.registration.scope).href, { cache: 'reload' });
                const response = await fetch(request);
                // 只缓存正常的 200 响应；重定向响应不能用于导航请求
                if (response && response.ok && !response.redirected) {
                    await cache.put(request, response);
                }
            } catch (err) {
                console.warn('[SW] Pre-caching asset failure:', asset, err);
            }
        }));
    })());
});

// 激活阶段：清理旧缓存并立即接管
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => {
            if (key !== CACHE_NAME) {
                return caches.delete(key);
            }
            return Promise.resolve();
        }));
        await self.clients.claim();
    })());
});

// 请求阶段：导航走网络优先（离线回退应用外壳）；静态资源走 Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(request.url);

    // API、版本检测接口与跨域资源（TTS 等）直接交给浏览器
    if (
        requestUrl.origin !== self.location.origin ||
        requestUrl.pathname.startsWith('/api/') ||
        requestUrl.pathname.endsWith('version.json')
    ) {
        return;
    }

    // 1. 页面导航：网络优先，避免 HTML 长期停留在旧版本
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                const response = await fetch(request);
                // 缓存正常的页面响应；重定向交给浏览器继续处理
                if (response && response.ok && !response.redirected) {
                    cache.put(request, response.clone()).catch(() => {});
                }
                return response;
            } catch (err) {
                const cached = await cache.match(request);
                if (cached && !cached.redirected) {
                    return cached;
                }
                // 首屏 / 旧版 start_url（/index.html）离线时回退到预缓存的应用外壳
                if (requestUrl.pathname === '/' || requestUrl.pathname.endsWith('/index.html')) {
                    const shell = await cache.match(new URL('./', self.registration.scope).href);
                    if (shell) {
                        return shell;
                    }
                }
                return offlineResponse();
            }
        })());
        return;
    }

    // 2. 静态资源：优先返回缓存，同时后台更新
    const staticExt = /\.(?:html?|js|json|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf)$/i;
    if (!staticExt.test(requestUrl.pathname)) {
        return;
    }

    // 忽略 ?v= 版本查询参数，使带版本号的请求能够命中预缓存
    const cacheKey = requestUrl.origin + requestUrl.pathname;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(cacheKey);
        const networkFetch = fetch(request)
            .then((response) => {
                // 不缓存重定向响应，避免污染缓存
                if (response && response.ok && response.type === 'basic' && !response.redirected) {
                    cache.put(cacheKey, response.clone()).catch(() => {});
                }
                return response;
            })
            .catch(() => null);

        if (cached) {
            return cached;
        }
        const response = await networkFetch;
        return response || offlineResponse();
    })());
});
