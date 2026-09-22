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

            /* ================== 100% 满分成就奖 · Apiapia 喵星特效奖励弹窗 ================== */
            .kid-reward-overlay {
                position: fixed;
                inset: 0;
                z-index: 100000;
                background-color: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                animation: kidFadeIn 0.25s ease-out forwards;
                user-select: none;
                -webkit-user-select: none;
            }
            .kid-reward-overlay.kid-closing {
                animation: kidFadeOut 0.2s ease-in forwards;
            }
            .kid-reward-confetti-canvas {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 100001;
                width: 100%;
                height: 100%;
            }
            .kid-reward-card {
                position: relative;
                z-index: 100002;
                background: linear-gradient(180deg, #ffffff 0%, #fffdf7 100%);
                width: 100%;
                max-width: 440px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 32px;
                box-shadow: 0 25px 65px -10px rgba(245, 158, 11, 0.35), 0 0 0 3px #fde68a, 0 0 0 7px rgba(254, 240, 138, 0.35);
                padding: 24px 20px 20px;
                text-align: center;
                animation: kidPopIn 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                font-family: "Quicksand", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            }
            .kid-reward-overlay.kid-closing .kid-reward-card {
                animation: kidPopOut 0.18s ease-in forwards;
            }
            .kid-reward-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                border-radius: 9999px;
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                color: #92400e;
                font-size: 0.84rem;
                font-weight: 900;
                margin-bottom: 12px;
                box-shadow: 0 3px 10px rgba(245, 158, 11, 0.2);
            }
            .kid-reward-title {
                font-size: 1.45rem;
                font-weight: 900;
                color: #1e293b;
                margin: 0 0 6px;
                line-height: 1.3;
                letter-spacing: -0.01em;
            }
            .kid-reward-desc {
                font-size: 0.88rem;
                font-weight: 700;
                color: #475569;
                margin: 0 0 16px;
                line-height: 1.55;
            }
            .kid-reward-highlight {
                color: #d97706;
            }
            .kid-reward-detail {
                display: inline-block;
                margin-top: 2px;
                color: #059669;
                font-weight: 800;
            }
            .kid-reward-photos {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 18px;
            }
            .kid-reward-photo-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                background: #f8fafc;
                border: 2px solid #e2e8f0;
                border-radius: 22px;
                padding: 10px 8px 8px;
                cursor: pointer;
                transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                position: relative;
                -webkit-tap-highlight-color: transparent;
            }
            .kid-reward-photo-box:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
            }
            .kid-reward-photo-box:active {
                transform: scale(0.97);
            }
            .kid-photo-cartoon {
                border-color: #fed7aa;
                background: linear-gradient(180deg, #fffaf5 0%, #fff7ed 100%);
            }
            .kid-photo-cartoon:hover {
                border-color: #f97316;
            }
            .kid-photo-real {
                border-color: #fef08a;
                background: linear-gradient(180deg, #fefce8 0%, #fef9c3 100%);
            }
            .kid-photo-real:hover {
                border-color: #eab308;
            }
            .kid-reward-photo-frame {
                position: relative;
                width: 100%;
                max-width: 140px;
                aspect-ratio: 1;
                border-radius: 18px;
                overflow: hidden;
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
                border: 2px solid #ffffff;
            }
            .kid-reward-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .kid-reward-photo-tag {
                position: absolute;
                bottom: 6px;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                padding: 2px 9px;
                border-radius: 9999px;
                background: rgba(15, 23, 42, 0.78);
                color: #ffffff;
                font-size: 0.72rem;
                font-weight: 800;
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                gap: 3px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            }
            .kid-reward-photo-caption {
                font-size: 0.76rem;
                font-weight: 800;
                color: #64748b;
                margin-top: 6px;
            }
            .kid-reward-zoom-tip {
                font-size: 0.75rem;
                font-weight: 800;
                color: #b45309;
                background: #fffbeb;
                border: 1px dashed #fde68a;
                padding: 5px 12px;
                border-radius: 9999px;
                margin: 0 auto 16px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .kid-reward-btn {
                font-family: inherit;
                width: 100%;
                font-size: 1.05rem;
                font-weight: 900;
                padding: 14px 20px;
                border-radius: 20px;
                cursor: pointer;
                outline: none;
                border: none;
                border-bottom: 4px solid #b45309;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: #ffffff;
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);
                transition: transform 0.1s ease, border-bottom-width 0.1s ease, box-shadow 0.1s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                -webkit-tap-highlight-color: transparent;
            }
            .kid-reward-btn:active {
                transform: translateY(2px);
                border-bottom-width: 2px;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
            }

            /* ================== 图片全屏原图查看器 (Lightbox) ================== */
            .kid-lightbox-overlay {
                position: fixed;
                inset: 0;
                z-index: 100010;
                background-color: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 18px 14px;
                animation: kidFadeIn 0.2s ease-out forwards;
                user-select: none;
                -webkit-user-select: none;
            }
            .kid-lightbox-overlay.kid-closing {
                animation: kidFadeOut 0.18s ease-in forwards;
            }
            .kid-lightbox-header {
                width: 100%;
                max-width: 520px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                padding: 0 4px;
            }
            .kid-lightbox-title {
                color: #ffffff;
                font-size: 1.05rem;
                font-weight: 900;
                display: flex;
                align-items: center;
                gap: 6px;
                text-shadow: 0 2px 6px rgba(0,0,0,0.5);
            }
            .kid-lightbox-close-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.22);
                border: 2px solid rgba(255, 255, 255, 0.4);
                color: #ffffff;
                font-size: 1.25rem;
                font-weight: 900;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.15s ease;
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }
            .kid-lightbox-close-btn:hover {
                background: rgba(255, 255, 255, 0.35);
                transform: scale(1.08);
            }
            .kid-lightbox-close-btn:active {
                transform: scale(0.92);
            }
            .kid-lightbox-img-wrap {
                position: relative;
                max-width: 92vw;
                max-height: 70vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .kid-lightbox-img {
                max-width: 92vw;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 24px;
                box-shadow: 0 25px 50px -10px rgba(0, 0, 0, 0.65);
                border: 3px solid rgba(255, 255, 255, 0.3);
                animation: kidPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                cursor: zoom-out;
            }
            .kid-lightbox-nav {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 14px;
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.25);
                padding: 5px;
                border-radius: 9999px;
                backdrop-filter: blur(8px);
            }
            .kid-lightbox-nav-btn {
                padding: 7px 16px;
                border-radius: 9999px;
                font-size: 0.82rem;
                font-weight: 800;
                cursor: pointer;
                border: none;
                outline: none;
                transition: all 0.15s ease;
                color: rgba(255, 255, 255, 0.85);
                background: transparent;
                -webkit-tap-highlight-color: transparent;
            }
            .kid-lightbox-nav-btn.active {
                background: #ffffff;
                color: #1e293b;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            .kid-lightbox-hint {
                color: rgba(255, 255, 255, 0.65);
                font-size: 0.75rem;
                font-weight: 700;
                margin-top: 8px;
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

    // 自动根据页面层级计算 Apiapia 头像路径
    function getApiapiaIconPath() {
        const path = window.location.pathname || '';
        if (path.includes('/japanese/frontend')) {
            return '../../icons/apple-touch-icon.png';
        }
        if (path.includes('/hanzi/') || path.includes('/english/')) {
            return '../icons/apple-touch-icon.png';
        }
        return './icons/apple-touch-icon.png';
    }

    // 辅助函数：填充弹窗图标元素（支持 Emoji 或图片路径）
    function renderDialogIcon(iconEl, iconVal) {
        if (typeof iconVal === 'string' && (iconVal.endsWith('.png') || iconVal.endsWith('.jpg') || iconVal.startsWith('.') || iconVal.startsWith('/') || iconVal.startsWith('http'))) {
            iconEl.innerHTML = `<img src="${iconVal}" alt="Apiapia" style="width:100%;height:100%;object-fit:cover;border-radius:18px;" />`;
        } else {
            iconEl.textContent = iconVal;
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
            renderDialogIcon(iconEl, theme.icon);

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
            renderDialogIcon(iconEl, theme.icon);

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
            title: options.title || '🐱 猫咪 Apiapia 悄悄问：',
            message: options.message || '今天表现超棒！确定要先休息一下吗？本轮练习进度猫咪随时准备陪你继续哦！',
            icon: options.icon || getApiapiaIconPath(),
            type: 'exit',
            confirmText: options.confirmText || '先休息啦',
            cancelText: options.cancelText || '继续加油'
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

    // ============================================================
    // 满分成就奖 · Apiapia 喵星特效奖励系统
    // ============================================================

    function getRewardImagePaths() {
        const path = window.location.pathname || '';
        let prefix = './icons/';
        if (path.includes('/japanese/frontend')) {
            prefix = '../../icons/';
        } else if (path.includes('/hanzi/') || path.includes('/english/')) {
            prefix = '../icons/';
        }
        return {
            real: prefix + 'apiapia-real.png',
            cartoon: prefix + 'apiapia-cartoon.png'
        };
    }

    function playCelebrationChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            // 充满元气的喜庆大调分解和弦：C5, E5, G5, C6
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
                gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.11);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.55);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.11);
                osc.stop(ctx.currentTime + idx * 0.11 + 0.6);
            });
        } catch (e) {
            // 音效为纯增强体验，被阻断时静默忽略
        }
    }

    function startConfettiAnimation(canvas) {
        const ctx = canvas.getContext('2d');
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const onResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);

        const colors = ['#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#fbbf24', '#06b6d4'];
        const particles = [];
        const count = 90;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: width * 0.5 + (Math.random() - 0.5) * 160,
                y: height * 0.3 + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 18,
                vy: -Math.random() * 14 - 3,
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                shape: Math.random() > 0.4 ? 'rect' : 'circle',
                opacity: 1
            });
        }

        let animId = null;
        let startTime = Date.now();

        function render() {
            const elapsed = Date.now() - startTime;
            ctx.clearRect(0, 0, width, height);

            let activeCount = 0;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.32; // 重力
                p.vx *= 0.985; // 空气阻力
                p.rotation += p.rotSpeed;

                if (elapsed > 2200) {
                    p.opacity = Math.max(0, p.opacity - 0.02);
                }

                if (p.opacity > 0 && p.y < height + 50) {
                    activeCount++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = p.opacity;
                    ctx.fillStyle = p.color;

                    if (p.shape === 'rect') {
                        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
                    } else {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            });

            if (activeCount > 0 && elapsed < 4500) {
                animId = requestAnimationFrame(render);
            }
        }

        animId = requestAnimationFrame(render);

        return () => {
            if (animId) cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
        };
    }

    /**
     * 全局 100% 满分成就奖 · Apiapia 喵星特效奖励弹窗
     * @param {Object} options
     * @param {string} options.moduleName 练习模块名称
     * @param {string} options.detail 成绩或练习详细说明
     * @param {Function} options.onClose 关闭弹窗后的回调
     */
    window.showApiapiaPerfectReward = function(options = {}) {
        const {
            moduleName = '练习',
            detail = '',
            onClose = null
        } = options;

        const images = getRewardImagePaths();

        // 播放庆典欢呼音效
        playCelebrationChime();

        // 创建全屏遮罩
        const overlay = document.createElement('div');
        overlay.className = 'kid-reward-overlay';

        // 创建全屏礼花 Canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'kid-reward-confetti-canvas';
        overlay.appendChild(canvas);

        const stopConfetti = startConfettiAnimation(canvas);

        // 创建奖励大卡片
        const card = document.createElement('div');
        card.className = 'kid-reward-card';

        card.innerHTML = `
            <div class="kid-reward-badge">
                <span>✨</span>
                <span>🏆 满分大通关 · 获得喵星特别奖励！</span>
                <span>✨</span>
            </div>

            <h2 class="kid-reward-title">🎉 太神啦！100% 完全正确！</h2>
            <p class="kid-reward-desc">
                你在【<b class="kid-reward-highlight">${moduleName}</b>】中表现超级完美！<br />
                ${detail ? `<span class="kid-reward-detail">${detail}</span><br />` : ''}
                代言猫咪 <b>Apiapia</b> 送来满满能量与专属学霸勋章！
            </p>

            <!-- 双猫咪照片展示区 (点击放大查看高清原图) -->
            <div class="kid-reward-photos">
                <div class="kid-reward-photo-box kid-photo-cartoon" role="button" title="点击放大查看高清原图">
                    <div class="kid-reward-photo-frame">
                        <img src="${images.cartoon}" alt="卡通 Apiapia" class="kid-reward-img" />
                        <span class="kid-reward-photo-tag">🎨 卡通萌喵 🔍</span>
                    </div>
                    <span class="kid-reward-photo-caption">为你加油的 Apiapia</span>
                </div>
                <div class="kid-reward-photo-box kid-photo-real" role="button" title="点击放大查看高清原图">
                    <div class="kid-reward-photo-frame">
                        <img src="${images.real}" alt="真实猫咪 Apiapia" class="kid-reward-img" />
                        <span class="kid-reward-photo-tag">📸 真实猫咪 🔍</span>
                    </div>
                    <span class="kid-reward-photo-caption">生活中的 Apiapia 本尊</span>
                </div>
            </div>

            <div class="kid-reward-zoom-tip">
                <span>🔍 点击上方任意照片可全屏放大查看高清原图</span>
            </div>

            <!-- 确认关闭按钮 -->
            <button type="button" class="kid-reward-btn">
                <span>收下奖励 · 继续加油 🐾</span>
            </button>
        `;

        // 图片全屏放大查看逻辑
        const photoList = [
            {
                key: 'cartoon',
                title: '🎨 卡通萌喵 · Apiapia',
                caption: '为你加油的 Apiapia',
                url: images.cartoon
            },
            {
                key: 'real',
                title: '📸 真实猫咪 · Apiapia 本尊',
                caption: '生活中的 Apiapia 真实萌照',
                url: images.real
            }
        ];

        function openPhotoLightbox(initialKey) {
            let currentKey = initialKey || 'cartoon';

            const lbOverlay = document.createElement('div');
            lbOverlay.className = 'kid-lightbox-overlay';

            const updateLightboxContent = () => {
                const item = photoList.find(p => p.key === currentKey) || photoList[0];
                lbOverlay.innerHTML = `
                    <div class="kid-lightbox-header">
                        <div class="kid-lightbox-title">${item.title}</div>
                        <button type="button" class="kid-lightbox-close-btn" title="关闭大图">✕</button>
                    </div>
                    <div class="kid-lightbox-img-wrap">
                        <img src="${item.url}" alt="${item.title}" class="kid-lightbox-img" title="轻按图片返回" />
                    </div>
                    <div class="kid-lightbox-nav">
                        <button type="button" class="kid-lightbox-nav-btn ${currentKey === 'cartoon' ? 'active' : ''}" data-key="cartoon">
                            🎨 卡通形象
                        </button>
                        <button type="button" class="kid-lightbox-nav-btn ${currentKey === 'real' ? 'active' : ''}" data-key="real">
                            📸 真实照片
                        </button>
                    </div>
                    <div class="kid-lightbox-hint">💡 轻触大图任意处或右上角 ✕ 即可返回</div>
                `;

                const closeBtn = lbOverlay.querySelector('.kid-lightbox-close-btn');
                const imgEl = lbOverlay.querySelector('.kid-lightbox-img');
                const closeLightbox = () => {
                    lbOverlay.classList.add('kid-closing');
                    setTimeout(() => {
                        if (lbOverlay.parentNode) {
                            lbOverlay.parentNode.removeChild(lbOverlay);
                        }
                    }, 180);
                };

                if (closeBtn) closeBtn.onclick = closeLightbox;
                if (imgEl) imgEl.onclick = closeLightbox;

                lbOverlay.onclick = (e) => {
                    if (e.target === lbOverlay) closeLightbox();
                };

                const navBtns = lbOverlay.querySelectorAll('.kid-lightbox-nav-btn');
                navBtns.forEach(b => {
                    b.onclick = (e) => {
                        e.stopPropagation();
                        currentKey = b.dataset.key;
                        updateLightboxContent();
                    };
                });
            };

            updateLightboxContent();
            document.body.appendChild(lbOverlay);
        }

        window.openApiapiaPhotoLightbox = openPhotoLightbox;

        const cartoonBox = card.querySelector('.kid-photo-cartoon');
        if (cartoonBox) {
            cartoonBox.onclick = () => openPhotoLightbox('cartoon');
        }
        const realBox = card.querySelector('.kid-photo-real');
        if (realBox) {
            realBox.onclick = () => openPhotoLightbox('real');
        }

        const closeReward = () => {
            stopConfetti();
            overlay.classList.add('kid-closing');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                if (typeof onClose === 'function') {
                    onClose();
                }
            }, 200);
        };

        const btn = card.querySelector('.kid-reward-btn');
        if (btn) {
            btn.onclick = closeReward;
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeReward();
            }
        };

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        if (btn) {
            btn.focus();
        }
    };

    /* ============================================================
     * Apiapia 全局按键物理点按与触感反馈系统 (Tap & Haptic Feedback Engine)
     * 解决移动端 / 触屏 / 鼠标操作中按压感缺失、感觉“没点到”的问题
     * ============================================================ */
    (function initApiapiaTapFeedback() {
        // 1. 唤醒 iOS Safari / WebKit 的 :active 伪类即时响应
        if (typeof window !== 'undefined') {
            const wakeActiveState = () => {};
            window.addEventListener('touchstart', wakeActiveState, { passive: true });
            window.addEventListener('pointerdown', wakeActiveState, { passive: true });
        }

        // 2. Web Audio 零外部资源依赖的轻快气泡按键音
        let audioCtx = null;
        let isAudioSupported = true;
        let lastTapTime = 0;

        function getAudioContext() {
            if (!isAudioSupported) return null;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    isAudioSupported = false;
                    return null;
                }
                if (!audioCtx) {
                    audioCtx = new AudioContextClass();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume().catch(() => {});
                }
                return audioCtx;
            } catch (e) {
                isAudioSupported = false;
                return null;
            }
        }

        // 用户首次触摸/点击时预热激活 AudioContext，确保后续无任何延迟
        const primeAudio = () => {
            getAudioContext();
            window.removeEventListener('pointerdown', primeAudio);
            window.removeEventListener('touchstart', primeAudio);
            window.removeEventListener('click', primeAudio);
        };
        window.addEventListener('pointerdown', primeAudio, { passive: true });
        window.addEventListener('touchstart', primeAudio, { passive: true });
        window.addEventListener('click', primeAudio, { passive: true });

        // 播放轻快拟物按键音 (如气泡啵声/积木轻击音)
        function playTapSound(type = 'default') {
            try {
                // 支持全局静音偏好
                if (localStorage.getItem('apiapia_tap_sound_disabled') === 'true') {
                    return;
                }
                const ctx = getAudioContext();
                if (!ctx) return;

                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                if (type === 'heavy' || type === 'confirm') {
                    // 重点操作/确认大按钮: 饱满双音级或轻明亮音
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(680, now);
                    osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.048);
                } else {
                    // 标准按键: 温和极短促气泡 pop 音 (时长仅 35ms，音量温和，清脆解压)
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(540, now);
                    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.038);
                }
            } catch (e) {
                // 忽略音频异常
            }
        }

        // 触感微震动 (Haptic Vibration)
        function triggerHaptic(type = 'light') {
            try {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    // 10ms 极短微震动，带来实体微开关阻尼感
                    navigator.vibrate(type === 'heavy' ? 18 : 10);
                }
            } catch (e) {}
        }

        // 判断元素是否属于需要触感反馈的交互控件
        function findInteractiveTarget(el) {
            if (!el || el === document.body || el === document.documentElement) return null;
            return el.closest(
                'button, [role="button"], .choice-option, .clickable, ' +
                '.kid-btn-primary, .kid-btn-success, .kid-btn-danger, .kid-btn-warning, .kid-btn-light, .kid-btn-cyan, ' +
                '.btn-3d-primary, .btn-3d-success, .btn-3d-danger, .btn-3d-warning, .btn-3d-light, .btn-3d-cyan, ' +
                '.van-button, .app-bottom-nav button, a.btn, input[type="button"], input[type="submit"], ' +
                '#startBtn, #recognitionStartBtn, #readStartBtn, #storyStartBtn, #strokeStartBtn, ' +
                '.kid-dialog-btn, .kid-reward-btn'
            );
        }

        // 全局事件委托 (使用 pointerdown 优先获取即时下按时刻)
        function handlePointerDown(e) {
            const btn = findInteractiveTarget(e.target);
            if (!btn) return;

            // 检查禁用状态
            if (btn.disabled || btn.getAttribute('aria-disabled') === 'true' || btn.classList.contains('disabled')) {
                return;
            }

            const now = Date.now();
            // 节流 45ms，避免多点触控或快速重复判定
            if (now - lastTapTime < 45) return;
            lastTapTime = now;

            const isHeavy = btn.classList.contains('kid-btn-primary') ||
                            btn.classList.contains('kid-btn-success') ||
                            btn.classList.contains('kid-btn-danger') ||
                            btn.classList.contains('btn-3d-primary') ||
                            btn.classList.contains('kid-dialog-btn-primary');

            playTapSound(isHeavy ? 'heavy' : 'default');
            triggerHaptic(isHeavy ? 'heavy' : 'light');
        }

        // 注册全局指针下压监听
        if (window.PointerEvent) {
            document.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: true });
        } else {
            document.addEventListener('touchstart', handlePointerDown, { passive: true, capture: true });
            document.addEventListener('mousedown', handlePointerDown, { passive: true, capture: true });
        }

        // 挂载全局控制 API 到 window.KidTapFeedback
        window.KidTapFeedback = {
            play: playTapSound,
            haptic: triggerHaptic,
            enableSound: () => localStorage.removeItem('apiapia_tap_sound_disabled'),
            disableSound: () => localStorage.setItem('apiapia_tap_sound_disabled', 'true'),
            isSoundEnabled: () => localStorage.getItem('apiapia_tap_sound_disabled') !== 'true'
        };
    })();

})();
