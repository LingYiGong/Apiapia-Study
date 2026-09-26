/**
 * ============================================================
 * Apiapia 学习中心 · 全局夜间/护眼模式核心管理模块
 * Unified Child-Friendly Dark/Night Mode Manager
 * Supports: Zero-FOUC (Anti-Flicker), LocalStorage, System Scheme,
 *           Cross-Iframe SPA Synchronization, Custom Event Dispatch,
 *           Debounce/Throttle Click Protection & Long-Press Auto-Reset
 * ============================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'apiapia_theme';
    var lastToggleTimestamp = 0; // 防抖时间戳，防止双重触发

    // 预先注入 Tailwind CSS 配置（确保不管是之前还是之后引入 tailwindcss.js 均能识别 class 模式）
    window.tailwind = window.tailwind || {};
    window.tailwind.config = window.tailwind.config || {};
    window.tailwind.config.darkMode = 'class';

    // 1. 获取当前应采用的主题 ('dark' | 'light')
    function getPreferredTheme() {
        // A. 优先检测 URL query 参数 (?theme=dark 或 ?theme=light)，确保跨 Iframe 秒级直通
        try {
            if (window.location && window.location.search) {
                var urlParams = new URLSearchParams(window.location.search);
                var urlTheme = urlParams.get('theme');
                if (urlTheme === 'dark' || urlTheme === 'light') {
                    return urlTheme;
                }
            }
        } catch (e) {}

        // B. 若处于子 Iframe 容器中，直接探测顶层父 SPA 的实时状态
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

        // C. 读取 LocalStorage 本地存储记忆
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
        } catch (e) {}

        // D. 若本地未主动指定，检测设备系统是否处于深色模式
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // 2. 将主题即时施加至 DOM 及系统级状态栏
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

        // 动态修改移动端状态栏与浏览器 PWA 标题栏色彩 (iOS Safari / Android Chrome)
        var themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            themeMeta.setAttribute('content', isDark ? '#0f172a' : '#4f46e5');
        }

        // 同步更新页面中的切换按钮状态（图标与提示语）
        updateToggleButtons(isDark);

        // 广播派发全局主题变化事件，供业务画布（如五线谱、汉字手写板、假名笔顺）监听并重绘
        try {
            var evt = new CustomEvent('apiapia-theme-changed', {
                detail: { theme: theme, isDark: isDark }
            });
            window.dispatchEvent(evt);
        } catch (e) {}
    }

    // 3. 刷新页面上所有夜间模式切换按钮的外观与文本
    // 逻辑：
    // - 当前是明亮日间模式 (isDark=false) -> 按钮展示「🌙 夜间」，提示用户点击可切换到夜间模式
    // - 当前是深色夜间模式 (isDark=true)  -> 按钮展示「☀️ 日间」，提示用户点击可切换回日间模式
    function updateToggleButtons(isDark) {
        var btns = document.querySelectorAll('.theme-toggle-btn, [data-action="toggle-theme"]');
        var isAuto = !localStorage.getItem(STORAGE_KEY);
        var autoSuffix = isAuto ? '（当前跟随系统）' : '（长按恢复跟随系统）';

        btns.forEach(function (btn) {
            // 如果由首页 Vue 模板响应式绑定驱动，跳过 DOM 手动文本覆盖，由 Vue 自行管理
            if (btn.id === 'homeThemeToggleBtn') {
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

    // 4. 对外核心 API 挂载至 window
    window.isDarkTheme = function () {
        return document.documentElement.classList.contains('dark');
    };

    window.getTheme = function () {
        return window.isDarkTheme() ? 'dark' : 'light';
    };

    window.isSystemThemeMode = function () {
        try {
            return !localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return false;
        }
    };

    // 重置为跟随系统模式 (清除手动记忆，随设备深色/浅色自动同步)
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

        // 跨容器广播 (SPA Iframe 双向同步)
        if (options.broadcast !== false) {
            broadcastTheme(target);
        }

        // 友好气泡提示 (防打扰可选)
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

        // 300ms 防抖节流保护，彻底杜绝短时间内因双重事件或手速过快导致的连点切换失效
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

    // 5. 跨 Iframe / SPA 页面广播通信机制
    function broadcastTheme(theme) {
        // A. 若处于子 Iframe 容器中，向顶层父 SPA 发送
        if (window.self !== window.top) {
            try {
                window.parent.postMessage({
                    type: 'APIAPIA_SET_THEME',
                    theme: theme
                }, '*');
            } catch (e) {}
        }

        // B. 若处于父级 SPA，向所有活动中的子 Iframe 广播并即时操作 DOM
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
                    }, '*');
                }
            } catch (e) {}
        });
    }

    // 6. 立即执行：在 HTML 渲染首屏前赋予 class，杜绝白屏闪烁 (Anti-Flicker)
    var initialTheme = getPreferredTheme();
    applyThemeToDOM(initialTheme);

    // 7. 页面 DOM 加载完毕后，初始化按钮事件与长按手势监听
    function initDOMTheme() {
        updateToggleButtons(window.isDarkTheme());

        // 普通点击切换
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.theme-toggle-btn, [data-action="toggle-theme"]');
            if (btn) {
                // 如果当前按钮由首页 Vue 的 @click 控制，避免全局原生事件二次处理
                if (btn.id === 'homeThemeToggleBtn' || btn.hasAttribute('data-vue-controlled')) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                window.toggleTheme({ showToast: true });
            }
        });

        // 长按手势支持：长按任何主题切换按钮 850ms，重置为「跟随系统」模式
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

    // 8. 监听多标签页 Storage 变更（例如在另一个 Tab 切换夜间模式时自动同频）
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY && e.newValue) {
            applyThemeToDOM(e.newValue);
        }
    });

    // 9. 监听跨 Iframe postMessage 主题指令
    window.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'APIAPIA_SET_THEME') {
            var incomingTheme = e.data.theme === 'dark' ? 'dark' : 'light';
            if ((incomingTheme === 'dark') !== window.isDarkTheme()) {
                applyThemeToDOM(incomingTheme);
            }
        }
    });

    // 10. 系统偏好响应（在用户未主动指定主题时响应系统实时切换）
    if (window.matchMedia) {
        try {
            var mql = window.matchMedia('(prefers-color-scheme: dark)');
            var handleMediaChange = function (e) {
                var saved = localStorage.getItem(STORAGE_KEY);
                // 只有在用户未手动锁定时，才自动跟随设备系统的变化实时切换
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
