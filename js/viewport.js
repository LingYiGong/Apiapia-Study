/**
 * ============================================================
 * 学习中心 · 移动端 / iPadOS 视口适配、设备环境检测与 SPA 桥接模块
 * Viewport, Environment Detection & SPA Bridge
 * ============================================================
 */

(function () {
    'use strict';

    // 1. 统一设备与运行环境检测 (全站共享)
    var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    var isIOS = typeof navigator !== 'undefined' && (
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    var isMobile = isIOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    var isWechat = /MicroMessenger/i.test(ua);
    var isStandalone = (typeof window !== 'undefined') && (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true ||
        (typeof document !== 'undefined' && document.referrer.indexOf('android-app://') !== -1)
    );

    window.ApiapiaEnv = {
        isIOS: isIOS,
        isMobile: isMobile,
        isWechat: isWechat,
        isStandalone: isStandalone
    };

    function getTargetOrigin() {
        return (window.location && window.location.origin && window.location.origin !== 'null')
            ? window.location.origin
            : '*';
    }

    function isSameOriginEvent(event) {
        if (!window.location || !window.location.origin || window.location.origin === 'null') {
            return true;
        }
        return event.origin === window.location.origin;
    }

    // 2. 视口高度动态适配
    function updateAppHeight() {
        if (window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }
        var h = window.innerHeight;
        if (window.visualViewport) {
            if (window.visualViewport.offsetTop > 0) {
                window.scrollTo(0, 0);
            }
            h = window.visualViewport.height;
        }
        document.documentElement.style.setProperty('--app-height', h + 'px');
    }

    window.addEventListener('resize', updateAppHeight);

    window.addEventListener('orientationchange', function () {
        setTimeout(function () {
            window.scrollTo(0, 0);
            updateAppHeight();
        }, 150);
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateAppHeight);
        window.visualViewport.addEventListener('scroll', function () {
            if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
        });
    }

    window.addEventListener('scroll', function () {
        if (window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAppHeight);
    } else {
        updateAppHeight();
    }

    // 3. SPA 单页 App 容器微前端通信桥接
    if (window.self !== window.top) {
        document.addEventListener('click', function (e) {
            var target = e.target;
            var link = target && target.closest ? target.closest('a') : null;
            if (link) {
                var href = link.getAttribute('href') || '';
                if (href.endsWith('index.html') || href.indexOf('../index.html') !== -1 || href.indexOf('../../index.html') !== -1) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        window.parent.postMessage({ type: 'SPA_NAVIGATE_HOME' }, getTargetOrigin());
                    } catch (err) {
                        console.warn('[SPA-Bridge] postMessage error:', err);
                    }
                }
            }
        }, true);

        window.addEventListener('message', function (event) {
            if (!isSameOriginEvent(event)) return;
            if (event.data && event.data.type === 'SPA_MODULE_DEACTIVATED') {
                try {
                    if (window.speechSynthesis && window.speechSynthesis.speaking) {
                        window.speechSynthesis.cancel();
                    }
                } catch (e) {}
            }
        });
    }
})();
