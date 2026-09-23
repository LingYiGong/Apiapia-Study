/**
 * ============================================================
 * 学习中心 · 移动端 / iPadOS 视口与安全区动态适配模块
 * Viewport & Safe Area Adapter for iOS / iPadOS Safari & Web
 * ============================================================
 */

(function () {
    'use strict';

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

    // 监听窗口尺寸变化
    window.addEventListener('resize', updateAppHeight);

    // 监听横竖屏切换（增加微延迟等待系统动效完成）
    window.addEventListener('orientationchange', function () {
        setTimeout(function () {
            window.scrollTo(0, 0);
            updateAppHeight();
        }, 150);
    });

    // 深度监听视觉视口变化 (针对 iOS Safari 软键盘弹出与地址栏收缩)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateAppHeight);
        window.visualViewport.addEventListener('scroll', function () {
            if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
        });
    }

    // 防止页面意外被橡皮筋滚动拉扯
    window.addEventListener('scroll', function () {
        if (window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }
    });

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAppHeight);
    } else {
        updateAppHeight();
    }
    updateAppHeight();

    // ============================================================
    // SPA 单页 App 容器微前端通信桥接
    // ============================================================
    if (window.self !== window.top) {
        // 全局捕获阶段拦截所有返回根 index.html 首页的链接与按钮
        document.addEventListener('click', function (e) {
            var target = e.target;
            var link = target && target.closest ? target.closest('a') : null;
            if (link) {
                var href = link.getAttribute('href') || '';
                if (href.endsWith('index.html') || href.indexOf('../index.html') !== -1 || href.indexOf('../../index.html') !== -1) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        window.parent.postMessage({ type: 'SPA_NAVIGATE_HOME' }, '*');
                    } catch (err) {
                        console.warn('[SPA-Bridge] postMessage error:', err);
                    }
                }
            }
        }, true);

        // 接收父级 SPA 容器广播的失焦/隐藏生命周期事件
        window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'SPA_MODULE_DEACTIVATED') {
                // 停止可能正在朗读的 TTS 语音合成
                try {
                    if (window.speechSynthesis && window.speechSynthesis.speaking) {
                        window.speechSynthesis.cancel();
                    }
                } catch (e) {}
            }
        });
    }
})();
