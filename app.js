// Vue 3 + Vant 4 业务逻辑
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

const app = createApp({
    setup() {
        // 夜间护眼模式响应式状态与方法
        const isDark = ref(window.isDarkTheme ? window.isDarkTheme() : false);
        const toggleTheme = () => {
            if (window.toggleTheme) {
                window.toggleTheme({ showToast: true });
                isDark.value = window.isDarkTheme();
            }
        };

        const onThemeChanged = (e) => {
            if (e && e.detail) {
                isDark.value = e.detail.isDark;
            } else if (window.isDarkTheme) {
                isDark.value = window.isDarkTheme();
            }
        };
        window.addEventListener('apiapia-theme-changed', onThemeChanged);

        // ==========================================
        // 手机桌面安装与 PWA 引导支持
        // ==========================================
        const envInfo = window.ApiapiaEnv || {};
        const isIOS = ref(Boolean(envInfo.isIOS));
        const isWechat = ref(Boolean(envInfo.isWechat));
        const isMobile = ref(Boolean(envInfo.isMobile));
        const isStandalone = ref(Boolean(envInfo.isStandalone));

        const canInstallDirectly = ref(false); // 是否获得 beforeinstallprompt 原生调起支持
        const showInstallBanner = ref(false);  // 底部可爱安装横幅
        const showInstallModal = ref(false);   // 详细安装引导弹窗
        let deferredInstallPrompt = null;

        // 检查是否应当自动弹出安装提示（智能防打扰）
        const checkAutoShowInstallPrompt = () => {
            // 1. 已在桌面图标模式打开，绝不弹窗打扰
            if (isStandalone.value) return;

            // 2. 本地已标记已安装过，绝不弹窗打扰
            if (localStorage.getItem('apiapia_installed_flag') === 'true') return;

            // 3. 检查用户关闭后的冷却期（7天内不再主动打扰）
            const dismissedUntil = localStorage.getItem('apiapia_install_dismissed_until');
            if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
                return;
            }

            // 4. 移动端或已就绪时展示底部安装横幅
            if (isMobile.value || canInstallDirectly.value) {
                showInstallBanner.value = true;
            }
        };

        // 用户点击横幅或按钮触发安装
        const triggerInstall = async () => {
            if (canInstallDirectly.value && deferredInstallPrompt) {
                try {
                    deferredInstallPrompt.prompt();
                    const choiceResult = await deferredInstallPrompt.userChoice;
                    if (choiceResult && choiceResult.outcome === 'accepted') {
                        localStorage.setItem('apiapia_installed_flag', 'true');
                        showInstallBanner.value = false;
                        showInstallModal.value = false;
                        if (window.kidToast) {
                            window.kidToast('🎉 太棒啦！已添加到桌面，欢迎随时打开自学！', 'success');
                        }
                    } else {
                        dismissInstallBanner();
                    }
                    deferredInstallPrompt = null;
                    canInstallDirectly.value = false;
                } catch (e) {
                    console.warn('调起安装异常:', e);
                    showInstallModal.value = true;
                }
            } else {
                // iOS Safari、微信或其它浏览器展示图文指引
                showInstallModal.value = true;
            }
        };

        const openInstallGuide = () => {
            showInstallModal.value = true;
        };

        const closeInstallModal = () => {
            showInstallModal.value = false;
        };

        const dismissInstallBanner = () => {
            showInstallBanner.value = false;
            // 记录 7 天冷却期
            localStorage.setItem('apiapia_install_dismissed_until', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
        };

        const onBeforeInstallPrompt = (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            canInstallDirectly.value = true;
            checkAutoShowInstallPrompt();
        };

        const onAppInstalled = () => {
            deferredInstallPrompt = null;
            canInstallDirectly.value = false;
            showInstallBanner.value = false;
            showInstallModal.value = false;
            localStorage.setItem('apiapia_installed_flag', 'true');
            if (window.kidToast) {
                window.kidToast('🎉 太棒啦！已成功安装到手机桌面！', 'success');
            }
        };

        // 上次学习记录
        const lastVisitedModule = ref(localStorage.getItem('study_hub_last_module') || '');

        // 今日日期格式化
        const currentDateText = computed(() => {
            try {
                const now = new Date();
                return now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
            } catch (e) {
                return '今日学习';
            }
        });

        // 全站真实数据规模常量（与各模块词库/字库精确对齐）
        const hubStats = {
            japaneseWords: 2785,
            japaneseSentences: 438,
            japaneseKana: 104,
            hanziChars: 315,
            englishVerbs: 100,
            englishArticles: 10
        };

        // 学习模块配置数据 (与项目实际数据及功能 100% 精确对齐)
        const modules = ref([
            {
                id: 'japanese',
                title: '日语听力与假名',
                subtitle: `五十音田字格 · ${hubStats.japaneseWords}词盲听 · ${hubStats.japaneseSentences}句例句`,
                icon: '🎌',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
                barClass: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
                cardBorder: 'border-indigo-200 hover:border-indigo-400',
                btnClass: 'kid-btn-primary',
                userProgressText: `${hubStats.japaneseWords} 词 · ${hubStats.japaneseSentences} 句 · ${hubStats.japaneseKana} 假名`,
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '五十音田字格', color: '#6366f1' },
                    { text: `${hubStats.japaneseWords}词盲听`, color: '#10b981' },
                    { text: '情境例句', color: '#8b5cf6' }
                ],
                url: 'japanese/frontend/index.html',
                btnText: '日语学习'
            },
            {
                id: 'hanzi',
                title: '汉字听写与笔顺',
                subtitle: '已学字库 · iPad笔画纠错 · 故事巩固',
                icon: '✍️',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                barClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500',
                cardBorder: 'border-emerald-300 hover:border-emerald-500',
                btnClass: 'kid-btn-success',
                userProgressText: 'iPad笔画手写 · 故事阅读 · 错字巩固',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: 'iPad笔画手写', color: '#10b981' },
                    { text: '纸上听写核对', color: '#f59e0b' },
                    { text: '故事阅读巩固', color: '#6366f1' }
                ],
                url: 'hanzi/hanzi.html',
                btnText: '汉字学习'
            },
            {
                id: 'music',
                title: '钢琴视奏与识音',
                subtitle: '超大五线谱 · 麦克风真钢识音 · 纠错',
                icon: '🎹',
                iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
                barClass: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500',
                cardBorder: 'border-cyan-300 hover:border-cyan-500',
                btnClass: 'kid-btn-cyan',
                userProgressText: '高低音谱号 · 麦克风真钢识音',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '大字号五线谱', color: '#0284c7' },
                    { text: '真钢琴音色', color: '#10b981' },
                    { text: '轻弹秒识别', color: '#6366f1' }
                ],
                url: 'music/index.html',
                btnText: '钢琴视奏'
            },
            {
                id: 'english',
                title: '英语学习乐园',
                subtitle: '托业短文精读 · 核心100动词 · 3D闪卡',
                icon: '🔤',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
                barClass: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
                cardBorder: 'border-indigo-300 hover:border-indigo-500',
                btnClass: 'kid-btn-primary',
                userProgressText: '托业商务短文 · 核心动词 3D 闪卡',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '托业短文点读', color: '#6366f1' },
                    { text: '3D翻牌', color: '#f43f5e' },
                    { text: '双语发音', color: '#0284c7' }
                ],
                url: 'english/english.html',
                btnText: '学英语'
            }
        ]);

        // 动态加载各模块在用户本地的实际学习足迹与进度
        const refreshModuleProgress = () => {
            // 1. 日语模块进度
            try {
                const jaRaw = localStorage.getItem('ja_vocab_list');
                const jaMod = modules.value.find(m => m.id === 'japanese');
                if (jaMod) {
                    if (jaRaw) {
                        const list = JSON.parse(jaRaw);
                        if (Array.isArray(list) && list.length > 0) {
                            const mastered = list.filter(w => (w.level || 0) >= 3).length;
                            const now = Date.now();
                            const due = list.filter(w => (w.level || 0) > 0 && w.next_review_date && w.next_review_date <= now).length;
                            const started = list.filter(w => (w.level || 0) > 0).length;
                            jaMod.dueCount = due;
                            jaMod.masteredCount = mastered;
                            if (started > 0) {
                                jaMod.userProgressText = `已学 ${started} 词 · 掌握 ${mastered} 词`;
                            } else {
                                jaMod.userProgressText = '尚未开始打卡，点击进入开启练习';
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('读取日语进度异常', e);
            }

            // 2. 汉字模块进度
            try {
                const hzRaw = localStorage.getItem('hanziDictationStatsV1');
                const hzMod = modules.value.find(m => m.id === 'hanzi');
                if (hzMod) {
                    if (hzRaw) {
                        const parsed = JSON.parse(hzRaw);
                        const charMap = (parsed && parsed.characters && typeof parsed.characters === 'object') ? parsed.characters : {};
                        const chars = Object.keys(charMap);
                        if (chars.length > 0) {
                            const now = Date.now();
                            const practicedChars = chars.filter(c => (charMap[c].practiced || 0) > 0).length;
                            const mastered = chars.filter(c => (charMap[c].level || 0) >= 3).length;
                            const due = chars.filter(c => (charMap[c].nextReviewDate || 0) <= now).length;
                            hzMod.dueCount = due;
                            hzMod.masteredCount = mastered;
                            hzMod.userProgressText = `已练 ${practicedChars}/${chars.length} 字 · 已掌握 ${mastered} 字`;
                        } else {
                            hzMod.userProgressText = '尚未开始打卡，点击开启汉字练习';
                        }
                    }
                }
            } catch (e) {
                console.warn('读取汉字进度异常', e);
            }

            // 3. 英语模块进度 (托业短文 + 核心动词)
            try {
                const enRaw = localStorage.getItem('englishWordProgress');
                const toeicRaw = localStorage.getItem('toeic_completed_articles');
                const enMod = modules.value.find(m => m.id === 'english');
                if (enMod) {
                    let known = 0;
                    let unknown = 0;
                    let toeicCount = 0;
                    if (enRaw) {
                        const progress = JSON.parse(enRaw);
                        const vals = Object.values(progress);
                        known = vals.filter(v => v === 'known').length;
                        unknown = vals.filter(v => v === 'unknown').length;
                        enMod.masteredCount = known;
                        enMod.dueCount = unknown;
                    }
                    if (toeicRaw) {
                        const tList = JSON.parse(toeicRaw);
                        if (Array.isArray(tList)) toeicCount = tList.length;
                    }
                    if (toeicCount > 0 || known > 0 || unknown > 0) {
                        const parts = [];
                        if (toeicCount > 0) parts.push(`短文通关 ${toeicCount}/10 篇`);
                        if (known > 0) parts.push(`动词掌握 ${known} 词`);
                        if (unknown > 0) parts.push(`需复习 ${unknown} 词`);
                        enMod.userProgressText = parts.join(' · ');
                    } else {
                        enMod.userProgressText = '尚未开始学习，点击进入短文精读与翻牌';
                    }
                }
            } catch (e) {
                console.warn('读取英语进度异常', e);
            }

            // 4. 钢琴视奏模块进度
            try {
                const musicRaw = localStorage.getItem('piano_app_stats');
                const musicMod = modules.value.find(m => m.id === 'music');
                if (musicMod) {
                    if (musicRaw) {
                        const stats = JSON.parse(musicRaw);
                        if (stats && stats.totalCorrect > 0) {
                            musicMod.masteredCount = stats.totalCorrect;
                            musicMod.userProgressText = `已累计弹对 ${stats.totalCorrect} 题 · 最高连击 ${stats.maxStreak || stats.totalCorrect} 次 🔥`;
                        } else {
                            musicMod.userProgressText = '尚未开始练习，点击进入五线谱识音';
                        }
                    }
                }
            } catch (e) {
                console.warn('读取钢琴进度异常', e);
            }
        };

        // ==========================================
        // 页面切换进度条与正在进入控制器
        // ==========================================
        const pageProgress = ref(0);
        const isProgressActive = ref(false);
        const isCurrentModuleLoading = ref(false);
        let progressTimer = null;

        const startEnteringProgress = () => {
            if (progressTimer) clearInterval(progressTimer);
            pageProgress.value = 25;
            isProgressActive.value = true;
            isCurrentModuleLoading.value = true;
            progressTimer = setInterval(() => {
                if (pageProgress.value < 88) {
                    const diff = 88 - pageProgress.value;
                    const step = Math.max(3, diff * 0.25);
                    pageProgress.value = Math.min(88, Math.round(pageProgress.value + step));
                }
            }, 50);
        };

        const finishEnteringProgress = () => {
            if (progressTimer) clearInterval(progressTimer);
            pageProgress.value = 100;
            setTimeout(() => {
                isCurrentModuleLoading.value = false;
                setTimeout(() => {
                    isProgressActive.value = false;
                    pageProgress.value = 0;
                }, 200);
            }, 160);
        };

        // ==========================================
        // SPA 单页 App 路由与全屏视图容器控制器
        // ==========================================
        const currentModuleId = ref('');
        const activeModulesList = ref([]);
        const loadedModulesMap = ref({});

        const currentModuleMeta = computed(() => {
            return modules.value.find(m => m.id === currentModuleId.value) || null;
        });

        const getTargetOrigin = () => {
            return (window.location && window.location.origin && window.location.origin !== 'null')
                ? window.location.origin
                : '*';
        };

        const syncAllIframesTheme = () => {
            const theme = isDark.value ? 'dark' : 'light';
            if (typeof window.broadcastTheme === 'function') {
                window.broadcastTheme(theme);
            }
        };

        const openModuleSPA = (id) => {
            const targetMod = modules.value.find(m => m.id === id);
            if (!targetMod) return;

            // 启动正在进入提示卡片与进度条
            startEnteringProgress();

            try {
                localStorage.setItem('study_hub_last_module', id);
                lastVisitedModule.value = id;
            } catch (e) {}

            const isAlreadyLoaded = loadedModulesMap.value[id] === true;

            // 若尚未加入活动容器池，则固定 initialUrl 后加入（避免切换夜间模式时重置 iframe src）
            if (!activeModulesList.value.some(m => m.id === id)) {
                const sep = targetMod.url.includes('?') ? '&' : '?';
                activeModulesList.value.push({
                    ...targetMod,
                    initialUrl: `${targetMod.url}${sep}theme=${isDark.value ? 'dark' : 'light'}`
                });
            }

            // 立即切换当前模块，直接全屏滑入呈现
            currentModuleId.value = id;

            // 同步当前夜间模式至子 Iframe，彻底杜绝白闪
            setTimeout(syncAllIframesTheme, 50);

            // 同步修改 Hash，支持手机系统返回键与浏览器前进后退自然生效
            const targetHash = '#/' + id;
            if (window.location.hash !== targetHash) {
                history.pushState(null, '', targetHash);
            }

            // 若该模块此前已加载就绪，伴随滑入动效完成进度条冲刺
            if (isAlreadyLoaded) {
                setTimeout(() => {
                    finishEnteringProgress();
                }, 260);
            }
        };

        const onModuleIframeLoaded = (id) => {
            loadedModulesMap.value[id] = true;
            finishEnteringProgress();
            syncAllIframesTheme();
        };

        // 统一平滑返回学习中心首页
        const navigateHome = () => {
            if (!currentModuleId.value) return;

            const targetOrigin = getTargetOrigin();
            // 广播通知子应用已失焦（可停止朗读、麦克风等）
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow?.postMessage({ type: 'SPA_MODULE_DEACTIVATED' }, targetOrigin);
                } catch (e) {}
            });

            currentModuleId.value = '';

            // 更新 Hash
            if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#') {
                history.pushState(null, '', '#/');
            }

            // 实时同步各个模块最新学习进度
            refreshModuleProgress();
        };

        // 响应 Hash 路由变化 (支持点击、后退、手势返回)
        const syncRouteFromHash = () => {
            const hash = window.location.hash.replace(/^#\/?/, '').trim();
            if (hash && modules.value.some(m => m.id === hash)) {
                if (currentModuleId.value !== hash) {
                    openModuleSPA(hash);
                }
            } else {
                if (currentModuleId.value) {
                    navigateHome();
                }
            }
        };

        const onWindowMessage = (event) => {
            if (window.location && window.location.origin && window.location.origin !== 'null' && event.origin !== window.location.origin) {
                return;
            }
            if (event.data && event.data.type === 'SPA_NAVIGATE_HOME') {
                navigateHome();
            }
        };

        const onPageShow = () => {
            refreshModuleProgress();
        };

        onMounted(() => {
            refreshModuleProgress();
            window.addEventListener('pageshow', onPageShow);

            // 注册 PWA ServiceWorker
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
                        console.log('[SW] PWA ServiceWorker registered with scope:', reg.scope);
                    }).catch(err => {
                        console.warn('[SW] Registration failed:', err);
                    });
                });
            }

            // 注册 PWA 桌面安装与完成事件
            window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.addEventListener('appinstalled', onAppInstalled);

            // 注册 SPA 路由与父子通信监听
            window.addEventListener('hashchange', syncRouteFromHash);
            window.addEventListener('popstate', syncRouteFromHash);
            window.addEventListener('message', onWindowMessage);

            // 初始化根据当前 Hash 恢复视图
            syncRouteFromHash();

            // 延迟 1.5 秒检查是否弹出安装提示（不与页面初始载入抢焦点）
            setTimeout(() => {
                checkAutoShowInstallPrompt();
            }, 1500);
        });

        onUnmounted(() => {
            if (progressTimer) clearInterval(progressTimer);
            window.removeEventListener('pageshow', onPageShow);
            window.removeEventListener('apiapia-theme-changed', onThemeChanged);
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
            window.removeEventListener('hashchange', syncRouteFromHash);
            window.removeEventListener('popstate', syncRouteFromHash);
            window.removeEventListener('message', onWindowMessage);
        });

        return {
            isDark,
            toggleTheme,
            lastVisitedModule,
            currentDateText,
            hubStats,
            modules,
            openModuleSPA,
            // 顶部流光与正在进入提示状态
            pageProgress,
            isProgressActive,
            isCurrentModuleLoading,
            // PWA 安装与桌面引导相关
            isStandalone,
            isIOS,
            isWechat,
            canInstallDirectly,
            showInstallBanner,
            showInstallModal,
            triggerInstall,
            openInstallGuide,
            closeInstallModal,
            dismissInstallBanner,
            // SPA 单页应用控制器导出
            currentModuleId,
            currentModuleMeta,
            activeModulesList,
            onModuleIframeLoaded
        };
    }
});

// 注册 Vant 并挂载
app.use(vant);
app.mount('#app');
