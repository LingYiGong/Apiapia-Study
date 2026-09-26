// Vue 3 + Vant 4 业务逻辑
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// 当前客户端内置基线版本号
const BUILD_VERSION = '2.2.3';

// Semver 版本比较辅助函数 (remote > current 返回 true)
function isNewerVersion(remote, current) {
    if (!remote || !current) return false;
    const rParts = remote.split('.').map(num => parseInt(num, 10) || 0);
    const cParts = current.split('.').map(num => parseInt(num, 10) || 0);
    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
        const r = rParts[i] || 0;
        const c = cParts[i] || 0;
        if (r > c) return true;
        if (r < c) return false;
    }
    return false;
}

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

        // 当前版本与自动更新状态 (优先取本地已确认的最新版本，缺省采用 BUILD_VERSION)
        const storedVersion = localStorage.getItem('study_hub_version');
        // 若内置版本高于本地缓存版本，自动进位
        const initialVersion = isNewerVersion(BUILD_VERSION, storedVersion) ? BUILD_VERSION : (storedVersion || BUILD_VERSION);
        localStorage.setItem('study_hub_version', initialVersion);

        const appVersion = ref(initialVersion);
        const hasUpdate = ref(false);
        const latestVersion = ref('');
        const isChecking = ref(false);

        const checkForUpdates = async (isManual = false) => {
            if (isChecking.value) return;
            isChecking.value = true;
            try {
                const res = await fetch(`version.json?_t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });
                if (!res.ok) throw new Error('网络请求异常');
                const data = await res.json();
                const serverVersion = (data && data.version) ? data.version.trim() : '';

                if (serverVersion && isNewerVersion(serverVersion, appVersion.value)) {
                    latestVersion.value = serverVersion;
                    hasUpdate.value = true;
                    if (isManual) {
                        if (window.kidToast) {
                            window.kidToast(`🎉 发现新版本 v${serverVersion}！请点击上方更新`, 'warning');
                        } else if (window.vant && window.vant.showNotify) {
                            window.vant.showNotify({ type: 'warning', message: `🎉 发现新版本 v${serverVersion}！请点击上方更新` });
                        }
                    }
                } else {
                    hasUpdate.value = false;
                    // 同步记录为当前版本
                    if (serverVersion && !isNewerVersion(appVersion.value, serverVersion)) {
                        appVersion.value = serverVersion;
                        localStorage.setItem('study_hub_version', serverVersion);
                    }
                    if (isManual) {
                        if (window.kidToast) {
                            window.kidToast(`已经是最新版本啦 ✨ (v${appVersion.value}) 跟着猫咪 Apiapia 一起闯关吧！`, 'success');
                        } else if (window.vant && window.vant.showToast) {
                            window.vant.showToast({ message: `已经是最新版本啦 ✨ (v${appVersion.value}) 跟着猫咪 Apiapia 一起闯关吧！`, icon: 'passed' });
                        }
                    }
                }
            } catch (e) {
                console.warn('检查更新失败:', e);
                if (isManual) {
                    if (window.kidToast) {
                        window.kidToast('检查更新失败，请稍候再试', 'error');
                    } else if (window.vant && window.vant.showToast) {
                        window.vant.showToast({ message: '检查更新失败，请稍候再试', icon: 'cross' });
                    }
                }
            } finally {
                isChecking.value = false;
            }
        };

        const manualCheckUpdate = () => {
            checkForUpdates(true);
        };

        const applyUpdate = async () => {
            const targetVer = latestVersion.value || appVersion.value;
            try {
                // 1. 本地立即记录最新版本，确保页面重载后直观显示新版本号
                if (targetVer) {
                    localStorage.setItem('study_hub_version', targetVer);
                    appVersion.value = targetVer;
                }
                hasUpdate.value = false;

                // 2. 清理 CacheStorage（若有 ServiceWorker 或浏览器文件强缓存）
                if (window.caches) {
                    const cacheKeys = await window.caches.keys();
                    await Promise.all(cacheKeys.map(k => window.caches.delete(k)));
                }
            } catch (e) {
                console.warn('清理更新缓存异常:', e);
            }

            // 3. 强制携带最新版本与时间戳重载，彻底击穿 Safari / PWA 磁盘缓存
            const url = new URL(window.location.href);
            url.searchParams.set('_v', targetVer || Date.now().toString());
            url.searchParams.set('_t', Date.now().toString());
            window.location.replace(url.toString());
        };

        const dismissUpdate = () => {
            hasUpdate.value = false;
        };

        // 监听应用回到前台（如 iPad 从后台切换回来）自动静默检查
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForUpdates(false);
            }
        };

        // ==========================================
        // 手机桌面安装与 PWA 引导支持
        // ==========================================
        const ua = navigator.userAgent || '';
        const isIOS = ref(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
        const isWechat = ref(/MicroMessenger/i.test(ua));
        const isMobile = ref(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

        // 检测是否已经在独立桌面 App 模式运行 (PWA standalone 或 iOS WebClip)
        const isStandalone = ref(
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );

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

        // 学习模块配置数据 (与项目实际数据及功能 100% 精确对齐)
        const modules = ref([
            {
                id: 'japanese',
                title: '日语听力与假名',
                subtitle: '五十音田字格 · 1912词盲听 · 226句例句',
                icon: '🎌',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
                barClass: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
                cardBorder: 'border-indigo-200 hover:border-indigo-400',
                btnClass: 'kid-btn-primary',
                userProgressText: '1912 词 · 226 句 · 104 假名',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '五十音田字格', color: '#6366f1' },
                    { text: '1912词盲听', color: '#10b981' },
                    { text: '情境例句', color: '#8b5cf6' }
                ],
                url: 'japanese/frontend/index.html',
                btnText: '日语学习'
            },
            {
                id: 'hanzi',
                title: '汉字听写与笔顺',
                subtitle: '170 启蒙字 · 规范笔顺动画 · 选字',
                icon: '✍️',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                barClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500',
                cardBorder: 'border-emerald-300 hover:border-emerald-500',
                btnClass: 'kid-btn-success',
                userProgressText: '170 常用启蒙生字 · 规范笔顺',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '标准田字格', color: '#10b981' },
                    { text: '慢动作笔顺', color: '#f59e0b' },
                    { text: '5选1选字', color: '#6366f1' }
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
                title: '英语核心动词卡',
                subtitle: '100 高频动词 · 3D 双面翻牌 · 掌握度',
                icon: '🔤',
                iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
                barClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500',
                cardBorder: 'border-rose-300 hover:border-rose-500',
                btnClass: 'kid-btn-danger',
                userProgressText: '100 核心动词 · 3D 闪卡',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '3D立体翻牌', color: '#f43f5e' },
                    { text: '真人双语发音', color: '#0284c7' },
                    { text: '掌握度看板', color: '#10b981' }
                ],
                url: 'english/english.html',
                btnText: '英语词卡'
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
                        const stats = JSON.parse(hzRaw);
                        const chars = Object.keys(stats);
                        if (chars.length > 0) {
                            const mastered = chars.filter(c => stats[c].correct > 0 && (stats[c].wrong || 0) === 0).length;
                            hzMod.masteredCount = mastered;
                            hzMod.userProgressText = `已练 ${chars.length} / 170 字 · 满分掌握 ${mastered} 字`;
                        } else {
                            hzMod.userProgressText = '尚未开始打卡，点击开启笔顺练习';
                        }
                    }
                }
            } catch (e) {
                console.warn('读取汉字进度异常', e);
            }

            // 3. 英语模块进度
            try {
                const enRaw = localStorage.getItem('englishWordProgress');
                const enMod = modules.value.find(m => m.id === 'english');
                if (enMod) {
                    if (enRaw) {
                        const progress = JSON.parse(enRaw);
                        const vals = Object.values(progress);
                        const known = vals.filter(v => v === 'known').length;
                        const unknown = vals.filter(v => v === 'unknown').length;
                        enMod.masteredCount = known;
                        enMod.dueCount = unknown;
                        if (vals.length > 0) {
                            enMod.userProgressText = `已掌握 ${known} 词 · 需复习 ${unknown} 词`;
                        } else {
                            enMod.userProgressText = '尚未开始学习，点击开启翻牌卡片';
                        }
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

        const getModuleUrl = (mod) => {
            if (!mod || !mod.url) return '';
            const sep = mod.url.includes('?') ? '&' : '?';
            return `${mod.url}${sep}theme=${isDark.value ? 'dark' : 'light'}`;
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

            // 若尚未加入活动容器池，则加入
            if (!activeModulesList.value.some(m => m.id === id)) {
                activeModulesList.value.push(targetMod);
            }

            // 立即切换当前模块，直接全屏滑入呈现
            currentModuleId.value = id;

            // 同步将当前夜间模式预注入目标 Iframe，彻底杜绝白闪
            setTimeout(() => {
                try {
                    const iframe = document.getElementById('iframe-' + id);
                    if (iframe) {
                        if (iframe.contentDocument && iframe.contentDocument.documentElement) {
                            iframe.contentDocument.documentElement.classList.toggle('dark', isDark.value);
                            iframe.contentDocument.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
                        }
                        if (iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'APIAPIA_SET_THEME',
                                theme: isDark.value ? 'dark' : 'light'
                            }, '*');
                        }
                    }
                } catch (e) {}
            }, 50);

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

            // 向新加载就绪的子模块即时同步当前夜间模式状态
            try {
                const iframe = document.getElementById('iframe-' + id);
                if (iframe) {
                    if (iframe.contentDocument && iframe.contentDocument.documentElement) {
                        iframe.contentDocument.documentElement.classList.toggle('dark', isDark.value);
                        iframe.contentDocument.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
                    }
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'APIAPIA_SET_THEME',
                            theme: isDark.value ? 'dark' : 'light'
                        }, '*');
                    }
                }
            } catch (e) {}
        };

        // 统一平滑返回学习中心首页
        const navigateHome = () => {
            if (!currentModuleId.value) return;

            // 广播通知子应用已失焦（可停止朗读等）
            document.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow?.postMessage({ type: 'SPA_MODULE_DEACTIVATED' }, '*');
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

        // 重新加载当前子模块（当出现网络卡顿时，一键刷新）
        const reloadCurrentModule = () => {
            if (!currentModuleId.value) return;
            const iframe = document.getElementById('iframe-' + currentModuleId.value);
            if (iframe) {
                moduleLoadingMap.value[currentModuleId.value] = false;
                iframe.src = iframe.src;
            }
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
            if (event.data && event.data.type === 'SPA_NAVIGATE_HOME') {
                navigateHome();
            }
        };

        // 模块卡片点击入口 (由传统链接跳转改造为 SPA 无缝切换)
        const goToModule = (url, id) => {
            openModuleSPA(id);
        };

        onMounted(() => {
            checkForUpdates(false);
            refreshModuleProgress();
            document.addEventListener('visibilitychange', onVisibilityChange);
            window.addEventListener('pageshow', () => {
                checkForUpdates(false);
                refreshModuleProgress();
            });

            // 注册 PWA ServiceWorker
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js?v=' + BUILD_VERSION).then((reg) => {
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
            window.removeEventListener('apiapia-theme-changed', onThemeChanged);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
            window.removeEventListener('hashchange', syncRouteFromHash);
            window.removeEventListener('popstate', syncRouteFromHash);
            window.removeEventListener('message', onWindowMessage);
        });

        return {
            isDark,
            toggleTheme,
            appVersion,
            hasUpdate,
            latestVersion,
            isChecking,
            manualCheckUpdate,
            applyUpdate,
            dismissUpdate,
            lastVisitedModule,
            currentDateText,
            modules,
            goToModule,
            // 顶部流光与正在进入提示状态
            pageProgress,
            isProgressActive,
            isCurrentModuleLoading,
            // PWA 安装与桌面引导相关
            isStandalone,
            isIOS,
            isWechat,
            isMobile,
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
            getModuleUrl,
            onModuleIframeLoaded,
            navigateHome,
            reloadCurrentModule
        };
    }
});

// 注册 Vant 并挂载
app.use(vant);
app.mount('#app');
