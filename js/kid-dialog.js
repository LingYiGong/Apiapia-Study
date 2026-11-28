/**
 * ============================================================
 * 学习中心 · 儿童友好全局统一提示与二次确认弹窗系统
 * Unified Child-Friendly Dialog & Toast System
 * ============================================================
 */

(function() {
    function getTheme(type, customIcon) {
        if (customIcon) {
            return {
                icon: customIcon,
                bg: 'background: #f1f5f9; border: 2px solid #e2e8f0;'
            };
        }
        switch (type) {
            case 'danger':
                return { icon: '🗑️', bg: 'background: #ffe4e6; border: 2px solid #fecdd3;' };
            case 'warning':
                return { icon: '⚠️', bg: 'background: #fef3c7; border: 2px solid #fde68a;' };
            case 'exit':
                return { icon: '🚪', bg: 'background: #fef3c7; border: 2px solid #fde68a;' };
            case 'success':
                return { icon: '🎉', bg: 'background: #d1fae5; border: 2px solid #a7f3d0;' };
            case 'info':
            case 'primary':
            default:
                return { icon: '💡', bg: 'background: #e0e7ff; border: 2px solid #c7d2fe;' };
        }
    }

    function getIconsBasePath() {
        const path = window.location.pathname || '';
        if (path.includes('/japanese/frontend')) {
            return '../../icons/';
        }
        if (path.includes('/hanzi/') || path.includes('/english/') || path.includes('/music/')) {
            return '../icons/';
        }
        return './icons/';
    }

    function getBtnClass(type) {
        if (type === 'danger') return 'kid-dialog-btn-danger';
        if (type === 'warning' || type === 'exit') return 'kid-dialog-btn-warning';
        if (type === 'success') return 'kid-dialog-btn-success';
        return 'kid-dialog-btn-primary';
    }

    function renderDialogIcon(iconEl, iconVal) {
        if (typeof iconVal === 'string' && (iconVal.endsWith('.png') || iconVal.endsWith('.jpg') || iconVal.startsWith('.') || iconVal.startsWith('/') || iconVal.startsWith('http'))) {
            const img = document.createElement('img');
            img.src = iconVal;
            img.alt = 'Apiapia';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:18px;';
            iconEl.appendChild(img);
        } else {
            iconEl.textContent = iconVal;
        }
    }

    function createKidDialog(config) {
        const {
            title = '温馨提示',
            message = '',
            icon = '',
            type = 'primary',
            confirmText = '确定',
            cancelText = '取消',
            showCancel = true,
            input = null
        } = config;

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

            let msgEl = null;
            if (message || !input) {
                msgEl = document.createElement('div');
                msgEl.className = 'kid-dialog-message';
                msgEl.textContent = message;
            }

            let inputEl = null;
            if (input) {
                inputEl = document.createElement('input');
                inputEl.type = input.inputType || 'text';
                inputEl.className = 'kid-dialog-input';
                inputEl.placeholder = input.placeholder || '';
                inputEl.value = input.defaultValue || '';
                inputEl.autocomplete = 'off';
            }

            const actions = document.createElement('div');
            actions.className = showCancel ? 'kid-dialog-actions' : 'kid-dialog-actions kid-single-btn';

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = `kid-dialog-btn ${getBtnClass(type)}`;
            confirmBtn.textContent = confirmText;

            let closed = false;
            const closeWithResult = (result) => {
                if (closed) return;
                closed = true;
                window.removeEventListener('keydown', keyHandler);
                overlay.classList.add('kid-closing');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    resolve(result);
                }, 150);
            };

            const getConfirmValue = () => {
                if (inputEl) return inputEl.value.trim();
                return showCancel ? true : undefined;
            };
            const getCancelValue = () => {
                if (inputEl) return null;
                return showCancel ? false : undefined;
            };

            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    closeWithResult(getCancelValue());
                } else if (e.key === 'Enter') {
                    closeWithResult(getConfirmValue());
                }
            };
            window.addEventListener('keydown', keyHandler);

            if (showCancel) {
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'kid-dialog-btn kid-dialog-btn-cancel';
                cancelBtn.textContent = cancelText;
                cancelBtn.onclick = () => closeWithResult(getCancelValue());
                actions.appendChild(cancelBtn);
            }

            confirmBtn.onclick = () => closeWithResult(getConfirmValue());
            actions.appendChild(confirmBtn);

            card.appendChild(iconEl);
            card.appendChild(titleEl);
            if (msgEl) card.appendChild(msgEl);
            if (inputEl) card.appendChild(inputEl);
            card.appendChild(actions);

            overlay.appendChild(card);
            document.body.appendChild(overlay);

            if (inputEl) {
                setTimeout(() => {
                    inputEl.focus();
                    if (input.defaultValue) {
                        inputEl.select();
                    }
                }, 50);
            } else {
                confirmBtn.focus();
            }
        });
    }

    /**
     * 二次确认弹窗 (Promise 接口)
     */
    window.kidConfirm = function(options = {}) {
        const opts = typeof options === 'string' ? { message: options } : options;
        return createKidDialog({
            title: opts.title || '请确认',
            message: opts.message || '',
            icon: opts.icon || '',
            type: opts.type || 'primary',
            confirmText: opts.confirmText || '确定',
            cancelText: opts.cancelText || '取消',
            showCancel: true
        });
    };

    /**
     * 单按钮提示弹窗 (Promise 接口，替代原生 alert)
     */
    window.kidAlert = function(options = {}) {
        const opts = typeof options === 'string' ? { message: options } : options;
        return createKidDialog({
            title: opts.title || '温馨提示',
            message: opts.message || '',
            icon: opts.icon || '',
            type: opts.type || 'primary',
            confirmText: opts.confirmText || '我知道啦 👍',
            showCancel: false
        });
    };

    /**
     * 儿童友好统一单行文本输入弹窗 (Promise 接口，替代原生 prompt)
     */
    window.kidPrompt = function(options = {}) {
        const opts = typeof options === 'string' ? { message: options } : options;
        return createKidDialog({
            title: opts.title || '请输入内容',
            message: opts.message || '',
            icon: opts.icon || '✏️',
            type: opts.type || 'primary',
            confirmText: opts.confirmText || '确定',
            cancelText: opts.cancelText || '取消',
            showCancel: true,
            input: {
                placeholder: opts.placeholder || '',
                defaultValue: opts.defaultValue || '',
                inputType: opts.inputType || 'text'
            }
        });
    };

    /**
     * 练习退出专用二次确认弹窗
     */
    window.kidConfirmExitPractice = function(options = {}) {
        return window.kidConfirm({
            title: options.title || '🐱 猫咪 Apiapia 悄悄问：',
            message: options.message || '今天表现超棒！确定要先休息一下吗？本轮练习进度猫咪随时准备陪你继续哦！',
            icon: options.icon || (getIconsBasePath() + 'apple-touch-icon.png'),
            type: 'exit',
            confirmText: options.confirmText || '先休息啦',
            cancelText: options.cancelText || '继续加油'
        });
    };

    let activeToast = null;
    let toastTimer = null;

    /**
     * 全局统一儿童友好气泡提示 (Toast)
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
    // 满分成就奖 · Apiapia 喵星特效奖励系统与礼花粒子引擎
    // ============================================================
    let celebrationAudioCtx = null;

    function playCelebrationChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!celebrationAudioCtx || celebrationAudioCtx.state === 'closed') {
                celebrationAudioCtx = new AudioCtx();
            }
            const ctx = celebrationAudioCtx;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
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
        } catch (e) {}
    }

    /**
     * 全局通用 Canvas 彩带礼花动画
     */
    window.kidConfetti = function(options = {}) {
        try {
            const {
                originY = 0.3,
                count = 90,
                duration = 4500,
                canvas: providedCanvas = null
            } = options;

            const isOwnCanvas = !providedCanvas;
            const canvas = providedCanvas || document.createElement('canvas');
            if (isOwnCanvas) {
                canvas.className = 'kid-reward-confetti-canvas';
                document.body.appendChild(canvas);
            }

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

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: width * 0.5 + (Math.random() - 0.5) * 160,
                    y: height * originY + (Math.random() - 0.5) * 80,
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
            const startTime = Date.now();
            const fadeStart = Math.max(800, duration * 0.48);

            const cleanup = () => {
                if (animId) {
                    cancelAnimationFrame(animId);
                    animId = null;
                }
                window.removeEventListener('resize', onResize);
                if (isOwnCanvas && canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            };

            function render() {
                const elapsed = Date.now() - startTime;
                ctx.clearRect(0, 0, width, height);

                let activeCount = 0;
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.32;
                    p.vx *= 0.985;
                    p.rotation += p.rotSpeed;

                    if (elapsed > fadeStart) {
                        p.opacity = Math.max(0, p.opacity - 0.025);
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

                if (activeCount > 0 && elapsed < duration) {
                    animId = requestAnimationFrame(render);
                } else {
                    cleanup();
                }
            }

            animId = requestAnimationFrame(render);
            return cleanup;
        } catch (e) {
            return () => {};
        }
    };

    /**
     * 全局 100% 满分成就奖 · Apiapia 喵星特效奖励弹窗
     */
    window.showApiapiaPerfectReward = function(options = {}) {
        const {
            moduleName = '练习',
            detail = '',
            onClose = null
        } = options;

        const base = getIconsBasePath();
        const images = {
            real: base + 'apiapia-real.jpg',
            cartoon: base + 'apiapia-cartoon.jpg'
        };

        playCelebrationChime();

        const overlay = document.createElement('div');
        overlay.className = 'kid-reward-overlay';

        const canvas = document.createElement('canvas');
        canvas.className = 'kid-reward-confetti-canvas';
        overlay.appendChild(canvas);

        const stopConfetti = window.kidConfetti({ canvas, originY: 0.3, count: 90, duration: 4500 });

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
                你在【<b class="kid-reward-highlight"></b>】中表现超级完美！<br />
                <span class="kid-reward-detail" style="display:none"></span>
                <br class="kid-reward-detail-br" style="display:none" />
                代言猫咪 <b>Apiapia</b> 送来满满能量与专属学霸勋章！
            </p>

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

            <button type="button" class="kid-reward-btn">
                <span>收下奖励 · 继续加油 🐾</span>
            </button>
        `;

        // 使用 textContent 安全填充用户/模块动态文本，杜绝 XSS
        const highlightEl = card.querySelector('.kid-reward-highlight');
        if (highlightEl) highlightEl.textContent = String(moduleName);
        if (detail) {
            const detailEl = card.querySelector('.kid-reward-detail');
            const detailBr = card.querySelector('.kid-reward-detail-br');
            if (detailEl) {
                detailEl.textContent = String(detail);
                detailEl.style.display = 'inline-block';
            }
            if (detailBr) detailBr.style.display = 'inline';
        }

        const photoList = [
            { key: 'cartoon', title: '🎨 卡通萌喵 · Apiapia', url: images.cartoon },
            { key: 'real', title: '📸 真实猫咪 · Apiapia 本尊', url: images.real }
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
                        <button type="button" class="kid-lightbox-nav-btn ${currentKey === 'cartoon' ? 'active' : ''}" data-key="cartoon">🎨 卡通形象</button>
                        <button type="button" class="kid-lightbox-nav-btn ${currentKey === 'real' ? 'active' : ''}" data-key="real">📸 真实照片</button>
                    </div>
                    <div class="kid-lightbox-hint">💡 轻触大图任意处或右上角 ✕ 即可返回</div>
                `;

                const closeLightbox = () => {
                    lbOverlay.classList.add('kid-closing');
                    setTimeout(() => {
                        if (lbOverlay.parentNode) lbOverlay.parentNode.removeChild(lbOverlay);
                    }, 180);
                };

                const closeBtn = lbOverlay.querySelector('.kid-lightbox-close-btn');
                const imgEl = lbOverlay.querySelector('.kid-lightbox-img');
                if (closeBtn) closeBtn.onclick = closeLightbox;
                if (imgEl) imgEl.onclick = closeLightbox;
                lbOverlay.onclick = (e) => { if (e.target === lbOverlay) closeLightbox(); };

                lbOverlay.querySelectorAll('.kid-lightbox-nav-btn').forEach(b => {
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

        const cartoonBox = card.querySelector('.kid-photo-cartoon');
        if (cartoonBox) cartoonBox.onclick = () => openPhotoLightbox('cartoon');
        const realBox = card.querySelector('.kid-photo-real');
        if (realBox) realBox.onclick = () => openPhotoLightbox('real');

        const closeReward = () => {
            stopConfetti();
            overlay.classList.add('kid-closing');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (typeof onClose === 'function') onClose();
            }, 200);
        };

        const btn = card.querySelector('.kid-reward-btn');
        if (btn) btn.onclick = closeReward;
        overlay.onclick = (e) => { if (e.target === overlay) closeReward(); };

        overlay.appendChild(card);
        document.body.appendChild(overlay);
        if (btn) btn.focus();
    };

    /* ============================================================
     * Apiapia 全局按键物理点按与触感反馈系统 (Tactile & Haptic Engine)
     * ============================================================ */
    (function initApiapiaTapFeedback() {
        if (typeof window !== 'undefined') {
            const wakeActiveState = () => {};
            window.addEventListener('touchstart', wakeActiveState, { passive: true });
            window.addEventListener('pointerdown', wakeActiveState, { passive: true });
        }

        let lastTapTime = 0;

        function triggerHaptic(type = 'light') {
            try {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(type === 'heavy' ? 15 : 8);
                }
            } catch (e) {}
        }

        function findInteractiveTarget(el) {
            if (!el || el === document.body || el === document.documentElement) return null;
            return el.closest(
                'button, [role="button"], .choice-option, .clickable, ' +
                '.kid-btn-primary, .kid-btn-success, .kid-btn-danger, .kid-btn-warning, .kid-btn-light, .kid-btn-cyan, ' +
                '.van-button, .app-bottom-nav button, a.btn, input[type="button"], input[type="submit"], ' +
                '#startBtn, #choiceStartBtn, #storyStartBtn, ' +
                '.kid-dialog-btn, .kid-reward-btn'
            );
        }

        function handlePointerDown(e) {
            const btn = findInteractiveTarget(e.target);
            if (!btn) return;
            if (btn.disabled || btn.getAttribute('aria-disabled') === 'true' || btn.classList.contains('disabled')) {
                return;
            }
            const now = Date.now();
            if (now - lastTapTime < 45) return;
            lastTapTime = now;

            const isHeavy = btn.classList.contains('kid-btn-primary') ||
                            btn.classList.contains('kid-btn-success') ||
                            btn.classList.contains('kid-btn-danger') ||
                            btn.classList.contains('kid-dialog-btn-primary');

            triggerHaptic(isHeavy ? 'heavy' : 'light');
        }

        if (window.PointerEvent) {
            document.addEventListener('pointerdown', handlePointerDown, { passive: true, capture: true });
        } else {
            document.addEventListener('touchstart', handlePointerDown, { passive: true, capture: true });
            document.addEventListener('mousedown', handlePointerDown, { passive: true, capture: true });
        }
    })();

})();
