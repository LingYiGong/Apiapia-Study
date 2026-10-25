// Apiapia 学习中心 - PWA Service Worker
const CACHE_NAME = 'apiapia-pwa-v2.3.0';

// 基础核心缓存资源（仅包含首屏与全站公共依赖，模块专属库按需缓存）
const CORE_ASSETS = [
    './',
    './index.html',
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

// 安装阶段：预缓存核心静态文件
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS).catch((err) => {
                console.warn('[SW] Pre-caching asset failure:', err);
            });
        })
    );
});

// 激活阶段：清理旧缓存并立即接管
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            })
        ])
    );
});

// 请求阶段：API 与 version.json 走网络；静态资源采用 Stale-While-Revalidate 策略
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 1. API 请求、版本检测接口、非 GET 请求均不走缓存
    if (
        requestUrl.pathname.startsWith('/api/') ||
        requestUrl.pathname.endsWith('version.json') ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    // 2. 静态资源：Stale-While-Revalidate（优先返回缓存，同时后台更新）
    // 对静态文件忽略 ?v= 版本查询参数，使预缓存清单能够命中带版本号的请求
    const staticExt = /\.(?:html?|js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf)$/i;
    const cacheKey = staticExt.test(requestUrl.pathname)
        ? new Request(requestUrl.origin + requestUrl.pathname, { method: 'GET' })
        : event.request;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(cacheKey).then((cachedResponse) => {
                const networkFetch = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            cache.put(cacheKey, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || networkFetch;
            });
        })
    );
});
