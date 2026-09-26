// Apiapia 学习中心 - PWA Service Worker
const CACHE_NAME = 'apiapia-pwa-v2.2.3';

// 基础核心缓存资源（已完全本地化，无外部 CDN 依赖）
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
    './libs/hanzi-writer.min.js',
    './libs/vexflow.js',
    './libs/quicksand.css',
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

// 请求阶段：version.json 绝不走缓存；其他资源网络优先，网络异常时回退到缓存
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 1. 动态检测版本号接口、跨域资源等走网络
    if (requestUrl.pathname.endsWith('version.json') || event.request.method !== 'GET') {
        return;
    }

    // 2. 核心网络优先策略（Network First），保障随时能够拉取到最新内容
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // 若请求有效且为本站同源资源，更新对应缓存
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // 网络失败或离线时，尝试从缓存读取
                return caches.match(event.request);
            })
    );
});
