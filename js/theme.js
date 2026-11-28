/**
 * ============================================================
 * Apiapia 学习中心 · 全局夜间/护眼模式核心管理模块
 * Unified Child-Friendly Dark/Night Mode Manager
 * ============================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'apiapia_theme';
    var lastToggleTimestamp = 0;

    // 预先注入 Tailwind CSS 配置
    window.tailwind = window.tailwind || {};
    window.tailwind.config = window.tailwind.config || {};
    window.tailwind.config.darkMode = 'class';

    // 缓存页面初始日间 theme-color（如钢琴模块为 #0284c7，其余为 #4f46e5）
    var initialThemeMeta = document.querySelector('meta[name="theme-color"]');
    var lightThemeColor = (initialThemeMeta && initialThemeMeta.getAttribute('content')) || '#4f46e5';

    function getTargetOrigin() {
        return (window.location && window.location.origin && window.location.origin !== 'null')
            ? window.location.origin
            : '*';
    }

    function isSameOriginEvent(e) {
        if (!window.location || !window.location.origin || window.location.origin === 'null') {
            return true;
        }
        return e.origin === window.location.origin;
    }

    function getPreferredTheme() {
        try {
            if (window.location && window.location.search) {
                var urlParams = new URLSearchParams(window.location.search);
                var urlTheme = urlParams.get('theme');
                if (urlTheme === 'dark' || urlTheme === 'light') {
                    return urlTheme;
                }
            }
        } catch (e) {}

        if (window.self !== window.top) {
            try {
                if (window.parent && typeof window.parent.isDarkTheme === 'function') {
                    return window.parent.isDarkTheme() ? 'dark' : 'light';
                }
                if (window.parent && window.parent.document && window.parent.document.documentElement) {
                    return window.parent.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                }
            } catch (e) {}
        }

        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
        } catch (e) {}

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function applyThemeToDOM(theme) {
        var isDark = theme === 'dark';
        var html = document.documentElement;

        if (isDark) {
            html.classList.add('dark');
            html.setAttribute('data-theme', 'dark');
        } else {
            html.classList.remove('dark');
            html.setAttribute('data-theme', 'light');
        }

        var themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            themeMeta.setAttribute('content', isDark ? '#0f172a' : lightThemeColor);
        }

        updateToggleButtons(isDark);

        try {
            var evt = new CustomEvent('apiapia-theme-changed', {
                detail: { theme: theme, isDark: isDark }
            });
            window.dispatchEvent(evt);
        } catch (e) {}
    }

    function updateToggleButtons(isDark) {
        var btns = document.querySelectorAll('.theme-toggle-btn, [data-action="toggle-theme"]');
        var isAuto = !localStorage.getItem(STORAGE_KEY);
        var autoSuffix = isAuto ? '（当前跟随系统）' : '（长按恢复跟随系统）';

        btns.forEach(function (btn) {
            if (btn.hasAttribute('data-vue-controlled')) {
                return;
            }
            var iconEl = btn.querySelector('.theme-icon') || btn.querySelector('.van-icon') || btn;
            var textEl = btn.querySelector('.theme-text');
            if (iconEl && iconEl !== btn) {
                iconEl.textContent = isDark ? '☀️' : '🌙';
            }
            if (textEl) {
                textEl.textContent = isDark ? '日间' : '夜间';
            }
            var titleText = isDark
                ? '当前为夜间护眼模式，点击切换至明亮日间模式' + autoSuffix
                : '当前为明亮日间模式，点击切换至夜间护眼模式' + autoSuffix;
            btn.setAttribute('title', titleText);
            btn.setAttribute('aria-label', titleText);
        });
    }

    window.isDarkTheme = function () {
        return document.documentElement.classList.contains('dark');
    };

    window.resetThemeToSystem = function (options) {
        options = options || {};
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}

        var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var target = systemDark ? 'dark' : 'light';
        applyThemeToDOM(target);
        broadcastTheme(target);

        if (options.showToast !== false) {
            var tip = '🌓 已恢复跟随系统模式（随设备深色/浅色自动切换）';
            if (window.kidToast) {
                window.kidToast(tip, 'info');
            } else if (window.vant && window.vant.showToast) {
                window.vant.showToast({ message: tip, icon: 'passed' });
            }
        }
    };

    window.setTheme = function (theme, options) {
        options = options || {};
        var target = theme === 'dark' ? 'dark' : 'light';

        try {
            localStorage.setItem(STORAGE_KEY, target);
        } catch (e) {}

        applyThemeToDOM(target);

        if (options.broadcast !== false) {
            broadcastTheme(target);
        }

        if (options.showToast) {
            var tip = target === 'dark' ? '🌙 已开启夜间护眼模式，保护小朋友视力' : '☀️ 已切换为明亮日间模式';
            if (window.kidToast) {
                window.kidToast(tip, 'info');
            } else if (window.vant && window.vant.showToast) {
                window.vant.showToast({ message: tip, icon: target === 'dark' ? 'pause-circle-o' : 'passed' });
            }
        }
    };

    window.toggleTheme = function (options) {
        options = options || {};
        var now = Date.now();
        if (now - lastToggleTimestamp < 300) {
            return window.isDarkTheme() ? 'dark' : 'light';
        }
        lastToggleTimestamp = now;

        var nextTheme = window.isDarkTheme() ? 'light' : 'dark';
        window.setTheme(nextTheme, {
            broadcast: true,
            showToast: options.showToast !== undefined ? options.showToast : true
        });
        return nextTheme;
    };

    function broadcastTheme(theme) {
        var targetOrigin = getTargetOrigin();

        if (window.self !== window.top) {
            try {
                window.parent.postMessage({
                    type: 'APIAPIA_SET_THEME',
                    theme: theme
                }, targetOrigin);
            } catch (e) {}
        }

        var iframes = document.querySelectorAll('iframe');
        iframes.forEach(function (frame) {
            try {
                if (frame.contentDocument && frame.contentDocument.documentElement) {
                    if (theme === 'dark') {
                        frame.contentDocument.documentElement.classList.add('dark');
                        frame.contentDocument.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                        frame.contentDocument.documentElement.classList.remove('dark');
                        frame.contentDocument.documentElement.setAttribute('data-theme', 'light');
                    }
                }
            } catch (e) {}

            try {
                if (frame.contentWindow) {
                    frame.contentWindow.postMessage({
                        type: 'APIAPIA_SET_THEME',
                        theme: theme
                    }, targetOrigin);
                }
            } catch (e) {}
        });
    }

    window.broadcastTheme = broadcastTheme;

    // 立即执行，杜绝首屏闪烁
    var initialTheme = getPreferredTheme();
    applyThemeToDOM(initialTheme);

    function initDOMTheme() {
        updateToggleButtons(window.isDarkTheme());

        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.theme-toggle-btn, [data-action="toggle-theme"]');
            if (btn) {
                if (btn.hasAttribute('data-vue-controlled')) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                window.toggleTheme({ showToast: true });
            }
        });

        var longPressTimer = null;
        var hasTriggeredLongPress = false;

        function startPress(e) {
            var btn = e.target.closest('.theme-toggle-btn, [data-action="toggle-theme"]');
            if (!btn) return;
            hasTriggeredLongPress = false;
            if (longPressTimer) clearTimeout(longPressTimer);
            longPressTimer = setTimeout(function () {
                hasTriggeredLongPress = true;
                if (navigator.vibrate) {
                    try { navigator.vibrate(60); } catch (err) {}
                }
                window.resetThemeToSystem({ showToast: true });
            }, 850);
        }

        function cancelPress() {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }

        document.addEventListener('touchstart', startPress, { passive: true });
        document.addEventListener('touchend', function (e) {
            cancelPress();
            if (hasTriggeredLongPress) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        document.addEventListener('touchmove', cancelPress, { passive: true });
        document.addEventListener('mousedown', startPress);
        document.addEventListener('mouseup', cancelPress);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDOMTheme);
    } else {
        initDOMTheme();
    }

    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY && e.newValue) {
            applyThemeToDOM(e.newValue);
        }
    });

    window.addEventListener('message', function (e) {
        if (!isSameOriginEvent(e)) return;
        if (e.data && e.data.type === 'APIAPIA_SET_THEME') {
            var incomingTheme = e.data.theme === 'dark' ? 'dark' : 'light';
            if ((incomingTheme === 'dark') !== window.isDarkTheme()) {
                applyThemeToDOM(incomingTheme);
            }
        }
    });

    if (window.matchMedia) {
        try {
            var mql = window.matchMedia('(prefers-color-scheme: dark)');
            var handleMediaChange = function (e) {
                var saved = localStorage.getItem(STORAGE_KEY);
                if (!saved) {
                    applyThemeToDOM(e.matches ? 'dark' : 'light');
                    broadcastTheme(e.matches ? 'dark' : 'light');
                }
            };
            if (mql.addEventListener) {
                mql.addEventListener('change', handleMediaChange);
            } else if (mql.addListener) {
                mql.addListener(handleMediaChange);
            }
        } catch (e) {}
    }
})();
