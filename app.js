// Vue 3 + Vant 4 业务逻辑
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// 当前客户端内置基线版本号
const BUILD_VERSION = '1.0.16';

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



        onUnmounted(() => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        });

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
                    { text: '五十音田字格手写', color: '#6366f1' },
                    { text: '1912 词纯盲听', color: '#10b981' },
                    { text: '情境例句点读', color: '#8b5cf6' }
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
                    { text: '5选1听音选字', color: '#6366f1' }
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
                    { text: '真实钢琴音色', color: '#10b981' },
                    { text: '轻弹秒级识别', color: '#6366f1' }
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
                userProgressText: '100 核心高频动词 · 3D 闪卡',
                dueCount: 0,
                masteredCount: 0,
                tags: [
                    { text: '3D立体翻牌', color: '#f43f5e' },
                    { text: '真人双语发音', color: '#0284c7' },
                    { text: '掌握度环看板', color: '#10b981' }
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

        // 模块跳转与记录
        const goToModule = (url, id) => {
            try {
                localStorage.setItem('study_hub_last_module', id);
                lastVisitedModule.value = id;
            } catch (e) {}
            window.location.href = url;
        };

        onMounted(() => {
            checkForUpdates(false);
            refreshModuleProgress();
            document.addEventListener('visibilitychange', onVisibilityChange);
            window.addEventListener('pageshow', () => {
                checkForUpdates(false);
                refreshModuleProgress();
            });
        });

        return {
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
            goToModule
        };
    }
});

// 注册 Vant 并挂载
app.use(vant);
app.mount('#app');
