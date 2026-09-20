/**
 * ============================================================
 * 学习中心 · 儿童友好全局统一提示与二次确认弹窗系统
 * Unified Child-Friendly Dialog & Toast System
 * ============================================================
 */

(function() {
    // 注入全局统一弹窗样式
    const styleId = 'kid-dialog-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes kidFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes kidFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes kidPopIn {
                0% { opacity: 0; transform: scale(0.85) translateY(12px); }
                70% { transform: scale(1.03) translateY(-2px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes kidPopOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.9); }
            }
            @keyframes kidToastSlideDown {
                0% { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }
                70% { transform: translate(-50%, 4px) scale(1.02); }
                100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
            @keyframes kidToastSlideUp {
                from { opacity: 1; transform: translate(-50%, 0) scale(1); }
                to { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }
            }

            .kid-dialog-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background-color: rgba(15, 23, 42, 0.45);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: kidFadeIn 0.18s ease-out forwards;
                user-select: none;
                -webkit-user-select: none;
            }
            .kid-dialog-overlay.kid-closing {
                animation: kidFadeOut 0.15s ease-in forwards;
            }

            .kid-dialog-card {
                background: #ffffff;
                width: 100%;
                max-width: 360px;
                border-radius: 28px;
                box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
                border: 3px solid #f1f5f9;
                padding: 24px 22px 20px;
                text-align: center;
                animation: kidPopIn 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                font-family: "Quicksand", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            }
            .kid-dialog-overlay.kid-closing .kid-dialog-card {
                animation: kidPopOut 0.15s ease-in forwards;
            }

            .kid-dialog-icon-wrapper {
                width: 64px;
                height: 64px;
                margin: 0 auto 14px;
                border-radius: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
            }

            .kid-dialog-title {
                font-size: 1.2rem;
                font-weight: 900;
                color: #0f172a;
                margin: 0 0 8px;
                line-height: 1.35;
                letter-spacing: -0.01em;
            }

            .kid-dialog-message {
                font-size: 0.92rem;
                font-weight: 600;
                color: #475569;
                margin: 0 0 22px;
                line-height: 1.6;
                word-break: break-word;
            }

            .kid-dialog-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .kid-dialog-actions.kid-single-btn {
                grid-template-columns: 1fr;
            }

            .kid-dialog-btn {
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 800;
                padding: 13px 16px;
                border-radius: 18px;
                cursor: pointer;
                outline: none;
                transition: transform 0.1s ease, border-bottom-width 0.1s ease, box-shadow 0.1s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                -webkit-tap-highlight-color: transparent;
            }
            .kid-dialog-btn:active {
                transform: translateY(2px);
            }

            /* 取消按钮样式 (轻量柔和) */
            .kid-dialog-btn-cancel {
                background: #f8fafc;
                border: 2px solid #e2e8f0;
                border-bottom: 4px solid #cbd5e1;
                color: #475569;
                box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            }
            .kid-dialog-btn-cancel:active {
                border-bottom-width: 2px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.03);
            }

            /* 确认按钮样式 (主题色 / 3D 触控压感) */
            .kid-dialog-btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                border: none;
                border-bottom: 4px solid #3730a3;
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
            }
            .kid-dialog-btn-primary:active {
                border-bottom-width: 2px;
                box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
            }

            .kid-dialog-btn-danger {
                background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
                border: none;
                border-bottom: 4px solid #be123c;
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(244, 63, 94, 0.3);
            }
            .kid-dialog-btn-danger:active {
                border-bottom-width: 2px;
                box-shadow: 0 2px 6px rgba(244, 63, 94, 0.2);
            }

            .kid-dialog-btn-warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                border: none;
                border-bottom: 4px solid #b45309;
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
            }
            .kid-dialog-btn-warning:active {
                border-bottom-width: 2px;
                box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
            }

            .kid-dialog-btn-success {
                background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                border: none;
                border-bottom: 4px solid #059669;
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
            }
            .kid-dialog-btn-success:active {
                border-bottom-width: 2px;
                box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
            }

            /* 全局统一 Toast 气泡样式 */
            .kid-toast-pill {
                position: fixed;
                top: calc(18px + env(safe-area-inset-top, 0px));
                left: 50%;
                transform: translateX(-50%);
                z-index: 100000;
                padding: 10px 22px;
                border-radius: 9999px;
                font-family: "Quicksand", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
                font-size: 0.9rem;
                font-weight: 800;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0,0,0,0.08);
                animation: kidToastSlideDown 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                user-select: none;
                -webkit-user-select: none;
                pointer-events: none;
                max-width: 90vw;
                text-align: center;
                border: 2px solid rgba(255,255,255,0.25);
            }
            .kid-toast-pill.kid-closing {
                animation: kidToastSlideUp 0.18s ease-in forwards;
            }
            .kid-toast-info {
                background: #1e293b;
                color: #ffffff;
            }
            .kid-toast-success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: #ffffff;
            }
            .kid-toast-warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #ffffff;
            }
            .kid-toast-error, .kid-toast-danger {
                background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
                color: #ffffff;
            }
        `;
        document.head.appendChild(style);
    }

    // 根据类型获取图标和色彩
    function getTheme(type, customIcon) {
        if (customIcon) {
            return {
                icon: customIcon,
                bg: 'background: #f1f5f9; border: 2px solid #e2e8f0;'
            };
        }
        switch (type) {
            case 'danger':
                return {
                    icon: '🗑️',
                    bg: 'background: #ffe4e6; border: 2px solid #fecdd3;'
                };
            case 'warning':
                return {
                    icon: '⚠️',
                    bg: 'background: #fef3c7; border: 2px solid #fde68a;'
                };
            case 'exit':
                return {
                    icon: '🚪',
                    bg: 'background: #fef3c7; border: 2px solid #fde68a;'
                };
            case 'success':
                return {
                    icon: '🎉',
                    bg: 'background: #d1fae5; border: 2px solid #a7f3d0;'
                };
            case 'info':
            case 'primary':
            default:
                return {
                    icon: '💡',
                    bg: 'background: #e0e7ff; border: 2px solid #c7d2fe;'
                };
        }
    }

    /**
     * 二次确认弹窗 (Promise 接口)
     * @param {Object} options
     * @returns {Promise<boolean>}
     */
    window.kidConfirm = function(options = {}) {
        const {
            title = '请确认',
            message = '',
            icon = '',
            type = 'primary', // 'primary' | 'danger' | 'warning' | 'exit' | 'success'
            confirmText = '确定',
            cancelText = '取消'
        } = typeof options === 'string' ? { message: options } : options;

        return new Promise((resolve) => {
            const theme = getTheme(type, icon);

            const overlay = document.createElement('div');
            overlay.className = 'kid-dialog-overlay';

            const card = document.createElement('div');
            card.className = 'kid-dialog-card';

            const iconEl = document.createElement('div');
            iconEl.className = 'kid-dialog-icon-wrapper';
            iconEl.style.cssText = theme.bg;
            iconEl.textContent = theme.icon;

            const titleEl = document.createElement('h3');
            titleEl.className = 'kid-dialog-title';
            titleEl.textContent = title;

            const msgEl = document.createElement('div');
            msgEl.className = 'kid-dialog-message';
            msgEl.textContent = message;

            const actions = document.createElement('div');
            actions.className = 'kid-dialog-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'kid-dialog-btn kid-dialog-btn-cancel';
            cancelBtn.textContent = cancelText;

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            const btnClass = type === 'danger'
                ? 'kid-dialog-btn-danger'
                : type === 'warning' || type === 'exit'
                ? 'kid-dialog-btn-warning'
                : type === 'success'
                ? 'kid-dialog-btn-success'
                : 'kid-dialog-btn-primary';
            confirmBtn.className = `kid-dialog-btn ${btnClass}`;
            confirmBtn.textContent = confirmText;

            const closeWithResult = (result) => {
                overlay.classList.add('kid-closing');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve(result);
                }, 150);
            };

            cancelBtn.onclick = () => closeWithResult(false);
            confirmBtn.onclick = () => closeWithResult(true);

            // 键盘支持
            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    window.removeEventListener('keydown', keyHandler);
                    closeWithResult(false);
                } else if (e.key === 'Enter') {
                    window.removeEventListener('keydown', keyHandler);
                    closeWithResult(true);
                }
            };
            window.addEventListener('keydown', keyHandler);

            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);

            card.appendChild(iconEl);
            card.appendChild(titleEl);
            card.appendChild(msgEl);
            card.appendChild(actions);

            overlay.appendChild(card);
            document.body.appendChild(overlay);

            confirmBtn.focus();
        });
    };

    /**
     * 单按钮提示弹窗 (Promise 接口，替代原生 alert)
     * @param {Object} options
     * @returns {Promise<void>}
     */
    window.kidAlert = function(options = {}) {
        const {
            title = '温馨提示',
            message = '',
            icon = '',
            type = 'primary',
            confirmText = '我知道啦 👍'
        } = typeof options === 'string' ? { message: options } : options;

        return new Promise((resolve) => {
            const theme = getTheme(type, icon);

            const overlay = document.createElement('div');
            overlay.className = 'kid-dialog-overlay';

            const card = document.createElement('div');
            card.className = 'kid-dialog-card';

            const iconEl = document.createElement('div');
            iconEl.className = 'kid-dialog-icon-wrapper';
            iconEl.style.cssText = theme.bg;
            iconEl.textContent = theme.icon;

            const titleEl = document.createElement('h3');
            titleEl.className = 'kid-dialog-title';
            titleEl.textContent = title;

            const msgEl = document.createElement('div');
            msgEl.className = 'kid-dialog-message';
            msgEl.textContent = message;

            const actions = document.createElement('div');
            actions.className = 'kid-dialog-actions kid-single-btn';

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            const btnClass = type === 'danger'
                ? 'kid-dialog-btn-danger'
                : type === 'warning'
                ? 'kid-dialog-btn-warning'
                : type === 'success'
                ? 'kid-dialog-btn-success'
                : 'kid-dialog-btn-primary';
            confirmBtn.className = `kid-dialog-btn ${btnClass}`;
            confirmBtn.textContent = confirmText;

            const close = () => {
                overlay.classList.add('kid-closing');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve();
                }, 150);
            };

            confirmBtn.onclick = close;

            const keyHandler = (e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    window.removeEventListener('keydown', keyHandler);
                    close();
                }
            };
            window.addEventListener('keydown', keyHandler);

            actions.appendChild(confirmBtn);

            card.appendChild(iconEl);
            card.appendChild(titleEl);
            card.appendChild(msgEl);
            card.appendChild(actions);

            overlay.appendChild(card);
            document.body.appendChild(overlay);

            confirmBtn.focus();
        });
    };

    /**
     * 练习退出专用二次确认弹窗
     * @param {Object} options
     * @returns {Promise<boolean>}
     */
    window.kidConfirmExitPractice = function(options = {}) {
        return window.kidConfirm({
            title: options.title || '要退出当前练习吗？',
            message: options.message || '退出后本轮未完成的练习进度将离开哦，小朋友确定要退出吗？',
            icon: options.icon || '🚪',
            type: 'exit',
            confirmText: options.confirmText || '确定退出',
            cancelText: options.cancelText || '继续练习'
        });
    };

    // 活跃 Toast 引用
    let activeToast = null;
    let toastTimer = null;

    /**
     * 全局统一儿童友好气泡提示 (Toast)
     * @param {string} message 提示文本
     * @param {string} type 'info' | 'success' | 'warning' | 'error'
     * @param {number} duration 持续时间(ms)
     */
    window.kidToast = function(message, type = 'info', duration = 2200) {
        if (activeToast) {
            clearTimeout(toastTimer);
            if (activeToast.parentNode) {
                activeToast.parentNode.removeChild(activeToast);
            }
            activeToast = null;
        }

        const pill = document.createElement('div');
        pill.className = `kid-toast-pill kid-toast-${type}`;

        const iconSpan = document.createElement('span');
        iconSpan.textContent = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : '💡';

        const textSpan = document.createElement('span');
        textSpan.textContent = message;

        pill.appendChild(iconSpan);
        pill.appendChild(textSpan);
        document.body.appendChild(pill);
        activeToast = pill;

        toastTimer = setTimeout(() => {
            pill.classList.add('kid-closing');
            setTimeout(() => {
                if (pill.parentNode) {
                    pill.parentNode.removeChild(pill);
                }
                if (activeToast === pill) {
                    activeToast = null;
                }
            }, 200);
        }, duration);
    };

})();
