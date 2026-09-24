const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

        const LOCAL_STORAGE_KEY = 'ja_vocab_list';

        const app = createApp({
            setup() {
                // Main State
                const currentTab = ref('practice');
                const words = ref([]);
                const toastMessage = ref('');
                let toastTimer = null;

                const showToast = (msg, type = 'info') => {
                    if (window.kidToast) {
                        window.kidToast(msg, type);
                    } else if (typeof vant !== 'undefined' && vant.showToast) {
                        vant.showToast({ message: msg, position: 'top', duration: 2200 });
                    }
                    toastMessage.value = msg;
                    clearTimeout(toastTimer);
                    toastTimer = setTimeout(() => {
                        toastMessage.value = '';
                    }, 3000);
                };

                // Form & Management State
                const form = ref({ word: '', kana: '', meaning: '' });
                const editingId = ref(null);
                const showAddForm = ref(false);
                const searchQuery = ref('');
                const currentPage = ref(1);
                const pageSize = 50;

                // Practice State (Words)
                const practiceState = ref('idle'); // 'idle', 'listening', 'reveal'
                const todayQueue = ref([]);
                const initialQueueLength = ref(0);

                // Sentence Practice State
                const LOCAL_STORAGE_SENTENCES_KEY = 'japanese_study_sentences_v1';
                const sentences = ref([]);
                const sentenceScope = ref('learned'); // 'learned', 'all'
                const sentencePracticeState = ref('idle'); // 'idle', 'listening', 'reveal'
                const sentenceQueue = ref([]);
                const initialSentenceQueueLength = ref(0);

                // Management Sub-Tab & Sentence Browser
                const manageSubTab = ref('words'); // 'words' | 'sentences'
                const sentenceSearchQuery = ref('');
                const sentenceCurrentPage = ref(1);
                const sentencePageSize = 20;

                // Cloudflare Cloud Sync Config
                const SYNC_KEY_STORAGE = 'japanese_study_sync_key_v1';
                const AUTO_SYNC_STORAGE = 'japanese_study_auto_sync_v1';
                const showSyncModal = ref(false);
                const syncKey = ref(localStorage.getItem(SYNC_KEY_STORAGE) || '');
                const autoSync = ref(localStorage.getItem(AUTO_SYNC_STORAGE) === 'true');
                const syncStatus = ref('idle'); // 'idle', 'syncing', 'success', 'error'
                const syncStatusText = ref('空闲');
                const lastSyncTime = ref(localStorage.getItem('japanese_study_last_sync_time') || '');
                let debounceSyncTimer = null;
                
                // Audio / Voice Engine Config (v2: 真人级自然语流 & iPad 高清声优优化)
                const isIOS = typeof navigator !== 'undefined' && (
                    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
                );
                const isMobile = typeof navigator !== 'undefined' && (
                    isIOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                );

                const AUDIO_CONFIG_KEY = 'japanese_study_audio_config_v4';
                const showAudioSettings = ref(false);
                // 默认采用【真人原声发音】（日本直连 Google 纯正东京腔 WaveNet 真实语流，带智能预加载与缓存池）
                const audioEngine = ref('online'); 
                // 默认采用 'word'（真人自然语调 / 汉字原文），保持纯正东京腔高低起伏；可切换 'kana'（纯假名逐字拼读）
                const audioTarget = ref('word'); 
                const speechRate = ref(1.0); // 1.0, 1.2, 1.35, 1.5
                const jaVoiceName = ref('');
                const availableVoices = ref([]);

                const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
                let currentAudio = null;

                const initVoices = () => {
                    if (!synth) return;
                    const allVoices = synth.getVoices() || [];
                    const jaVoices = allVoices.filter(v => 
                        (v.lang && (v.lang === 'ja-JP' || v.lang === 'ja' || v.lang.toLowerCase().replace('_', '-').startsWith('ja'))) ||
                        /japanese|日本語|kyoko|otoya|siri|hattori|nanami|keita|aoi|daichi|mayu|shiori/i.test(v.name)
                    );
                    availableVoices.value = jaVoices;

                    if (jaVoices.length > 0) {
                        if (!jaVoiceName.value || !jaVoices.some(v => v.name === jaVoiceName.value)) {
                            // 本地真人级音色匹配优先级：
                            // 1. Apple 原生 Siri 真人语音 (iPad/iOS 极品音质，完全本地离线)
                            // 2. 微软 Edge 自然神经语音 (Nanami 七海 / Keita 圭太)
                            // 3. Apple Kyoko 京子 (Enhanced 高清强化版优先)
                            // 4. Google 日本语自然语音
                            // 5. Apple Otoya 乙也
                            const siri = jaVoices.find(v => /siri/i.test(v.name));
                            const nanami = jaVoices.find(v => /nanami/i.test(v.name));
                            const keita = jaVoices.find(v => /keita/i.test(v.name));
                            const natural = jaVoices.find(v => /natural|online/i.test(v.name));
                            const kyokoEnhanced = jaVoices.find(v => /kyoko|京子/i.test(v.name) && /enhanced|premium|高品質|高品位/i.test(v.name));
                            const kyoko = jaVoices.find(v => /kyoko|京子/i.test(v.name));
                            const google = jaVoices.find(v => /google/i.test(v.name));
                            const otoya = jaVoices.find(v => /otoya|乙也/i.test(v.name));
                            jaVoiceName.value = (siri || nanami || keita || natural || kyokoEnhanced || kyoko || google || otoya || jaVoices[0]).name;
                        }
                    }
                };

                const getJapaneseVoice = () => {
                    if (!synth) return null;
                    const allVoices = synth.getVoices() || [];
                    if (availableVoices.value.length === 0 && allVoices.length > 0) {
                        initVoices();
                    }
                    const jaVoices = allVoices.filter(v => 
                        (v.lang && (v.lang === 'ja-JP' || v.lang === 'ja' || v.lang.toLowerCase().replace('_', '-').startsWith('ja'))) ||
                        /japanese|日本語|kyoko|otoya|siri|hattori|nanami|keita|aoi|daichi|mayu|shiori/i.test(v.name)
                    );
                    if (jaVoiceName.value) {
                        const found = jaVoices.find(v => v.name === jaVoiceName.value);
                        if (found) return found;
                    }
                    const siri = jaVoices.find(v => /siri/i.test(v.name));
                    const nanami = jaVoices.find(v => /nanami/i.test(v.name));
                    const keita = jaVoices.find(v => /keita/i.test(v.name));
                    const natural = jaVoices.find(v => /natural|online/i.test(v.name));
                    const kyokoEnhanced = jaVoices.find(v => /kyoko|京子/i.test(v.name) && /enhanced|premium|高品質|高品位/i.test(v.name));
                    const kyoko = jaVoices.find(v => /kyoko|京子/i.test(v.name));
                    const google = jaVoices.find(v => /google/i.test(v.name));
                    const otoya = jaVoices.find(v => /otoya|乙也/i.test(v.name));
                    return siri || nanami || keita || natural || kyokoEnhanced || kyoko || google || otoya || jaVoices[0] || null;
                };

                const loadAudioConfig = () => {
                    try {
                        const raw = localStorage.getItem(AUDIO_CONFIG_KEY);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (parsed.audioEngine) audioEngine.value = parsed.audioEngine;
                            if (parsed.audioTarget) audioTarget.value = parsed.audioTarget;
                            else audioTarget.value = 'word';
                            if (parsed.speechRate !== undefined && parsed.speechRate !== null) {
                                const r = Number(parsed.speechRate);
                                if (!isNaN(r) && r >= 0.8 && r <= 1.5) {
                                    speechRate.value = Math.round(r * 100) / 100;
                                } else {
                                    speechRate.value = 1.0;
                                }
                            }
                            if (parsed.jaVoiceName) jaVoiceName.value = parsed.jaVoiceName;
                        } else {
                            // 旧版 v1 / v2 / v3 缓存自动升级迁移：默认激活真人原声发音
                            const oldRaw = localStorage.getItem('japanese_study_audio_config_v3') || localStorage.getItem('japanese_study_audio_config_v2') || localStorage.getItem('japanese_study_audio_config_v1');
                            if (oldRaw) {
                                try {
                                    const oldParsed = JSON.parse(oldRaw);
                                    if (oldParsed.speechRate) speechRate.value = Number(oldParsed.speechRate) || 1.0;
                                    if (oldParsed.jaVoiceName) jaVoiceName.value = oldParsed.jaVoiceName;
                                } catch (e) {}
                            }
                            audioEngine.value = 'online'; // 统一默认采用真人原声发音
                            audioTarget.value = 'word';
                            saveAudioConfig();
                        }
                    } catch (e) {
                        console.error('Failed to load audio config', e);
                    }
                };

                const saveAudioConfig = () => {
                    try {
                        const r = Number(speechRate.value);
                        if (!isNaN(r) && r >= 0.8 && r <= 1.5) {
                            speechRate.value = Math.round(r * 100) / 100;
                        } else {
                            speechRate.value = 1.0;
                        }
                        localStorage.setItem(AUDIO_CONFIG_KEY, JSON.stringify({
                            audioEngine: audioEngine.value,
                            audioTarget: audioTarget.value,
                            speechRate: speechRate.value,
                            jaVoiceName: jaVoiceName.value
                        }));
                    } catch (e) {
                        console.error('Failed to save audio config', e);
                    }
                };

                // Load Data with auto-initialization from built-in vocab
                const loadData = () => {
                    let loadedWords = [];
                    try {
                        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                loadedWords = parsed;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse localStorage data', e);
                    }

                    if (loadedWords.length > 0) {
                        let hasChanges = false;
                        // Auto-fill missing meanings and append new built-in vocabulary while strictly preserving user learning history
                        try {
                            if (window.BUILTIN_VOCAB_ALL && Array.isArray(window.BUILTIN_VOCAB_ALL)) {
                                const idMap = new Map();
                                const existingWordMap = new Map();
                                loadedWords.forEach(w => {
                                    if (w.id) idMap.set(w.id, w);
                                    existingWordMap.set(`${w.word}__${w.kana}`, w);
                                    existingWordMap.set(w.word, w);
                                });

                                window.BUILTIN_VOCAB_ALL.forEach(item => {
                                    const exist = (item.id && idMap.get(item.id)) || existingWordMap.get(`${item.word}__${item.kana}`) || existingWordMap.get(item.word);
                                    if (exist) {
                                        if (!exist.meaning || exist.meaning.trim() === '') {
                                            exist.meaning = item.meaning;
                                            hasChanges = true;
                                        }
                                        if (exist.id === item.id) {
                                            if (exist.kana !== item.kana) {
                                                exist.kana = item.kana;
                                                hasChanges = true;
                                            }
                                            if (exist.word !== item.word) {
                                                exist.word = item.word;
                                                hasChanges = true;
                                            }
                                        }
                                    } else {
                                        loadedWords.push({
                                            ...item,
                                            level: 0,
                                            next_review_date: Date.now()
                                        });
                                        if (item.id) idMap.set(item.id, item);
                                        existingWordMap.set(`${item.word}__${item.kana}`, item);
                                        existingWordMap.set(item.word, item);
                                        hasChanges = true;
                                    }
                                });
                            }
                        } catch (mergeErr) {
                            console.error('Error auto-merging vocabulary:', mergeErr);
                        }

                        words.value = loadedWords;
                        if (hasChanges) {
                            saveData();
                            console.log('Auto-merged new built-in vocabulary into user list.');
                        }
                        return;
                    }

                    // Auto-load built-in vocabulary if localStorage is empty
                    if (window.BUILTIN_VOCAB_ALL && Array.isArray(window.BUILTIN_VOCAB_ALL) && window.BUILTIN_VOCAB_ALL.length > 0) {
                        words.value = JSON.parse(JSON.stringify(window.BUILTIN_VOCAB_ALL));
                        saveData();
                        showToast(`已自动载入内置词库（共 ${words.value.length} 词）`);
                    } else {
                        words.value = [];
                    }
                };

                // Save Data
                const saveData = () => {
                    try {
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(words.value));
                    } catch (e) {
                        console.error('Failed to save words to localStorage', e);
                        showToast('保存失败，可能浏览器存储空间已满');
                    }
                    triggerAutoSync();
                };

                // Cloudflare Cloud Sync Methods
                const saveSyncConfig = () => {
                    localStorage.setItem(SYNC_KEY_STORAGE, syncKey.value.trim());
                    localStorage.setItem(AUTO_SYNC_STORAGE, autoSync.value ? 'true' : 'false');
                    showToast('云同步配置已更新');
                };

                const triggerAutoSync = () => {
                    if (!autoSync.value || !syncKey.value.trim()) return;
                    clearTimeout(debounceSyncTimer);
                    debounceSyncTimer = setTimeout(() => {
                        pushToCloud(true);
                    }, 2500);
                };

                const pushToCloud = async (silent = false) => {
                    const key = syncKey.value.trim();
                    if (!key) {
                        if (!silent) {
                            if (window.kidAlert) {
                                window.kidAlert({
                                    title: '同步提示',
                                    message: '请先输入专属同步密钥 (Sync Key)！',
                                    icon: '💡',
                                    type: 'warning'
                                });
                            } else {
                                alert('请先输入专属同步密钥 (Sync Key)！');
                            }
                        }
                        return;
                    }

                    syncStatus.value = 'syncing';
                    syncStatusText.value = '正在推送...';

                    try {
                        const res = await fetch(`/api/sync?key=${encodeURIComponent(key)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                words: words.value,
                                sentences: sentences.value,
                                syncKey: key
                            })
                        });

                        const json = await res.json();
                        if (json.success) {
                            syncStatus.value = 'success';
                            const nowStr = new Date().toLocaleTimeString();
                            syncStatusText.value = `同步成功 (${nowStr})`;
                            lastSyncTime.value = new Date().toLocaleString();
                            localStorage.setItem('japanese_study_last_sync_time', lastSyncTime.value);
                            if (!silent) {
                                if (window.kidToast) {
                                    window.kidToast('☁️ 已成功推送到云端备份！', 'success');
                                } else {
                                    showToast('☁️ 已成功将本地学习进度推送到云端备份！');
                                }
                            }
                        } else {
                            syncStatus.value = 'error';
                            syncStatusText.value = json.message || '同步失败';
                            if (!silent) {
                                if (window.kidAlert) {
                                    window.kidAlert({
                                        title: '推送失败',
                                        message: '推送云端失败：' + (json.message || json.error),
                                        icon: '⚠️',
                                        type: 'warning'
                                    });
                                } else {
                                    alert('推送云端失败：' + (json.message || json.error));
                                }
                            }
                        }
                    } catch (err) {
                        syncStatus.value = 'error';
                        syncStatusText.value = '网络或接口异常';
                        if (!silent) {
                            if (window.kidAlert) {
                                window.kidAlert({
                                    title: '网络异常',
                                    message: '推送失败，请检查网络连接或 Cloudflare 部署状态：' + err.message,
                                    icon: '⚠️',
                                    type: 'danger'
                                });
                            } else {
                                alert('推送失败，请检查网络连接或 Cloudflare 部署状态：' + err.message);
                            }
                        }
                    }
                };

                const pullFromCloud = async (silent = false) => {
                    const key = syncKey.value.trim();
                    if (!key) {
                        if (!silent) {
                            if (window.kidAlert) {
                                window.kidAlert({
                                    title: '同步提示',
                                    message: '请先输入专属同步密钥 (Sync Key)！',
                                    icon: '💡',
                                    type: 'warning'
                                });
                            } else {
                                alert('请先输入专属同步密钥 (Sync Key)！');
                            }
                        }
                        return;
                    }

                    if (!silent && window.kidConfirm) {
                        const ok = await window.kidConfirm({
                            title: '拉取云端数据？',
                            message: '从云端拉取数据将合并并更新本地学习进度，确定要拉取吗？',
                            icon: '⬇️',
                            type: 'warning',
                            confirmText: '确定拉取',
                            cancelText: '取消'
                        });
                        if (!ok) return;
                    }

                    syncStatus.value = 'syncing';
                    syncStatusText.value = '正在拉取...';

                    try {
                        const res = await fetch(`/api/sync?key=${encodeURIComponent(key)}`);
                        const json = await res.json();

                        if (json.success && json.data) {
                            const cloudData = json.data;
                            let wordsUpdated = false;
                            let sentencesUpdated = false;

                            // 智能合并学习进度：取本地与云端中的最高复习等级，杜绝任何历史丢失或倒退
                            if (Array.isArray(cloudData.words) && cloudData.words.length > 0) {
                                if (words.value && words.value.length > 0) {
                                    const localWordMap = new Map();
                                    words.value.forEach(w => {
                                        if (w.id) localWordMap.set(w.id, w);
                                        localWordMap.set(`${w.word}__${w.kana}`, w);
                                    });
                                    const mergedWords = cloudData.words.map(cw => {
                                        const lw = (cw.id && localWordMap.get(cw.id)) || localWordMap.get(`${cw.word}__${cw.kana}`);
                                        if (lw && (lw.level || 0) > (cw.level || 0)) {
                                            return { ...cw, level: lw.level, next_review_date: lw.next_review_date };
                                        }
                                        return cw;
                                    });
                                    words.value = mergedWords;
                                } else {
                                    words.value = cloudData.words;
                                }
                                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(words.value));
                                wordsUpdated = true;
                            }

                            if (Array.isArray(cloudData.sentences) && cloudData.sentences.length > 0) {
                                if (sentences.value && sentences.value.length > 0) {
                                    const localSentenceMap = new Map();
                                    sentences.value.forEach(s => {
                                        if (s.id) localSentenceMap.set(s.id, s);
                                        if (s.japanese) localSentenceMap.set(s.japanese, s);
                                    });
                                    const mergedSentences = cloudData.sentences.map(cs => {
                                        const ls = (cs.id && localSentenceMap.get(cs.id)) || (cs.japanese && localSentenceMap.get(cs.japanese));
                                        if (ls && (ls.level || 0) > (cs.level || 0)) {
                                            return { ...cs, level: ls.level, next_review_date: ls.next_review_date };
                                        }
                                        return cs;
                                    });
                                    sentences.value = mergedSentences;
                                } else {
                                    sentences.value = cloudData.sentences;
                                }
                                localStorage.setItem(LOCAL_STORAGE_SENTENCES_KEY, JSON.stringify(sentences.value));
                                sentencesUpdated = true;
                            }

                            syncStatus.value = 'success';
                            const nowStr = new Date().toLocaleTimeString();
                            syncStatusText.value = `拉取成功 (${nowStr})`;
                            lastSyncTime.value = new Date().toLocaleString();
                            localStorage.setItem('japanese_study_last_sync_time', lastSyncTime.value);

                            if (!silent) {
                                if (window.kidToast) {
                                    window.kidToast(`☁️ 已同步最新数据（${words.value.length} 词，${sentences.value.length} 句）`, 'success');
                                } else {
                                    showToast(`☁️ 已同步最新数据（${words.value.length} 词，${sentences.value.length} 句）`);
                                }
                            }
                        } else if (json.success && !json.data) {
                            syncStatus.value = 'idle';
                            syncStatusText.value = '云端暂无数据';
                            if (!silent) {
                                if (window.kidAlert) {
                                    window.kidAlert({
                                        title: '云端暂无数据',
                                        message: '该密钥在云端尚未有数据备份，请先在已有数据的设备上点击【推送到云端备份】。',
                                        icon: '💡',
                                        type: 'info'
                                    });
                                } else {
                                    alert('该密钥在云端尚未有数据备份，请先在已有数据的设备上点击【推送到云端备份】。');
                                }
                            }
                        } else {
                            syncStatus.value = 'error';
                            syncStatusText.value = json.message || '拉取失败';
                            if (!silent) {
                                if (window.kidAlert) {
                                    window.kidAlert({
                                        title: '拉取失败',
                                        message: '拉取失败：' + (json.message || json.error),
                                        icon: '⚠️',
                                        type: 'warning'
                                    });
                                } else {
                                    alert('拉取失败：' + (json.message || json.error));
                                }
                            }
                        }
                    } catch (err) {
                        syncStatus.value = 'error';
                        syncStatusText.value = '网络异常';
                        if (!silent) {
                            if (window.kidAlert) {
                                window.kidAlert({
                                    title: '网络异常',
                                    message: '拉取失败，请检查网络或服务配置：' + err.message,
                                    icon: '⚠️',
                                    type: 'danger'
                                });
                            } else {
                                alert('拉取失败，请检查网络或服务配置：' + err.message);
                            }
                        }
                    }
                };

                onMounted(() => {
                    initVoices();
                    if (synth && synth.onvoiceschanged !== undefined) {
                        synth.onvoiceschanged = initVoices;
                    }
                    setTimeout(initVoices, 250);
                    setTimeout(initVoices, 800);
                    setTimeout(initVoices, 1600);

                    // iPad / iOS WebKit audio & speech gesture unlocker
                    const unlockAudioAndTTS = () => {
                        if (synth) {
                            try {
                                const dummy = new SpeechSynthesisUtterance('');
                                dummy.volume = 0;
                                synth.speak(dummy);
                            } catch (e) {}
                            initVoices();
                        }
                        try {
                            if (!currentAudio) {
                                currentAudio = new Audio();
                            }
                            currentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
                            currentAudio.play().then(() => {
                                currentAudio.pause();
                                currentAudio.currentTime = 0;
                            }).catch(() => {});
                        } catch (e) {}
                    };
                    window.addEventListener('touchstart', unlockAudioAndTTS, { once: true, passive: true });
                    window.addEventListener('click', unlockAudioAndTTS, { once: true, passive: true });

                    // 移动端/iPad 切应用或锁屏时，自动立即将待同步学习进度刷入云端
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'hidden') {
                            if (autoSync.value && syncKey.value.trim()) {
                                clearTimeout(debounceSyncTimer);
                                pushToCloud(true);
                            }
                        }
                    });

                    window.addEventListener('resize', () => {
                        if (kanaPracticeState.value === 'writing') {
                            initKanaCanvas();
                        }
                    });

                    try {
                        loadAudioConfig();
                    } catch (e) {
                        console.error('Failed to load audio config', e);
                    }

                    try {
                        loadData();
                    } catch (e) {
                        console.error('Failed to load words data', e);
                    }

                    try {
                        loadSentenceData();
                    } catch (e) {
                        console.error('Failed to load sentence data', e);
                    }

                    try {
                        loadKanaWrongList();
                    } catch (e) {
                        console.error('Failed to load kana wrong list', e);
                    }

                    window.addEventListener('resize', () => {
                        if (kanaPracticeState.value === 'writing') {
                            initKanaCanvas();
                        }
                    });

                    if (autoSync.value && syncKey.value.trim()) {
                        pullFromCloud(true);
                    }
                });

                // Computed stats (Words)
                const todayDueCount = computed(() => {
                    const now = Date.now();
                    return words.value.filter(w => (w.next_review_date || 0) <= now).length;
                });

                const masteredCount = computed(() => {
                    return words.value.filter(w => (w.level || 0) >= 3).length;
                });

                const learnedWordsCount = computed(() => {
                    return words.value.filter(w => (w.level || 0) > 0).length;
                });

                const isWordLearned = (wordStr) => {
                    if (!wordStr) return false;
                    return words.value.some(w => (w.word === wordStr || w.kana === wordStr) && (w.level || 0) > 0);
                };

                // Sentence Computed Properties
                const eligibleSentences = computed(() => {
                    if (sentenceScope.value === 'all') {
                        return sentences.value;
                    }
                    // 'learned' scope:
                    const learnedSet = new Set();
                    words.value.forEach(w => {
                        if ((w.level || 0) > 0) {
                            if (w.word) learnedSet.add(w.word);
                            if (w.kana) learnedSet.add(w.kana);
                        }
                    });

                    if (learnedSet.size === 0) {
                        return sentences.value;
                    }

                    const matched = sentences.value.filter(s => {
                        if (s.words && Array.isArray(s.words)) {
                            if (s.words.some(sw => learnedSet.has(sw))) return true;
                        }
                        for (const lw of learnedSet) {
                            if (lw.length >= 2 && s.japanese.includes(lw)) return true;
                        }
                        return false;
                    });

                    return matched.length > 0 ? matched : sentences.value;
                });

                const eligibleDueSentences = computed(() => {
                    const now = Date.now();
                    return eligibleSentences.value.filter(s => (s.next_review_date || 0) <= now);
                });

                const sentenceDueCount = computed(() => {
                    const now = Date.now();
                    return sentences.value.filter(s => (s.next_review_date || 0) <= now).length;
                });

                const sentenceMasteredCount = computed(() => {
                    return sentences.value.filter(s => (s.level || 0) >= 3).length;
                });

                const currentPracticeSentence = computed(() => {
                    return sentenceQueue.value.length > 0 ? sentenceQueue.value[0] : null;
                });

                // List Filtering & Pagination
                const filteredWords = computed(() => {
                    let result = words.value;

                    // Search query filter
                    const q = searchQuery.value.trim().toLowerCase();
                    if (q) {
                        result = result.filter(w => 
                            (w.word && w.word.toLowerCase().includes(q)) ||
                            (w.kana && w.kana.toLowerCase().includes(q)) ||
                            (w.meaning && w.meaning.toLowerCase().includes(q))
                        );
                    }

                    return result;
                });

                const totalPages = computed(() => {
                    return Math.max(1, Math.ceil(filteredWords.value.length / pageSize));
                });

                const paginatedWords = computed(() => {
                    const start = (currentPage.value - 1) * pageSize;
                    return filteredWords.value.slice(start, start + pageSize);
                });

                // Sentence Browser Computed & Pagination
                const filteredSentencesList = computed(() => {
                    if (!sentences.value) return [];
                    const q = sentenceSearchQuery.value.trim().toLowerCase();
                    if (!q) return sentences.value;
                    return sentences.value.filter(s => 
                        (s.japanese && s.japanese.toLowerCase().includes(q)) ||
                        (s.kana && s.kana.toLowerCase().includes(q)) ||
                        (s.chinese && s.chinese.toLowerCase().includes(q)) ||
                        (s.words && Array.isArray(s.words) && s.words.some(w => w.toLowerCase().includes(q)))
                    );
                });

                const sentenceTotalPages = computed(() => {
                    return Math.max(1, Math.ceil(filteredSentencesList.value.length / sentencePageSize));
                });

                const paginatedSentences = computed(() => {
                    const start = (sentenceCurrentPage.value - 1) * sentencePageSize;
                    return filteredSentencesList.value.slice(start, start + sentencePageSize);
                });

                // Tab & Search change watch
                watch(searchQuery, () => {
                    currentPage.value = 1;
                });

                watch(sentenceSearchQuery, () => {
                    sentenceCurrentPage.value = 1;
                });

                watch(currentTab, (newTab) => {
                    if (newTab === 'practice') {
                        synth.cancel();
                        practiceState.value = 'idle';
                        todayQueue.value = [];
                        initialQueueLength.value = 0;
                    }
                });

                // Built-in import method
                const importBuiltin = async () => {
                    const toImport = window.BUILTIN_VOCAB || window.BUILTIN_VOCAB_ALL || [];
                    if (toImport.length === 0) {
                        showToast('未找到内置词库数据文件', 'warning');
                        return;
                    }

                    if (words.value.length > 0) {
                        let confirmAppend = false;
                        if (window.kidConfirm) {
                            confirmAppend = await window.kidConfirm({
                                title: '合并词库',
                                message: `当前已有 ${words.value.length} 个词汇。点击【确定】进行合并追加（去重），点击【取消】放弃。`,
                                icon: '📚',
                                type: 'primary',
                                confirmText: '确定合并',
                                cancelText: '取消'
                            });
                        } else {
                            confirmAppend = confirm(`当前已有 ${words.value.length} 个词汇。\n点击【确定】进行合并追加（去重），点击【取消】放弃。`);
                        }
                        if (!confirmAppend) return;

                        // Merge & de-duplicate by word + kana, updating missing meanings
                        const existingMap = new Map();
                        words.value.forEach(w => existingMap.set(w.word + '::' + w.kana, w));
                        let added = 0;
                        let updated = 0;
                        toImport.forEach(item => {
                            const k = item.word + '::' + item.kana;
                            if (!existingMap.has(k)) {
                                const newWord = {
                                    ...item,
                                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
                                    next_review_date: Date.now()
                                };
                                words.value.push(newWord);
                                existingMap.set(k, newWord);
                                added++;
                            } else {
                                const exist = existingMap.get(k);
                                if ((!exist.meaning || exist.meaning.trim() === '') && item.meaning) {
                                    exist.meaning = item.meaning;
                                    updated++;
                                }
                            }
                        });
                        saveData();
                        showToast(`导入完成：新增 ${added} 词，补全释义 ${updated} 词！`);
                    } else {
                        words.value = JSON.parse(JSON.stringify(toImport));
                        saveData();
                        showToast(`成功载入内置词库（共 ${words.value.length} 词）！`);
                    }
                };

                // File Upload (supports .txt with word(kana) format and .json)
                const handleFileUpload = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const text = evt.target.result;
                            const now = Date.now();

                            if (file.name.endsWith('.json')) {
                                const parsed = JSON.parse(text);

                                // 完整进度备份文件格式 ({ words: [...], sentences: [...] })
                                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.words || parsed.sentences)) {
                                    let restoredWords = 0;
                                    let restoredSentences = 0;
                                    if (Array.isArray(parsed.words) && parsed.words.length > 0) {
                                        words.value = parsed.words;
                                        saveData();
                                        restoredWords = parsed.words.length;
                                    }
                                    if (Array.isArray(parsed.sentences) && parsed.sentences.length > 0) {
                                        sentences.value = parsed.sentences;
                                        saveSentenceData();
                                        restoredSentences = parsed.sentences.length;
                                    }
                                    showToast(`备份恢复成功！恢复 ${restoredWords} 词，${restoredSentences} 句！`);
                                    return;
                                }

                                if (Array.isArray(parsed)) {
                                    const imported = parsed.map(item => ({
                                        id: item.id || (now + '_' + Math.random().toString(36).substr(2, 5)),
                                        word: item.word || '',
                                        kana: item.kana || '',
                                        meaning: item.meaning || '',
                                        level: item.level || 0,
                                        next_review_date: item.next_review_date || now
                                    })).filter(i => i.word);

                                    if (imported.length === 0) {
                                        if (window.kidAlert) {
                                            window.kidAlert({
                                                title: '导入提示',
                                                message: '未能从 JSON 数组中识别出有效词汇。',
                                                icon: '⚠️',
                                                type: 'warning'
                                            });
                                        } else {
                                            alert('未能从 JSON 数组中识别出有效词汇。');
                                        }
                                        return;
                                    }

                                    const existingKeys = new Set(words.value.map(w => w.word + '::' + w.kana));
                                    let added = 0;
                                    imported.forEach(w => {
                                        const k = w.word + '::' + w.kana;
                                        if (!existingKeys.has(k)) {
                                            words.value.push(w);
                                            existingKeys.add(k);
                                            added++;
                                        }
                                    });
                                    saveData();
                                    showToast(`文件解析成功，已导入 ${added} 个新词汇！`, 'success');
                                    return;
                                }
                            }

                            // Parse text line by line
                            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                            let imported = [];
                            lines.forEach((line, idx) => {
                                const m = line.match(/^(.+?)[(（](.+?)[)）]\s*(.*)$/);
                                if (m) {
                                    imported.push({
                                        id: 'import_' + now + '_' + idx,
                                        word: m[1].trim(),
                                        kana: m[2].trim(),
                                        meaning: m[3] ? m[3].trim() : '',
                                        level: 0,
                                        next_review_date: now
                                    });
                                }
                            });

                            if (imported.length === 0) {
                                if (window.kidAlert) {
                                    window.kidAlert({
                                        title: '导入提示',
                                        message: '未能从文件中识别出有效词汇。请确保文件格式为「单词(假名)」或 JSON。',
                                        icon: '⚠️',
                                        type: 'warning'
                                    });
                                } else {
                                    alert('未能从文件中识别出有效词汇。请确保文件格式为「单词(假名)」或 JSON。');
                                }
                                return;
                            }

                            // Merge into current words
                            const existingKeys = new Set(words.value.map(w => w.word + '::' + w.kana));
                            let added = 0;
                            imported.forEach(w => {
                                const k = w.word + '::' + w.kana;
                                if (!existingKeys.has(k)) {
                                    words.value.push(w);
                                    existingKeys.add(k);
                                    added++;
                                }
                            });
                            saveData();
                            showToast(`文件解析成功，已导入 ${added} 个新词汇！`, 'success');
                        } catch (err) {
                            console.error(err);
                            if (window.kidAlert) {
                                window.kidAlert({
                                    title: '解析失败',
                                    message: '解析文件失败：' + (err.message || '未知错误'),
                                    icon: '❌',
                                    type: 'danger'
                                });
                            } else {
                                alert('解析文件失败：' + err.message);
                            }
                        }
                    };
                    reader.readAsText(file, 'UTF-8');
                    e.target.value = ''; // reset file input
                };

                // Export Full Backup (Words + Sentences + Progress)
                const exportData = () => {
                    const backupPayload = {
                        version: '2.0',
                        exportDate: new Date().toISOString(),
                        words: words.value,
                        sentences: sentences.value
                    };
                    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `japanese_study_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast(`已导出完整学习进度与词库备份（${words.value.length} 词，${sentences.value.length} 句）`);
                };

                const resetSentences = async () => {
                    const doReset = () => {
                        if (window.BUILTIN_SENTENCES_ALL && Array.isArray(window.BUILTIN_SENTENCES_ALL)) {
                            sentences.value = window.BUILTIN_SENTENCES_ALL.map(s => ({
                                ...s,
                                level: 0,
                                next_review_date: Date.now()
                            }));
                            saveSentenceData();
                            showToast(`已重置并载入全部 ${sentences.value.length} 个内置句子！`, 'success');
                        }
                    };
                    if (window.kidConfirm) {
                        const ok = await window.kidConfirm({
                            title: '重置句子库？',
                            message: '确定要重置全部内置句子并将其复习等级恢复为初始状态吗？',
                            icon: '⚠️',
                            type: 'warning',
                            confirmText: '确定重置',
                            cancelText: '取消'
                        });
                        if (ok) doReset();
                    } else if (confirm('确定要重置全部内置句子吗？')) {
                        doReset();
                    }
                };

                // Clear All
                const clearAllWords = async () => {
                    const doClear = () => {
                        words.value = [];
                        saveData();
                        showToast('已清空词库', 'warning');
                    };
                    if (window.kidConfirm) {
                        const ok = await window.kidConfirm({
                            title: '清空词库？',
                            message: `确定要清空全部 ${words.value.length} 个词汇吗？此操作不可恢复。`,
                            icon: '🗑️',
                            type: 'danger',
                            confirmText: '确定清空',
                            cancelText: '取消'
                        });
                        if (ok) doClear();
                    } else if (confirm(`确定要清空全部 ${words.value.length} 个词汇吗？此操作不可恢复。`)) {
                        doClear();
                    }
                };

                // Add / Edit / Delete word
                const saveWord = () => {
                    if (!form.value.word.trim() || !form.value.kana.trim()) return;

                    if (editingId.value) {
                        const index = words.value.findIndex(w => w.id === editingId.value);
                        if (index !== -1) {
                            words.value[index] = {
                                ...words.value[index],
                                word: form.value.word.trim(),
                                kana: form.value.kana.trim(),
                                meaning: form.value.meaning.trim()
                            };
                            showToast('词汇修改已保存');
                        }
                    } else {
                        words.value.unshift({
                            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
                            word: form.value.word.trim(),
                            kana: form.value.kana.trim(),
                            meaning: form.value.meaning.trim(),
                            level: 0,
                            next_review_date: Date.now()
                        });
                        showToast('新词汇添加成功');
                    }
                    
                    saveData();
                    cancelEdit();
                };

                const editWord = (word) => {
                    editingId.value = word.id;
                    form.value = { 
                        word: word.word, 
                        kana: word.kana, 
                        meaning: word.meaning || ''
                    };
                    showAddForm.value = true;
                    document.querySelector('main').scrollTop = 0;
                };

                const cancelEdit = () => {
                    editingId.value = null;
                    form.value = { word: '', kana: '', meaning: '' };
                    showAddForm.value = false;
                };

                const deleteWord = async (id) => {
                    const doDelete = () => {
                        words.value = words.value.filter(w => w.id !== id);
                        saveData();
                        showToast('词汇已删除', 'success');
                    };
                    if (window.kidConfirm) {
                        const ok = await window.kidConfirm({
                            title: '删除词汇？',
                            message: '确定要删除该词汇吗？',
                            icon: '🗑️',
                            type: 'danger',
                            confirmText: '确定删除',
                            cancelText: '取消'
                        });
                        if (ok) doDelete();
                    } else if (confirm('确定要删除该词汇吗？')) {
                        doDelete();
                    }
                };

                const promptEditMeaning = async (word) => {
                    let newMeaning = null;
                    if (window.kidPrompt) {
                        newMeaning = await window.kidPrompt({
                            title: '补充 / 修改释义',
                            message: `为「${word.word} (${word.kana})」输入中文释义：`,
                            placeholder: '输入中文释义...',
                            defaultValue: word.meaning || '',
                            icon: '✏️',
                            confirmText: '保存释义',
                            cancelText: '取消'
                        });
                    } else {
                        newMeaning = prompt(`请为「${word.word} (${word.kana})」输入中文释义：`, word.meaning || '');
                    }
                    if (newMeaning !== null) {
                        word.meaning = newMeaning.trim();
                        const idx = words.value.findIndex(w => w.id === word.id);
                        if (idx !== -1) {
                            words.value[idx].meaning = word.meaning;
                            saveData();
                            showToast('释义已更新！', 'success');
                        }
                    }
                };

                const formatDate = (ts) => {
                    if (!ts) return '未设置';
                    const date = new Date(Number(ts));
                    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                };

                // Practice Mode Logic
                const currentPracticeWord = computed(() => {
                    return todayQueue.value.length > 0 ? todayQueue.value[0] : null;
                });

                // 单词关联例句检索系统（从 sentence_data.js / sentences.value 中匹配真实教材例句）
                const getSentencesForWord = (item, sentenceList = []) => {
                    if (!item) return [];
                    const list = (sentenceList && sentenceList.length > 0) ? sentenceList : (window.BUILTIN_SENTENCES || []);
                    if (!list || list.length === 0) return [];

                    const rawWord = (item.word || '').trim();
                    const rawKana = (item.kana || '').trim();
                    const cleanWord = rawWord.replace(/^[~～\-]/, '').replace(/[~～\-]$/, '').trim();
                    const cleanKana = rawKana.replace(/^[~～\-]/, '').replace(/[~～\-]$/, '').trim();

                    if (!cleanWord && !cleanKana) return [];

                    const exactMatches = [];
                    const subMatches = [];
                    const kanaMatches = [];
                    const seenIds = new Set();

                    const add = (arr, s) => {
                        const key = s.id || s.japanese;
                        if (!seenIds.has(key)) {
                            seenIds.add(key);
                            arr.push(s);
                        }
                    };

                    // 1. 优先完全匹配 sentence.words 词汇标签
                    list.forEach(s => {
                        if (!s.words || !Array.isArray(s.words)) return;
                        const matched = s.words.some(w => {
                            if (!w) return false;
                            const cw = w.replace(/^[~～\-]/, '').replace(/[~～\-]$/, '').trim();
                            return w === rawWord || w === cleanWord || cw === cleanWord ||
                                   w === rawKana || w === cleanKana || cw === cleanKana;
                        });
                        if (matched) {
                            add(exactMatches, s);
                        }
                    });

                    // 2. 次优先：日文文本包含匹配（长度>=2，或长度为1的单汉字；排除常见词汇内部误伤）
                    const canSubMatch = cleanWord.length >= 2 || (cleanWord.length === 1 && /[\u4e00-\u9faf]/.test(cleanWord));
                    if (canSubMatch) {
                        list.forEach(s => {
                            if (!s.japanese || !s.japanese.includes(cleanWord)) return;
                            // 检查汉字前后边界，防止例如复合词截断
                            const idx = s.japanese.indexOf(cleanWord);
                            if (idx > 0 && /[\u4e00-\u9faf]/.test(cleanWord)) {
                                const prev = s.japanese[idx - 1];
                                if (/[\u4e00-\u9faf]/.test(prev) && cleanWord.length === 1) return;
                            }
                            add(subMatches, s);
                        });
                    }

                    // 3. 兜底：假名包含匹配（要求假名长度>=3，避免单双假名助词误匹配）
                    if (exactMatches.length === 0 && subMatches.length === 0 && cleanKana.length >= 3) {
                        list.forEach(s => {
                            if (s.kana && s.kana.includes(cleanKana)) {
                                add(kanaMatches, s);
                            }
                        });
                    }

                    // 按句子长度由简到繁排序
                    exactMatches.sort((a, b) => (a.japanese?.length || 999) - (b.japanese?.length || 999));
                    subMatches.sort((a, b) => (a.japanese?.length || 999) - (b.japanese?.length || 999));
                    kanaMatches.sort((a, b) => (a.japanese?.length || 999) - (b.japanese?.length || 999));

                    const combined = [...exactMatches, ...subMatches, ...kanaMatches];
                    if (combined.length > 0) {
                        return combined;
                    }

                    // 4. 智能保底例句：针对未收录在 sentence_data.js 中的词汇，根据词性与释义自动提供语境例句保底
                    const fallback = generateFallbackSentence(item);
                    return fallback ? [fallback] : [];
                };

// 高频生活会话定制例句库（涵盖高频核心词、转折代词、日常动作与生活情境）
                const CURATED_DAILY_CONVERSATIONS = {
                    "普通": {
                        japanese: "この電車は普通電車ですか、それとも快速ですか？",
                        kana: "この でんしゃは ふつうでんしゃ ですか、それとも かいそく ですか？",
                        chinese: "这趟电车是普通慢车，还是快速列车？"
                    },
                    "方": {
                        japanese: "あちらで案内している親切な方は、どなたですか？",
                        kana: "あちらで あんないしている しんせつな かたは、どなたですか？",
                        chinese: "在那边做引导的热心人是谁？"
                    },
                    "又": {
                        japanese: "今日は楽しかったです。また明日会いましょう！",
                        kana: "きょうは たのしかったです。また あした あいましょう！",
                        chinese: "今天玩得很开心。明天再见吧！"
                    },
                    "有る": {
                        japanese: "駅の改札の近くに、美味しいパン屋さんがありますよ。",
                        kana: "えきの かいさつの ちかくに、おいしい ぱんやさんが ありますよ。",
                        chinese: "车站检票口附近有一家美味的面包店哦。"
                    },
                    "切る": {
                        japanese: "ハサミを使って、この紙をきれいに切ります。",
                        kana: "はさみを つかって、この かみを きれいに きります。",
                        chinese: "用剪刀把这张纸整齐地剪开。"
                    },
                    "こちら": {
                        japanese: "どうぞこちらへお入りください、温かいお茶をお持ちしました。",
                        kana: "どうぞ こちらへ おはいりください、あたたかい おちゃを おもちしました。",
                        chinese: "请往这边进，给您端来了热茶。"
                    },
                    "が": {
                        japanese: "すみませんが、駅へ行く道を教えていただけますか？",
                        kana: "すみませんが、えきへ いく みちを おしえて いただけますか？",
                        chinese: "不好意思，能请您告诉我一下去车站的路吗？"
                    },
                    "本": {
                        japanese: "休みの日に家で、面白い小説の本をゆっくり読みました。",
                        kana: "やすみの ひに いえで、おもしろい しょうせつの ほんを ゆっくり よみました。",
                        chinese: "休息日在家悠闲地读了一本有趣的小说。"
                    },
                    "まだ": {
                        japanese: "電車の出発までまだ時間がありますから、ゆっくりお茶を飲みましょう。",
                        kana: "でんしゃの しゅっぱつまで まだ じかんが ありますから、ゆっくり おちゃを のみましょう。",
                        chinese: "离电车发车还有时间，慢慢喝杯茶吧。"
                    },
                    "見る": {
                        japanese: "昨夜テレビで、家族と一緒に面白い映画を見ました。",
                        kana: "さくや てれびで、かぞくと いっしょに おもしろい えいがを みました。",
                        chinese: "昨晚在电视上和家人一起看了有趣的电影。"
                    },
                    "ずっと": {
                        japanese: "朝からずっと雨が降っていて、外に出られません。",
                        kana: "あさから ずっと あめが ふっていて、そとに でられません。",
                        chinese: "从早上一整天都在下雨，没法出门。"
                    },
                    "そんなに": {
                        japanese: "そんなに急がなくても、まだ時間は十分ありますよ。",
                        kana: "そんなに いそがなくても、まだ じかんは じゅうぶん ありますよ。",
                        chinese: "不用那么着急，时间还很充裕呢。"
                    },
                    "する": {
                        japanese: "週末の午前中は、家で部屋の掃除をします。",
                        kana: "しゅうまつの ごぜんちゅうは、いえで へやの そうじを します。",
                        chinese: "周末的上午在家里打扫房间。"
                    },
                    "引く": {
                        japanese: "分からない言葉があったら、辞書を引いて意味を調べます。",
                        kana: "わからない ことばが あったら、じしょを ひいて いみを しらべます。",
                        chinese: "要是有不懂的词语，就查词典检索意思。"
                    },
                    "押す": {
                        japanese: "エレベーターのボタンを押して、ドアを開けておきました。",
                        kana: "えれべーたーの ぼたんを おして、どあを あけて おきました。",
                        chinese: "按住电梯按钮开着门。"
                    },
                    "出る": {
                        japanese: "毎朝八時に家を出て、電車で会社へ向かいます。",
                        kana: "まいあさ はちじに いえを でて、でんしゃで かいしゃへ むかいます。",
                        chinese: "每天早晨八点出门，坐电车前往公司。"
                    },
                    "取る": {
                        japanese: "すみません、テーブルの上の醤油を取ってもらえますか？",
                        kana: "すみません、てーぶるの うえの しょうゆを とって もらえますか？",
                        chinese: "不好意思，能帮我拿一下桌子上的酱油吗？"
                    },
                    "撮る": {
                        japanese: "京都の庭園で、友達と一緒に記念写真を撮りました。",
                        kana: "きょうとの ていえんで、ともだちと いっしょに きねんしゃしんを とりました。",
                        chinese: "在京都的庭园里，和朋友一起拍了纪念照。"
                    },
                    "どうも": {
                        japanese: "重い荷物を持ってくれて、どうもありがとうございます！",
                        kana: "おもい にもつを もってくれて、どうも ありがとう ございます！",
                        chinese: "帮我提沉重的行李，真的太感谢你了！"
                    },
                    "会社": {
                        japanese: "毎朝八時半の急行電車に乗って、会社へ通勤しています。",
                        kana: "まいあさ はちじはんの きゅうこうでんしゃに のって、かいしゃへ つうきん しています。",
                        chinese: "每天早上坐8点半的急行列车去公司通勤。"
                    },
                    "掛かる": {
                        japanese: "ここから駅まで、歩いて十分くらい掛かります。",
                        kana: "ここから えきまで、あるいて じっぷんくらい かかります。",
                        chinese: "从这里到车站，步行大概需要十分钟。"
                    },
                    "掛ける": {
                        japanese: "後で時間があるときに、電話を掛けますね。",
                        kana: "あとで じかんが あるときに、でんわを かけますね。",
                        chinese: "待会儿有空的时候，我给你打电话哦。"
                    },
                    "起きる": {
                        japanese: "明日は朝早く起きて、近所の公園を散歩しましょう。",
                        kana: "あしたは あさ はやく おきて、きんじょの こうえんを さんぽ しましょう。",
                        chinese: "明天早上早点起床，去附近的公园散步吧。"
                    },
                    "休む": {
                        japanese: "少し熱があるので、今日は仕事を休んで家で寝ます。",
                        kana: "すこし ねつが あるので、きょうは しごとを やすんで いえで ねます。",
                        chinese: "有点发烧，今天跟公司请假在家里休息。"
                    },
                    "教室": {
                        japanese: "授業が始まる十分前に、教室に入って席に座りました。",
                        kana: "じぎょうが はじまる じっぷんまえに、きょうしつに はいって せきに すわりました。",
                        chinese: "上课十分钟前，进入教室在座位上坐下了。"
                    },
                    "ペット": {
                        japanese: "家で可愛い猫をペットとして飼っています。",
                        kana: "いえで かわいい ねこを ぺっととして かっています。",
                        chinese: "在家里养了一只可爱的猫咪当宠物。"
                    },
                    "元気": {
                        japanese: "お久しぶりです！毎日お元気に過ごしていますか？",
                        kana: "おひさしぶりです！まいにち おげんきに すごしていますか？",
                        chinese: "好久不见了！每天都过得挺有精神的吧？"
                    },
                    "呼ぶ": {
                        japanese: "雨が降ってきたので、タクシーを一台呼びましょうか？",
                        kana: "あめが ふってきたので、たくしーを いちだい よびましょうか？",
                        chinese: "下起雨来了，要叫一辆出租车吗？"
                    },
                    "もう": {
                        japanese: "もう十二時ですから、そろそろお昼ご飯を食べに行きましょう。",
                        kana: "もう じゅうにじですから、そろそろ おひるごはんを たべに いきましょう。",
                        chinese: "已经12点钟了，差不多去吃午饭吧。"
                    },
                    "ゆっくり": {
                        japanese: "週末は家で温かいお茶でも飲んで、ゆっくり休んでください。",
                        kana: "しゅうまつは いえで あたたかい おちゃでも のんで、ゆっくり やすんで ください。",
                        chinese: "周末在家里喝点热茶，好好放松休息一下吧。"
                    },
                    "今": {
                        japanese: "今はちょうど手が空いているので、少しお話しできますよ。",
                        kana: "いまは ちょうど てが あいているので、すこし おはなし できますよ。",
                        chinese: "我现在正好手头没事，可以聊一会儿哦。"
                    },
                    "細かい": {
                        japanese: "自販機でジュースを買いたいので、細かい小銭はありますか？",
                        kana: "じはんきで じゅーすを かいたいので、こまかい こぜには ありますか？",
                        chinese: "想在自动售货机买果汁，有零钱吗？"
                    },
                    "子供": {
                        japanese: "休みの日に近所の公園で、子供たちが元気に遊んでいます。",
                        kana: "やすみの ひに きんじょの こうえんで、こどもたちが げんきに あそんでいます。",
                        chinese: "休息日附近的公园里，孩子们正在精神饱满地玩耍。"
                    },
                    "自分": {
                        japanese: "自分の部屋は、いつも自分で掃除するようにしています。",
                        kana: "じぶんの へやは、いつも じぶんで そうじ するように しています。",
                        chinese: "自己的房间，总是尽量自己去打扫。"
                    },
                    "重い": {
                        japanese: "このスーツケースはお土産がたくさん入っていて重いです。",
                        kana: "この すーつけーすは おみやげが たくさん はいっていて おもいです。",
                        chinese: "这个行李箱装了很多特产伴手礼，很沉。"
                    },
                    "出来る": {
                        japanese: "美味しい晩ご飯ができましたから、早くテーブルへ来てください。",
                        kana: "おいしい ばんごはんが できましたから、はやく てーぶるへ きてください。",
                        chinese: "美味的晚饭做好啦，快点过来上桌吧。"
                    },
                    "上げる": {
                        japanese: "誕生日に、友達に素敵なプレゼントを上げました。",
                        kana: "たんじょうびに、ともだちに すてきな ぷれぜんとを あげました。",
                        chinese: "生日的时候，送了朋友一件很棒的礼物。"
                    },
                    "心配": {
                        japanese: "初めての一人暮らしは少し心配ですが、頑張ります。",
                        kana: "はじめての ひとりぐらしは すこし しんぱいですが、がんばります。",
                        chinese: "第一次一个人生活虽然有点担心，但我会努力的。"
                    },
                    "前": {
                        japanese: "駅の改札口の前で、友達と待ち合わせをしています。",
                        kana: "えきの かいさつぐちの まえで、ともだちと まちあわせを しています。",
                        chinese: "在车站检票口前和朋友碰头。"
                    },
                    "二人": {
                        japanese: "すみません、二人で座れるテーブル席は空いていますか？",
                        kana: "すみません、ふたりで すわれる てーぶるせきは あいていますか？",
                        chinese: "不好意思，请问有两个人坐的桌位空着吗？"
                    },
                    "入れる": {
                        japanese: "コーヒーに砂糖とミルクを少し入れて飲みます。",
                        kana: "こーひーに さとうと みるくを すこし いれて のみます。",
                        chinese: "在咖啡里加一点糖和牛奶喝。"
                    },
                    "言う": {
                        japanese: "帰るときに、同僚に「お疲れ様でした」と言いました。",
                        kana: "かえる ときに、どうりょうに 「おつかれさまでした」と いいました。",
                        chinese: "回去的时候，对同事说了声“您辛苦了”。"
                    },
                    "思う": {
                        japanese: "今度の週末は天気が良くなるといいなと思います。",
                        kana: "こんどの しゅうまつは てんきが よくなると いいなと おもいます。",
                        chinese: "我想这个周末天气要是能变好就太棒了。"
                    },
                    "直す": {
                        japanese: "故障したエアコンを電気屋さんに修理して直してもらいました。",
                        kana: "こしょうした えあこんを でんきやさんに しゅうりして なおして もらいました。",
                        chinese: "故障的空调请电器店师傅修理修好了。"
                    },
                    "要る": {
                        japanese: "レシートは要りますか？—いいえ、要りません。",
                        kana: "れしーとは いりますか？—いいえ、いりません。",
                        chinese: "需要收据吗？—不用，谢谢。"
                    },
                    "成る": {
                        japanese: "夜になって、外はすっかり静かになりました。",
                        kana: "よるに なって、そとは すっかり しずかに なりました。",
                        chinese: "到了夜晚，外面完全变得安静下来了。"
                    },
                    "泊まる": {
                        japanese: "京都へ旅行に行ったとき、静かな和風の旅館に泊まりました。",
                        kana: "きょうとへ りょこうに いったとき、しずかな わふうの りょかんに とまりました。",
                        chinese: "去京都旅行时，住了一家安静的和风旅馆。"
                    },
                    "登る": {
                        japanese: "天気のいい週末に、友達と一緒に富士山に登りました。",
                        kana: "てんきの いい しゅうまつに、ともだちと いっしょに ふじさんに のぼりました。",
                        chinese: "在天气晴朗的周末，和朋友一起爬了富士山。"
                    },
                    "相撲": {
                        japanese: "休みの日にテレビで相撲の試合を楽しく見ました。",
                        kana: "やすみの ひに てれびで すもうの しあいを たのしく みました。",
                        chinese: "休息日在电视上兴致勃勃地看了相扑比赛。"
                    },
                    "調べる": {
                        japanese: "旅行に行く前に、スマホで現地の電車の時間を調べました。",
                        kana: "りょこうに いく まえに、すまほで げんちの でんしゃの じかんを しらべました。",
                        chinese: "去旅行前，用手机查了当地电车的时刻表。"
                    },
                    "ラッシュ": {
                        japanese: "朝の通勤ラッシュは電車が満員で本当に大変です。",
                        kana: "あさの つうきん らっしゅは でんしゃが まんいんで ほんとうに たいへんです。",
                        chinese: "早上的通勤早高峰电车挤得满满的，真是太辛苦了。"
                    },
                    "眼鏡": {
                        japanese: "本を読むときは、いつも机の上の眼鏡をかけています。",
                        kana: "ほんを よむ ときは、いつも つくえの うえの めがねを かけています。",
                        chinese: "看书的时候，总是戴着桌上的眼镜。"
                    },
                    "連れて行く": {
                        japanese: "今度の日曜日に、子供たちを動物園へ連れて行きます。",
                        kana: "こんどの にちようびに、こどもたちを どうぶつえんへ つれていきます。",
                        chinese: "下周日打算带孩子们去动物园。"
                    },
                    "魚": {
                        japanese: "今夜の晩ご飯は新鮮な魚を焼いて食べましょう。",
                        kana: "こんやの ばんごはんは しんせんな さかなを やいて たべましょう。",
                        chinese: "今晚的晚饭烤新鲜的鱼来吃吧。"
                    },
                    "書く": {
                        japanese: "忘れないように、メモ帳に今日の予定をしっかり書きます。",
                        kana: "わすれないように、めもちょうに きょうの よていを しっかり かきます。",
                        chinese: "为了不忘记，把今天的安排认真写在备忘本上。"
                    },
                    "入る": {
                        japanese: "寒い日は、家に帰ったら温かいお風呂に入りたいです。",
                        kana: "さむい ひは、いえに かえったら あたたかい おふろに はいりたいです。",
                        chinese: "天冷的日子，回到家想泡个热气腾腾的热水澡。"
                    },
                    "暗い": {
                        japanese: "外が暗くなってきたので、部屋の明かりをつけました。",
                        kana: "そとが くらくなって きたので、へやの あかりを つけました。",
                        chinese: "外面天色渐渐暗下来了，打开了房间的灯。"
                    },
                    "床屋": {
                        japanese: "髪がだいぶ伸びてきたので、駅前の床屋へ行ってきます。",
                        kana: "かみが だいぶ のびて きたので、えきまえの とこやへ いってきます。",
                        chinese: "头发长长了不少，我去趟车站前的理发店。"
                    },
                    "持つ": {
                        japanese: "雨が降りそうだから、折りたたみ傘を持って出かけます。",
                        kana: "あめが ふりそうだから、おりたたみかさを もって でかけます。",
                        chinese: "好像要下雨了，带上折叠伞出门。"
                    },
                    "手伝う": {
                        japanese: "引越しの荷造りが大変そうだから、少し手伝いましょうか？",
                        kana: "ひっこしの にづくりが たいへんそうだから、すこし てつだいましょうか？",
                        chinese: "搬家打包行李看起来挺辛苦的，我来帮点忙吧？"
                    },
                    "着ける": {
                        japanese: "外がとても寒いので、温かい手袋を着けて出かけます。",
                        kana: "そとが とても さむいので、あたたかい てぶくろを つけて でかけます。",
                        chinese: "外面非常冷，戴上保暖手套出门。"
                    },
                    "泳ぐ": {
                        japanese: "夏休みに友達と市民プールへ行って、気持ちよく泳ぎました。",
                        kana: "なつやすみに ともだちと しみんぷーるへ いって、きもちよく およぎました。",
                        chinese: "暑假和朋友去市民泳池，痛痛快快地游了泳。"
                    },
                    "弟": {
                        japanese: "私の弟は高校生で、サッカー部に所属して頑張っています。",
                        kana: "わたしの おとうとは こうこうせいで、さっかーぶに しょぞくして がんばっています。",
                        chinese: "我弟弟是个高中生，在足球队里努力训练。"
                    },
                    "姉": {
                        japanese: "姉と一緒に駅前のデパートへ新しい洋服を買いに行きました。",
                        kana: "あねと いっしょに えきまえの でぱーとへ あたらしい ようふくを かいに いきました。",
                        chinese: "和姐姐一起去车站前的百货商店买新衣服了。"
                    },
                    "兄": {
                        japanese: "兄は東京のIT企業でプログラマーとして働いています。",
                        kana: "あには とうきょうの あいてぃーきぎょうで ぷろぐらまーとして はたらいています。",
                        chinese: "哥哥在东京的IT企业担任程序员。"
                    },
                    "妹": {
                        japanese: "妹の誕生日に、可愛いケーキをプレゼントしました。",
                        kana: "いもうとの たんじょうびに、かわいい けーきを ぷれぜんとしました。",
                        chinese: "在妹妹生日时，送了她一个可爱的蛋糕作为礼物。"
                    },
                    "暖かい": {
                        japanese: "春になって、日差しがだんだん暖かくなってきましたね。",
                        kana: "はるに なって、ひざしが だんだん あたたかく なってきましたね。",
                        chinese: "到了春天，阳光渐渐变得暖和起来了呢。"
                    },
                    "速い": {
                        japanese: "日本の新幹線はとても速くて、時間通りに到着します。",
                        kana: "にほんの しんかんせんは とても はやくて、じかんどおりに とうちゃくします。",
                        chinese: "日本的新干线速度非常快，而且准时到达。"
                    },
                    "辛い": {
                        japanese: "このカレーはスパイスが効いていて少し辛いですが、美味しいです。",
                        kana: "この かれーは すぱいすが きいていて すこし からいですが、おいしいです。",
                        chinese: "这个咖喱放了香料虽然有点辣，但很好吃。"
                    },
                    "少ない": {
                        japanese: "平日の午前中なので、電車の中のお客さんは少ないです。",
                        kana: "へいじつの ごぜんちゅうなので、деんしゃの なかの おきゃくさんは すくないです。",
                        chinese: "因为是工作日上午，电车里的乘客很少。"
                    },
                    "多い": {
                        japanese: "休日のショッピングモールは家族連れの人が多いですね。",
                        kana: "きゅうじつの しょっぴんぐもーるは かぞくづれの ひとが おおいですね。",
                        chinese: "节假日的购物中心里全家出游的人很多呢。"
                    },
                    "軽い": {
                        japanese: "この新しいノートパソコンはとても軽くて持ち歩きに便利です。",
                        kana: "この あたらしい のーとぱそこんは とても かるくて もちあるきに べんりです。",
                        chinese: "这台新笔记本电脑非常轻，随身携带很方便。"
                    },
                    "温かい": {
                        japanese: "寒い冬の夜には、温かいお茶を飲むと体が温まります。",
                        kana: "さむい ふゆの よるには、あたたかい おちゃを のむと からだが あたたまります。",
                        chinese: "在寒冷的冬夜里，喝杯热茶身体就暖和起来了。"
                    },
                    "涼しい": {
                        japanese: "秋の風が吹いて、朝晩はずいぶん涼しくなりました。",
                        kana: "あきの かぜが ふいて、あさばんは ずいぶん すずしく なりました。",
                        chinese: "秋风吹拂，早晚变得相当凉爽了。"
                    },
                    "紅葉": {
                        japanese: "秋に京都のお寺へ行って、美しい紅葉を見に行きましょう。",
                        kana: "あきに きょうとの おてらへ いって、うつくしい もみじを みに いきましょう。",
                        chinese: "秋天去京都的寺庙，去看看美丽的红叶吧。"
                    },
                    "疲れる": {
                        japanese: "一日中たくさん歩いたので、足が少し疲れました。",
                        kana: "いちにちじゅう たくさん あるいたので、あしが すこし つかれました。",
                        chinese: "走了一整天路，双腿有点累了。"
                    },
                    "釣り": {
                        japanese: "天気のいい休日に、海へ友達と釣りに行きました。",
                        kana: "てんきの いい きゅうじつに、うみへ ともだちと つりに いきました。",
                        chinese: "天气晴朗的休息日，和朋友去海边钓鱼了。"
                    },
                    "迎える": {
                        japanese: "もうすぐ友達が空港に着くので、車で迎えに行きます。",
                        kana: "もうすぐ ともだちが くうこうに つくので、くるまで むかえに いきます。",
                        chinese: "朋友马上就要到机场了，我开车去接。"
                    },
                    "遊ぶ": {
                        japanese: "週末は近所の公園で子供たちと一緒に楽しく遊びました。",
                        kana: "しゅうまつは きんじょの こうえんで こどもたちと いっしょに たのしく あそびました。",
                        chinese: "周末在附近的公园和孩子们一起开心地玩耍了。"
                    },
                    "消す": {
                        japanese: "部屋を出るときは、忘れずに電気を消してくださいね。",
                        kana: "へやを でるときは、わすれずに でんきを けして くださいね。",
                        chinese: "离开房间时，请别忘了把灯关掉哦。"
                    },
                    "話す": {
                        japanese: "カフェで温かいお茶を飲みながら、友達とゆっくり話しました。",
                        kana: "かふぇで あたたかい おちゃを のみながら、ともだちと ゆっくり はなしました。",
                        chinese: "在咖啡厅边喝热茶，边和朋友悠闲地聊了会儿天。"
                    },
                    "教える": {
                        japanese: "この近くでおすすめの美味しい定食屋を教えていただけますか？",
                        kana: "この ちかくで おすすめの おいしい ていしょくやを おしえて いただけますか？",
                        chinese: "能请您告诉我这附近推荐的好吃定食屋吗？"
                    },
                    "造る": {
                        japanese: "この町では、昔からの伝統的な日本酒を造っています。",
                        kana: "この まちでは、むかしからの でんとうてきな にほんしゅを つくっています。",
                        chinese: "在这个小镇上，酿造着自古相传的传统日本酒。"
                    },
                    "使う": {
                        japanese: "このスマートフォンのカメラは、とても使いやすいですね。",
                        kana: "この すまーとふぉんの かめらは、とても つかいやすい ですね。",
                        chinese: "这款智能手机的相机非常好用呢。"
                    },
                    "作る": {
                        japanese: "今日の夕ご飯は、家で美味しいカレーを作ります。",
                        kana: "きょうの ゆうごはんは、いえで おいしい かれーを つくります。",
                        chinese: "今天晚饭在家里做美味的咖喱。"
                    },
                    "止める": {
                        japanese: "健康のために、毎日のタバコを完全に止めました。",
                        kana: "けんこうの ために、まいにちの たばこを かんぜんに やめました。",
                        chinese: "为了身体健康，彻底戒掉了每天的抽烟习惯。"
                    },
                    "プレイガイド": {
                        japanese: "駅前のプレイガイドで、大好きな歌手のチケットを買いました。",
                        kana: "えきまえの ぷれいがいどで、だいすきな かしゅの ちけっとを かいました。",
                        chinese: "在车站前的售票处买了我最喜欢的歌手的演唱会门票。"
                    },
                    "浴びる": {
                        japanese: "毎朝起きたら、まず温かいシャワーを浴びて目を覚まします。",
                        kana: "まいあさ おきたら、まず あたたかい しゃわーを あびて めを さまします。",
                        chinese: "每天早晨起床后，首先冲个热水澡醒醒神。"
                    },
                    "無くす": {
                        japanese: "買い物中にポケットから家の鍵を落として無くしてしまいました。",
                        kana: "かいものちゅうに ぽけっとから いえの かぎを おとして なくして しまいました。",
                        chinese: "买东西的时候钥匙从口袋掉出来弄丢了。"
                    },
                    "持って来る": {
                        japanese: "明日の会議で使う書類を、忘れずに持って来てください。",
                        kana: "あしたの かいぎで つかう しょるいを、わすれずに もって きて ください。",
                        chinese: "明天会议要用的文件，请千万别忘了带过来。"
                    },
                    "持って行く": {
                        japanese: "午後から雨が降りそうだから、折りたたみ傘を持って行きます。",
                        kana: "ごごから あめが ふりそうだから、おりたたみかさを もって いきます。",
                        chinese: "下午好像要下雨，带上折叠伞去。"
                    },
                    "メートル": {
                        japanese: "ここから駅の改札まで、あと二百メートルくらい歩きます。",
                        kana: "ここから えきの かいさつまで、あと にひゃくめーとるくらい あるきます。",
                        chinese: "从这里到车站检票口，大概还要再走两百米。"
                    },
                    "捨てる": {
                        japanese: "机の上の要らなくなったレシートをゴミ箱に捨てます。",
                        kana: "つくえの うえの いらなくなった れしーとを ごみばこに すてます。",
                        chinese: "把桌上不需要的收据扔进垃圾桶。"
                    },
                    "靴": {
                        japanese: "新しい歩きやすい靴を履いて、散歩に出かけました。",
                        kana: "あたらしい あるきやすい くつを はいて、さんぽに でかけました。",
                        chinese: "穿上新买的合脚好走的鞋子出门散步了。"
                    },
                    "土曜日": {
                        japanese: "土曜日の夜は、家で好きな映画を観てのんびり過ごします。",
                        kana: "どようびの よるは、いえで すきな えいがを みてのんびり すごします。",
                        chinese: "周六的晚上，在家看喜欢的电影惬意地度过。"
                    },
                    "昨日": {
                        japanese: "昨日は一日中雨が降っていたので、家で読書をしていました。",
                        kana: "きのうは いちにちじゅう あめが ふっていたので、いえで どくしょを していました。",
                        chinese: "昨天下了一整天的雨，所以一直在家里看书。"
                    },
                    "暇": {
                        japanese: "明日の午後は暇ですから、駅前のカフェでお茶でもしませんか？",
                        kana: "あしたの ごごは ひまですから、えきまえの かふぇで おちゃでも しませんか？",
                        chinese: "明天下午我有空，要不要去车站前的咖啡厅喝杯茶？"
                    },
                    "白い": {
                        japanese: "昨夜雪が降って、屋根が真っ白に染まりました。",
                        kana: "さくや ゆきが ふって、やねが まっしろに そまりました。",
                        chinese: "昨晚下了雪，屋顶染成了一片雪白。"
                    },
                    "夫": {
                        japanese: "私の夫は毎朝早く起きて、朝ごはんを作ってくれます。",
                        kana: "わたしの おっとは まいあさ はやく おきて、あさごはんを つくってくれます。",
                        chinese: "我丈夫每天早上很早起床，为我做早餐。"
                    },
                    "奥さん": {
                        japanese: "田中さんの奥さんは、とても親切で明るい方ですね。",
                        kana: "たなかさんの おくさんは、とても しんせつで あかるい かたですね。",
                        chinese: "田中先生的太太是一位非常热情开朗的人呢。"
                    },
                    "月曜日": {
                        japanese: "月曜日の朝は、通勤電車がいつもより少し混み合っています。",
                        kana: "げつようびの あさは、つうきんでんしゃが いつもより すこし こみあっています。",
                        chinese: "周一早晨的通勤电车比平时稍微要拥挤一些。"
                    },
                    "故障": {
                        japanese: "エアコンが故障して動かないので、修理を頼みました。",
                        kana: "えあこんが こしょうして うごかないので、しゅうりを たのみました。",
                        chinese: "空调故障不转了，所以叫了报修。"
                    },
                    "お正月": {
                        japanese: "お正月には家族みんなで集まって、神社へ初詣に行きます。",
                        kana: "おしょうがつには かぞく みんなで あつまって、じんじゃへ はつもうでに いきます。",
                        chinese: "新年正月全家聚在一起，去神社进行新年参拜。"
                    },
                    "良く": {
                        japanese: "この公園は静かなので、休みの日に良く散歩に来ます。",
                        kana: "この こうえんは しずかなので、やすみの ひに よく さんぽに きます。",
                        chinese: "这个公园很安静，休息日我经常来散步。"
                    },
                    "勝つ": {
                        japanese: "昨日のサッカーの試合は、応援していたチームが勝ちました！",
                        kana: "きのうの さっかーの しあいは、おうえんしていた ちーむが かちました！",
                        chinese: "昨天的足球比赛，我支持的队伍赢了！"
                    },
                    "着物": {
                        japanese: "京都を散策するときに、綺麗な着物を着て歩きました。",
                        kana: "きょうとを さんさくするときに、きれいな きものを きて あるきました。",
                        chinese: "漫步京都的时候，穿上了漂亮的和服行走。"
                    },
                    "言葉": {
                        japanese: "会話のときは、相手の気持ちを考えた優しい言葉を使いたいです。",
                        kana: "かいわの ときは、あいての きもちを かんがえた やさしい ことばを つかいたいです。",
                        chinese: "说话时，希望使用体谅对方心情的温和言辞。"
                    },
                    "ですから": {
                        japanese: "明日は朝早くから仕事があります。ですから、今夜は早く寝ます。",
                        kana: "あしたは あさはやくから しごとが あります。ですから、こんやは はやく ねます。",
                        chinese: "明天一早开始有工作。因此，今晚要早点睡觉。"
                    },
                    "洗う": {
                        japanese: "ご飯を食べる前に、石鹸で手をきれいに洗ってください。",
                        kana: "ごはんを たべる まえに、せっけんで てを きれいに あらって ください。",
                        chinese: "吃饭前，请用肥皂把手洗干净。"
                    },
                    "弾く": {
                        japanese: "子供の頃から趣味でピアノを楽しく弾いています。",
                        kana: "こどもの ころから しゅみで ぴあのを たのしく ひいています。",
                        chinese: "从小时候起就出于兴趣开心地弹钢琴。"
                    },
                    "換える": {
                        japanese: "汚れてしまったシーツを外して、清潔なものに換えました。",
                        kana: "よごれて しまった しーつを はずして、せいけつな ものに かえました。",
                        chinese: "把弄脏了的床单拆下，换上了干净的。"
                    },
                    "大切": {
                        japanese: "家族や友達と楽しく過ごす時間は、私にとって一番大切です。",
                        kana: "かぞくや ともだちと たのしく すごす じかんは、わたしにとって いちばん たいせつです。",
                        chinese: "和家人朋友开心的共处时光，对我来说是最珍贵的。"
                    },
                    "答え": {
                        japanese: "先生の質問に、元気よく大きな声で答えました。",
                        kana: "せんせいの しつもんに、げんきよく おおきな こえで こたえました。",
                        chinese: "面对老师的提问，精神饱满地大声做出了回答。"
                    },
                    "熱": {
                        japanese: "少し熱があるようなので、体温計で熱を測ってみました。",
                        kana: "すこし ねつが あるようなので、たいおんけいで ねつを はかってみました。",
                        chinese: "感觉有点发烧，就用体温计测了一下体温。"
                    },
                    "払う": {
                        japanese: "コンビニのレジでお会計をスマートフォンで払いました。",
                        kana: "こんびにの れじで おかいけいを すまーとふぉんで はらいました。",
                        chinese: "在便利店收银台用手机支付结了账。"
                    },
                    "明るい": {
                        japanese: "この部屋は南向きで窓が大きく、とても明るいです。",
                        kana: "この へやは みなみむきで まどが おおきく、とても あかるいです。",
                        chinese: "这间房间朝南窗户很大，采光非常明亮。"
                    },
                    "製品": {
                        japanese: "日本の電化製品は品質が良くて、海外でもとても人気があります。",
                        kana: "にほんの でんかせいひんは ひんしつが よくて、かいがいでも とても にんきが あります。",
                        chinese: "日本的家用电器质量很好，在海外也极受欢迎。"
                    },
                    "専門": {
                        japanese: "大学では情報システムを専門に学んでいます。",
                        kana: "だいがくでは じょうほうしすてむを せんもんに まなんでいます。",
                        chinese: "在大学里专门主修信息系统专业。"
                    },
                    "広い": {
                        japanese: "新しいアパートの部屋は広くて、住み心地がとても良いです。",
                        kana: "あたらしい あぱーとの へやは ひろくて、すみごこちが とても よいです。",
                        chinese: "新公寓的房间很宽敞，住起来非常舒服。"
                    },
                    "お祭り": {
                        japanese: "夏休みには近所の神社で賑やかなお祭りが開かれます。",
                        kana: "なつやすみには きんじょの じんじゃで にぎやかな おまつりが ひらかれます。",
                        chinese: "暑假期间附近的神社会举行热闹的夏日祭典。"
                    },
                    "速達": {
                        japanese: "明日の朝までに届くように、郵便局から速達で出しました。",
                        kana: "あしたの あさまでに とどくように、ゆうびんきょくから そくたつで だしました。",
                        chinese: "为了明天早晨能送到，特意从邮局寄了特快专递。"
                    },
                    "住所": {
                        japanese: "小包を送りたいので、この伝票に住所とお名前を書いてください。",
                        kana: "こづつみを おくりたいので、この でんぴょうに じゅうしょと おなまえを かいて ください。",
                        chinese: "想寄个包裹，请在这张快递单上写下地址和姓名。"
                    },
                    "間": {
                        japanese: "仕事の合間の休みに、温かいコーヒーを一杯飲みました。",
                        kana: "しごとの あいまの やすみに、あたたかい こーひーを いっぱい のみました。",
                        chinese: "在工作间歇的休息时间里，喝了一杯热咖啡。"
                    },
                    "後": {
                        japanese: "駅の改札口の後ろに、コインロッカーがありますよ。",
                        kana: "えきの かいさつぐちの うしろに、こいんろっかーが ありますよ。",
                        chinese: "车站检票口的后方就有投币式储物柜哦。"
                    },
                    "この間": {
                        japanese: "この間、駅前に新しくできたパン屋さんへ行ってきました。",
                        kana: "このあいだ、えきまえに あたらしく できた ぱんやさんへ いってきました。",
                        chinese: "前些天，我去了车站前新开的面包店。"
                    },
                    "けど": {
                        japanese: "日本語の漢字は少し難しいですけど、勉強するのが楽しいです。",
                        kana: "にほんごの かんじは すこし むずかしいですけど、べんきょうするのが たのしいです。",
                        chinese: "日语的汉字虽然稍微有点难，但学起来很有趣。"
                    },
                    "無駄": {
                        japanese: "買いすぎないように気をつけて、無駄遣いを減らしています。",
                        kana: "かいすぎないように きをつけて、むだづかいを へらしています。",
                        chinese: "注意不要买太多，尽量减少不必要的浪费。"
                    },
                    "仕方がない": {
                        japanese: "電車が止まってしまったので、タクシーで行くのも仕方がないですね。",
                        kana: "でんしゃが とまって しまったので、たくしーで いくのも しかたがないですね。",
                        chinese: "电车停运了，坐出租车去也是无可奈何的办法呢。"
                    },
                    "聞く": {
                        japanese: "道が分からなくなったので、交番の警察官に聞きました。",
                        kana: "みちが わからなく なったので、こうばんの けいさつかんに ききました。",
                        chinese: "迷了路，向交警亭里的警察询问了路。"
                    },
                    "ポスト": {
                        japanese: "手紙を投函するために、駅前の赤いポストへ行きました。",
                        kana: "てがみを とうかん するために、えきまえの あかい ぽすとへ いきました。",
                        chinese: "为了投递信件，去了车站前红色的邮筒。"
                    },
                    "気をつける": {
                        japanese: "外は雪で滑りやすいですから、足元に気をつけて歩いてくださいね。",
                        kana: "そとは ゆきで すべりやすいですから、あしもとに きをつけて あるいて くださいね。",
                        chinese: "外面下雪路滑，走路时请当心脚下哦。"
                    },
                    "幾ら": {
                        japanese: "すみません、このリンゴはおひとつ幾らですか？",
                        kana: "すみません、この りんごは おひとつ いくらですか？",
                        chinese: "不好意思，请问这个苹果一个多少钱？"
                    },
                    "引っ越し": {
                        japanese: "来週の週末に、駅の近くの静かな部屋へ引っ越しします。",
                        kana: "らいしゅうの しゅうまつに、えきの ちかくの しずかな へやへ ひっこし します。",
                        chinese: "下周末打算搬迁到车站附近一间安静的房间。"
                    },
                    "チャンス": {
                        japanese: "海外で働ける素晴らしいチャンスを逃したくないです。",
                        kana: "かいがいで はたらける すばらしい ちゃんすを のがしたくないです。",
                        chinese: "不想错过去海外工作的绝佳良机。"
                    },
                    "田舎": {
                        japanese: "大型連休には田舎の実家へ帰って、のんびり過ごします。",
                        kana: "おおがたれんきゅうには いなかの じっかへ かえって、のんびり すごします。",
                        chinese: "大长假回乡下老家，悠闲自在地度过。"
                    },
                    "留学": {
                        japanese: "来年の四月から、東京の大学へ日本語留学に行く予定です。",
                        kana: "らいねんの しがつから、とうきょうの だいがくへ にほんごりゅうがくに いく よていです。",
                        chinese: "计划从明年四月起去东京的大学进行日语留学。"
                    },
                    "全部": {
                        japanese: "お腹がすいていたので、お弁当を全部きれいに食べました。",
                        kana: "おなかが すいていたので、おべんとうを ぜんぶ きれいに たべました。",
                        chinese: "因为肚子很饿，把便当吃得干干净净一点没剩。"
                    },
                    "お菓子": {
                        japanese: "午後のティータイムに、美味しいお菓子とお茶をいただきました。",
                        kana: "ごごの てぃーたいむに、おいしい おかしと おちゃを いただきました。",
                        chinese: "在下午茶时间，品尝了美味的点心与茶饮。"
                    },
                    "意味": {
                        japanese: "辞書で調べたら、この言葉の詳しい意味がよく分かりました。",
                        kana: "じしょで しらべたら、この ことばの くわしい いみが よく わかりました。",
                        chinese: "在词典里一查，这个词的详细含义就完全弄明白了。"
                    },
                    "準備": {
                        japanese: "明日の朝早い旅行に備えて、今夜のうちに荷物の準備をします。",
                        kana: "あしたの あさはやい りょこうに そなえて、こんやの うちに にもつの じゅんびを します。",
                        chinese: "为了明天早起出行，今晚先把行李准备好。"
                    },
                    "お婆さん": {
                        japanese: "混んでいるバスの中で、お婆さんに親切に席を譲りました。",
                        kana: "こんでいる ばすの なかで、おばあさんに しんせつに せきを ゆずりました。",
                        chinese: "在拥挤的公交车上，客气地给老奶奶让了座位。"
                    },
                    "おじいさん": {
                        japanese: "近所のおじいさんは、毎朝決まった時間に公園を散歩しています。",
                        kana: "きんじょの おじいさんは、まいあさ きまった じかんに こうえんを さんぽ しています。",
                        chinese: "附近的爷爷每天早晨按固定的时间在公园散步。"
                    },
                    "説明": {
                        japanese: "新しい家電製品の便利な使い方を、店員さんが丁寧に説明してくれました。",
                        kana: "あたらしい かでんせいひんの べんりな つかいかたを、てんいんさんが ていねいに せつめいして くれました。",
                        chinese: "对于新家电的便利功能用法，店员很耐心地做了解释说明。"
                    },
                    "案内": {
                        japanese: "日本に遊びに来た友達を、京都の有名な観光地へ案内しました。",
                        kana: "にほんに あそびに きた ともだちを、きょうとの ゆうめいな かんこうちへ あんないしました。",
                        chinese: "带领来日本玩的朋友参观了京都著名的观光胜地。"
                    },
                    "紹介": {
                        japanese: "先週新しくチームに入った同僚を、みんなに紹介しました。",
                        kana: "せんしゅう あたらしく ちーむに はいった どうりょうを、みんなに しょうかいしました。",
                        chinese: "把上周新加入团队的同事介绍给了大家。"
                    },
                    "御馳走様": {
                        japanese: "とても美味しい晩ご飯でした。ごちそうさまでした！",
                        kana: "とても おいしい ばんごはんでした。ごちそうさまでした！",
                        chinese: "晚饭非常丰盛美味。多谢款待啦！"
                    },
                    "目": {
                        japanese: "パソコンの画面を長時間見つめていて、目が少し疲れました。",
                        kana: "ぱそこんの がめんを ちょうじかん みつめていて、めが すこし つかれました。",
                        chinese: "长时间盯着电脑屏幕，眼睛感觉有点疲惫了。"
                    },
                    "駐車場": {
                        japanese: "スーパーの駐車場に車を止めて、買い出しに行きました。",
                        kana: "すーぱーの ちゅうしゃじょうに くるまを とめて、かいだしに いきました。",
                        chinese: "把车停在超市停车场，去采购了日常食材。"
                    },
                    "橋": {
                        japanese: "川にかかる大きな橋を渡って、向こう側の駅へ向かいます。",
                        kana: "かわに かかる おおきな はしを わたって、むこうがわの えきへ むかいます。",
                        chinese: "穿过横跨在河上的大桥，前往对岸的车站。"
                    },
                    "信号": {
                        japanese: "信号が赤から青に変わるまで、横断歩道の前で待ちます。",
                        kana: "しんごうが あかから あおに かわるまで、おうだんほどうの まえで まちます。",
                        chinese: "在斑马线前等待信号灯从红变绿。"
                    },
                    "交差点": {
                        japanese: "次の交差点を右に曲がると、すぐ左手に郵便局が見えますよ。",
                        kana: "つぎの こうさてんを みぎに まがると、すぐ ひだりてに ゆうびんきょくが みえますよ。",
                        chinese: "在下一个十字路口向右转，马上就能在左手边看到邮局哦。"
                    },
                    "道": {
                        japanese: "すみませんが、駅前広場へ続く一番近い道を教えていただけますか？",
                        kana: "すみませんが、えきまえひろばへ つづく いちばん ちかい みちを おしえて いただけますか？",
                        chinese: "不好意思，请问去站前广场最近的路该怎么走？"
                    },
                    "音": {
                        japanese: "静かな夜に、窓の外から心地よい雨の音が聞こえてきます。",
                        kana: "しずかな よるに、まどの そとから ここちよい あめの おとが きこえてきます。",
                        chinese: "在寂静的夜晚，从窗外传来了令人心安的惬意雨声。"
                    },
                    "サイズ": {
                        japanese: "このスニーカーのサイズは私の足にぴったり合っていて、歩きやすいです。",
                        kana: "この すにーかーの さいずは わたしの あしに ぴったり あっていて、あるきやすいです。",
                        chinese: "这双运动鞋的尺码非常合我的脚，走起路来很舒适。"
                    },
                    "電気屋": {
                        japanese: "冷蔵庫の調子が悪くなったので、駅前の電気屋へ見に行きました。",
                        kana: "れいぞうこの ちょうしが わるくなったので、えきまえの でんきやへ みに いきました。",
                        chinese: "冰箱出了点毛病，去车站前的电器店看了一下。"
                    },
                    "おめでとう": {
                        japanese: "日本語能力試験の合格、本当におめでとうございます！",
                        kana: "にほんごのうりょくしけんの ごうかく、ほんとうに おめでとう ございます！",
                        chinese: "日语能力考试顺利合格，真的由衷祝贺你！"
                    },
                    "帽子": {
                        japanese: "夏の日差しがとても強いので、お気に入りの帽子をかぶって出かけます。",
                        kana: "なつの ひざしが とても つよいので、おきにいりの ぼうしを かぶって でかけます。",
                        chinese: "夏天的阳光非常强烈，戴上心仪的帽子出门。"
                    },
                    "セーター": {
                        japanese: "冬の寒い朝には、温かい毛糸のセーターを着て出かけます。",
                        kana: "ふゆの さむい あさには、あたたかい けいとの せーたーを きて でかけます。",
                        chinese: "在冬天寒冷的早晨，穿上温暖的毛线衣出门。"
                    },
                    "スーツ": {
                        japanese: "明日の大切な面接に向けて、濃紺のスーツをきれいにアイロンがけしました。",
                        kana: "あしたの たいせつな めんせつに むけて、のうこんの すーつを きれいに あいろんがけ しました。",
                        chinese: "为了明天重要的面试，把深蓝色的西装整齐地熨烫好了。"
                    },
                    "コート": {
                        japanese: "外が急に冷え込んできたので、厚手のコートを着て出かけました。",
                        kana: "そとが きゅうに ひえこんできたので、あつでの こーとを きて でかけました。",
                        chinese: "外面突然大幅降温，穿上了厚大衣出门。"
                    },
                    "ほんとうに": {
                        japanese: "困っているときに親切に手伝ってくれて、本当に助かりました！",
                        kana: "こまっている ときに しんせつに てつだってくれて、ほんとうに たすかりました！",
                        chinese: "在我犯难时热情地出手相助，真的帮了大忙了！"
                    },
                    "きっと": {
                        japanese: "毎日コツコツ練習を続けてきたから、明日の本番はきっとうまくいきますよ。",
                        kana: "まいにち こつこつ れんしゅうを つづけてきたから、あしたの ほんばんは きっと うまくいきますよ。",
                        chinese: "每天都踏实坚持练习过来了，明天的正式发挥一定能顺利！"
                    },
                    "たぶん": {
                        japanese: "今夜の天気予報を見ると、夜中からたぶん雪が降り始めるでしょう。",
                        kana: "こんやの てんきよほうを みると、よなかから たぶん ゆきが ふりはじめるでしょう。",
                        chinese: "看今晚的天气预报，后半夜大概会开始下雪吧。"
                    },
                    "最近": {
                        japanese: "最近仕事が少し忙しくて、家でゆっくり料理する時間が取れません。",
                        kana: "さいきん しごとが すこし いそがしくて、いえで ゆっくり りょうりする じかんが とれません。",
                        chinese: "最近工作有点繁忙，抽不出时间在家里悠闲地做饭。"
                    },
                    "交通": {
                        japanese: "このマンションは駅から歩いて三分で、交通がとても便利です。",
                        kana: "この まんしょんは えきから あるいて さんぷんで、こうつうが とても べんりです。",
                        chinese: "这栋公寓从车站步行只要三分钟，交通出行极其便利。"
                    },
                    "デザイン": {
                        japanese: "このバッグはシンプルなデザインで、毎日の通勤に重宝しています。",
                        kana: "この ばっぐは しんぷるな でざいんで、まいにちの つうきんに ちょうほう しています。",
                        chinese: "这个包包设计简约大方，每天通勤都非常实用称心。"
                    },
                    "そちら": {
                        japanese: "そちらの窓側の席へどうぞ、ご案内いたします。",
                        kana: "そちらの まどがわの せきへ どうぞ、ごあんない いたします。",
                        chinese: "请往那边的靠窗座位走，我来为您带路。"
                    },
                    "あちら": {
                        japanese: "あちらのカウンターで注文とお会計をお願いします。",
                        kana: "あちらの かうんたーで ちゅうもんと おかいけいを おねがいします。",
                        chinese: "请在那边的柜台点单结账。"
                    },
                    "濡れる": {
                        japanese: "急に雨が降ってきたので、上着が少し濡れてしまいました。",
                        kana: "きゅうに あめが ふってきたので、うわぎが すこし ぬれて しまいました。",
                        chinese: "突然下起雨来，外套有点被淋湿了。"
                    },
                    "空く": {
                        japanese: "朝から何も食べていないので、お腹が空きました。",
                        kana: "あさから なにも たべていないので、おなかが すきました。",
                        chinese: "从早上一开始什么都没吃，肚子饿了。"
                    },
                    "危ない": {
                        japanese: "夜遅くの一人歩きは危ないですから、気をつけて帰ってくださいね。",
                        kana: "よるおそくの ひとりあるきは あぶないですから、きをつけて かえって くださいね。",
                        chinese: "深夜一个人走夜路很危险，回去时请路上多加小心哦。"
                    },
                    "ホテル": {
                        japanese: "旅行先で駅のすぐ近くにある綺麗なホテルに泊まりました。",
                        kana: "りょこうさきで えきの すぐちかくに ある きれいな ほてるに とまりました。",
                        chinese: "在旅行目的地，住了一家就在车站附近的干净酒店。"
                    },
                    "港": {
                        japanese: "夕方に海沿いの港へ散歩に行って、停まっている船を見ました。",
                        kana: "ゆうがたに うみづたいの みなとへ さんぽに いって、とまっている ふねを みました。",
                        chinese: "傍晚去海边的港口散步，看了停靠在那里的船只。"
                    },
                    "景色": {
                        japanese: "山の頂上から見下ろす街の景色は、本当に素晴らしかったです。",
                        kana: "やまの ちょうじょうから みおろす まちの けしきは、ほんとうに すばらしかったです。",
                        chinese: "从山顶俯瞰小镇的景色，真是太壮丽了。"
                    },
                    "太い": {
                        japanese: "このノートには、少し太いペンで書くと字が見やすいです。",
                        kana: "この のーとには、すこし ふとい ぺんで かくと じが みやすいです。",
                        chinese: "在这个笔记本上，用稍粗一点的笔写字会更容易看清。"
                    },
                    "お酒": {
                        japanese: "仕事が終わった後、同僚と居酒屋で美味しいお酒を飲みました。",
                        kana: "しごとが おわったあと、どうりょうと いざかやで おいしい おさけを のみました。",
                        chinese: "工作结束后，和同事在居酒屋喝了美味的美酒。"
                    },
                    "上手": {
                        japanese: "田中さんは日本語の日常会話がとても上手ですね。",
                        kana: "たなかさんは にほんごの にちじょうかいわが とても じょうずですね。",
                        chinese: "田中先生的日语日常交流会话非常出色娴熟呢。"
                    },
                    "下手": {
                        japanese: "料理はまだ少し下手ですが、毎日楽しく練習しています。",
                        kana: "りょうりは まだ すこし へたですが、まいにち たのしく れんしゅう しています。",
                        chinese: "烹饪虽然做得还不够熟练，但每天都在开心地练习。"
                    },
                    "好き": {
                        japanese: "休日の朝に、好きな音楽を聴きながらのんびり過ごすのが好きです。",
                        kana: "きゅうじつの あさに、すきな おんがくを ききながら のんびり すごすのが すきです。",
                        chinese: "在假日的早晨，一边听喜欢的音乐一边悠闲度过是我的最爱。"
                    },
                    "嫌い": {
                        japanese: "子供の頃は苦いピーマンが嫌いでしたが、今は美味しく食べられます。",
                        kana: "こどもの ころは にがい ぴーまんが きらいでしたが、いまは おいしく たべられます。",
                        chinese: "小时候讨厌吃带苦味的青椒，现在能吃得津津有味了。"
                    },
                    "自信": {
                        japanese: "一生懸命勉強してきたので、自分に自信を持って面接に行きます。",
                        kana: "いっしょうけんめい べんきょうしてきたので、じぶんに じしんを もって めんせつに いきます。",
                        chinese: "拼尽全力认真准备过了，带着自信前往面试。"
                    },
                    "理解": {
                        japanese: "先生の丁寧な説明を聞いて、難しい言葉の意味がよく理解できました。",
                        kana: "せんせいの ていねいな せつめいを きいて、むずかしい ことばの いみが よく りかい できました。",
                        chinese: "听了老师耐心的讲解，难懂词汇的意思完全理解透彻了。"
                    },
                    "運転": {
                        japanese: "天気のいい週末に、家族と一緒に車を運転して海へ行きました。",
                        kana: "てんきの いい しゅうまつに、かぞくと いっしょに くるまを うんてんして うみへ いきました。",
                        chinese: "在天气晴朗的周末，和家人一起开车去海边兜风。"
                    },
                    "機会": {
                        japanese: "日本へ旅行に行く機会があったら、ぜひ本場の寿司を食べたいです。",
                        kana: "にほんへ りょこうに いく きかいが あったら、ぜひ ほんばの すしを たべたいです。",
                        chinese: "如果有机会去日本旅行的话，一定要尝尝正宗的寿司。"
                    },
                    "お年玉": {
                        japanese: "お正月に親戚のおじいさんから嬉しいお年玉をもらいました。",
                        kana: "おしょうがつに しんせきの おじいさんから うれしい おとしだまを もらいました。",
                        chinese: "在新年正月从亲戚爷爷那里收到了开心的压岁钱。"
                    },
                    "セット": {
                        japanese: "お昼休みに、ハンバーガーとポテトのお得なランチセットを頼みました。",
                        kana: "おひるやすみに、はんばーがーと ぽてとの おとくな らんちせっとを たのみました。",
                        chinese: "午休时点了一份汉堡加薯条的实惠午间套餐。"
                    },
                    "領収書": {
                        japanese: "会社の経費で精算するために、レジで領収書をもらいました。",
                        kana: "かいしゃの けいひで せいさん するために、れじで りょうしゅうしょを もらいました。",
                        chinese: "为了回公司报销报账，在收银台开具了发票收据。"
                    },
                    "セロテープ": {
                        japanese: "封筒をしっかり閉じるために、セロテープを貼りました。",
                        kana: "ふうとうを しっかり とじるために、せろてーぷを はりました。",
                        chinese: "为了把信封封牢，贴上了透明胶带。"
                    },
                    "いらっしゃる": {
                        japanese: "田中先生は今、研究室にいらっしゃいますか？",
                        kana: "たなかせんせいは いま、けんきゅうしつに いらっしゃいますか？",
                        chinese: "请问田中老师现在在研究室吗？"
                    },
                    "希望勤務地": {
                        japanese: "面接で希望勤務地を聞かれたので、東京と答えました。",
                        kana: "めんせつで きぼうきんむちを きかれたので、とうきょうと こたえました。",
                        chinese: "面试时被问及希望工作地点，回答了东京。"
                    },
                    "選考を受ける": {
                        japanese: "来週の月曜日に、第一志望の企業の採用選考を受けに行きます。",
                        kana: "らいしゅうの げつようびに、だいいちしぼうの きぎょうの さいようせんこうを うけに いきます。",
                        chinese: "下周一前往心仪的第一志愿企业参加招聘录用选考。"
                    },
                    "都合がいい": {
                        japanese: "来週の土曜日で、ご都合がいい時間を教えていただけますか？",
                        kana: "らいしゅうの どようびで、ごつごうが いい じかんを おしえて いただけますか？",
                        chinese: "下周六您方便的时间，能请您告诉我一下吗？"
                    },
                    "来年": {
                        japanese: "来年は友達と一緒に、北海道へ旅行に行きたいと思っています。",
                        kana: "らいねんは ともだちと いっしょに、ほっかいどうへ りょこうに いきたいと おもっています。",
                        chinese: "打算明年和朋友一起去北海道旅行。"
                    },
                    "去年": {
                        japanese: "去年の秋に、京都のお寺へ美しい紅葉を見に行きました。",
                        kana: "きょねんの あきに、きょうとの おてらへ うつくしい もみじを みに いきました。",
                        chinese: "去年秋天，去京都的寺庙看了美丽的红叶。"
                    },
                    "今年": {
                        japanese: "今年の夏休みは、家族と一緒に温泉でのんびり過ごす予定です。",
                        kana: "ことしの なつやすみは、かぞくと いっしょに おんせんで のんびり すごす よていです。",
                        chinese: "今年暑假打算和家人一起在温泉旅馆悠闲度过。"
                    },
                    "再来月": {
                        japanese: "再来月には楽しみにしていた桜の季節がやってきます。",
                        kana: "さらいげつには たのしみに していた さくらの きせつが やってきます。",
                        chinese: "到了下下个月，一直期待着的樱花季就要到来了。"
                    }
                };

                // 智能生活语境造句引擎（拒绝敷衍模板，覆盖日常真实生活场景）
                const generateFallbackSentence = (item) => {
                    if (!item) return null;
                    const word = (item.word || '').trim();
                    const kana = (item.kana || '').trim();
                    const rawMeaning = (item.meaning || '').trim();

                    const cleanWord = word.replace(/^[~～\-]/, '').replace(/[~～\-]$/, '').trim();
                    const cleanKana = kana.replace(/^[~～\-]/, '').replace(/[~～\-]$/, '').trim();
                    const cleanMeaning = rawMeaning.replace(/[\[\(（【].*?[\]\)）】]/g, '').split(/[；;,，\/、]/)[0].trim() || cleanWord;

                    if (!cleanWord) return null;

                    // 1. 优先匹配精心打磨的日常生活对话库
                    if (CURATED_DAILY_CONVERSATIONS[cleanWord]) {
                        const sw = CURATED_DAILY_CONVERSATIONS[cleanWord];
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: sw.japanese,
                            kana: sw.kana,
                            chinese: sw.chinese,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    const m = cleanMeaning;

                    // 2. 时间、日期、月份与安排
                    if (/^(今日|明日|昨日|今週|来週|先週|再来週|今月|来月|先月|再来月|今年|来年|去年|週末|朝|昼|晩|夜|午前|午後|夕方|夜中|月曜日|火曜日|水曜日|木曜日|金曜日|土曜日|日曜日|春休み|夏休み|冬休み)/.test(cleanWord) ||
                        /(时间|天|周|星期|月份|今年|明年|去年|下个月|上个月|上周|下周|昨天|今天|明天|早晨|早|晚|夜|点|分|日|假日|休假)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `今度の${cleanWord}に、友達と駅前のカフェで会う約束をしました。`,
                            kana: `こんどの ${cleanKana}に、ともだちと えきまえの かふぇで あう やくそくを しました。`,
                            chinese: `和朋友约好了在下次${cleanMeaning}去车站前的咖啡馆碰面。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 3. 考试、面试、会议与工作安排
                    if (/^(テスト|試験|面接|会議|打合せ|打ち合わせ|残業|出張|研修|発表|プレゼン|面談|相談)/.test(cleanWord) ||
                        /(考试|测验|面试|会议|商量|出差|加班|培训|研讨|答辩)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `明日の${cleanWord}に向けて、しっかり準備をしておきます。`,
                            kana: `あしたの ${cleanKana}に むけて、しっかり じゅんびを して おきます。`,
                            chinese: `面向明天的${cleanMeaning}，提前做好充分的准备。`,
                            category: 'work',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 4. 调料与厨房烹饪
                    if (/^(醤油|塩|砂糖|油|胡椒|ソース|みりん|酢|味噌|スパイス|調味料)/.test(cleanWord) ||
                        /(酱油|盐|糖|油|胡椒|醋|味噌|调味|香料)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `お料理に少し${cleanWord}を加えて、味を調えます。`,
                            kana: `おりょうりに すこし ${cleanKana}を くわえて、あじを ととのえます。`,
                            chinese: `在料理中稍微加入一点${cleanMeaning}，调和味道。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 5. 食物与饮品（排除饭店/宾馆）
                    if (!/ホテル|旅館|民宿/.test(cleanWord) && (
                        /^(食べる|飲む|パン|ご飯|お茶|酒|ビール|肉|魚|野菜|果物|卵|水|牛乳|ラーメン|寿司|リンゴ|みかん|カレー|定食|ケーキ|コーヒー)/.test(cleanWord) ||
                        /(吃|喝|饮|饭|菜|茶|酒|肉|鱼|水果|面包|蛋糕|汤|蛋|果|苹果|咖啡|啤酒)/.test(m))) {
                        const isDrink = /(喝|饮|茶|酒|咖啡|啤酒|水|奶)/.test(m);
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: isDrink
                                ? `喉が渇いたので、温かい${cleanWord}を一杯飲みました。`
                                : `お腹がすいたので、近くのお店で美味しい${cleanWord}を食べました。`,
                            kana: isDrink
                                ? `のどが かわいたので、あたたかい ${cleanKana}を いっぱい のみました。`
                                : `おなかが すいたので、ちかくの おみせで おいしい ${cleanKana}を たべました。`,
                            chinese: isDrink
                                ? `口渴了，喝了一杯温热的${cleanMeaning}。`
                                : `肚子饿了，在附近的餐馆吃了美味的${cleanMeaning}。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 6. 交通出行与站点设施
                    if (/^(電車|バス|タクシー|地下鉄|新幹線|飛行機|船|自転車|車|切符|駅|改札|空港|トラック|バイク)/.test(cleanWord) ||
                        /(车|船|飞机|站|路|乘|交通|票|检票|机场|班车|地铁|卡车|摩托)/.test(m)) {
                        const isStation = /(駅|改札|ホーム|空港|港)/.test(cleanWord);
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: isStation
                                ? `約束の時間に遅れないように、早めに${cleanWord}に到着しました。`
                                : `毎日の通勤や移動で、${cleanWord}をよく利用しています。`,
                            kana: isStation
                                ? `やくそくの じかんに おくれないように、はやめに ${cleanKana}に とうちゃく しました。`
                                : `まいにちの つうきんや いどうで、${cleanKana}を よく りよう しています。`,
                            chinese: isStation
                                ? `为了不耽误约好的时间，提前到达了${cleanMeaning}。`
                                : `在每天的通勤与日常出行中，经常使用${cleanMeaning}。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 7. 政府机构、公共场所与店铺设施
                    if (/^(スーパー|コンビニ|デパート|病院|薬局|銀行|郵便局|公園|図書館|学校|ホテル|レストラン|カフェ|交番|映画館|区役所|市役所|大使館|警察署)/.test(cleanWord) ||
                        /(店|馆|院|局|行|场|所|园|室|校|房|公寓|旅馆|超市|办事处|政府)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `用事があったので、午後に駅の近くの${cleanWord}へ行ってきました。`,
                            kana: `ようじが あったので、ごごに えきの ちかくの ${cleanKana}へ いってきました。`,
                            chinese: `因为有点事情，下午去了车站附近的${cleanMeaning}。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 8. 衣物与服饰配件
                    if (/^(服|靴|鞄|帽子|眼鏡|財布|傘|時計|シャツ|コート|ズボン|スカート|手袋|ネクタイ)/.test(cleanWord) ||
                        /(衣服|鞋|包|帽|镜|伞|表|衫|外套|裤|裙|手套|领带|穿|戴)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `出かける前に、お気に入りの${cleanWord}を身につけました。`,
                            kana: `でかける まえに、おきにいりの ${cleanKana}を みにつけました。`,
                            chinese: `出门前，换上了心仪的${cleanMeaning}。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 9. 身体部位与健康医疗（排除港口、门口等词汇中的“口”）
                    if (!/港|出口|入口|改札口/.test(cleanWord) && (
                        /^(頭|目|耳|口|手|足|喉|お腹|熱|風邪|病気|薬|歯)/.test(cleanWord) ||
                        /(头|眼|耳|喉|腹|肚子|身体|生病|痛|发烧|感冒|吃药)/.test(m))) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `体調を崩さないように、${cleanWord}の調子にいつも気をつけています。`,
                            kana: `たいちょうを くずさないように、${cleanKana}の ちょうしに いつも きをつけています。`,
                            chinese: `为了不搞坏身体，平时一直留意着${cleanMeaning}的状况。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 10. 天气、季节与自然环境
                    if (/^(雨|雪|風|空|海|山|川|晴れ|春|夏|秋|冬|花|木|星)/.test(cleanWord) ||
                        /(天气|雨|雪|风|晴天|阴天|季节|春天|夏天|秋天|冬天|大海|高山|河流|花朵|树木|星星)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `窓の外を見ると、爽やかな${cleanWord}の景色が広がっていて気持ちいいです。`,
                            kana: `まどの そとを みると、さわやかな ${cleanKana}の けしきが ひろがっていて きもちいいです。`,
                            chinese: `朝窗外望去，清爽宜人的${cleanMeaning}景色映入眼帘，让人心情舒畅。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 11. 人物、家人与关系
                    if (/^(友達|家族|父|母|兄|姉|弟|妹|子供|先生|同僚|田中|ミラー)/.test(cleanWord) ||
                        /(父亲|母亲|哥哥|姐姐|弟弟|妹妹|孩子|妻子|丈夫|朋友|家人|亲戚|同事|老师|客人)/.test(m)) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `休日の午後に、${cleanWord}と一緒にのんびりとお茶を飲みました。`,
                            kana: `きゅうじつの ごごに、${cleanKana}と いっしょに のんびりと おちゃを のみました。`,
                            chinese: `在假日的下午，和${cleanMeaning}一起悠闲地喝了下午茶。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 12. 动词（词尾是う/く/ぐ/す/つ/ぬ/ぶ/む/る）
                    const isVerb = /[うくぐすつぬぶむる]$/.test(cleanWord) && !/(い|な)$/.test(cleanWord);
                    if (isVerb && cleanWord.length >= 2) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `日常生活の中で、無理をせず自然に${cleanWord}ようにしています。`,
                            kana: `にちじょうせいかつの なかで、むりを せず しぜんに ${cleanKana}ように しています。`,
                            chinese: `在日常生活中，不勉强自己，保持自然地${cleanMeaning}。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 13. い形容词 / な形容词
                    if (cleanWord.endsWith('い') || m.includes('的')) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `この街の暮らしはとても${cleanWord}、住み心地が良くて気に入っています。`,
                            kana: `この まちの くらしは とても ${cleanKana}、すみごこちが よくて きにいっています。`,
                            chinese: `这个小镇的生活非常${cleanMeaning}，住起来格外惬意舒心。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 14. 副词与修饰短语
                    if (/^(また|もっと|ずっと|ゆっくり|いつも|よく|たくさん|少し|だんだん|特に|実は|やはり|もちろん|ちょうど)/.test(cleanKana) ||
                        m.includes('副词') || m.includes('地')) {
                        return {
                            id: 'daily_' + (item.id || cleanWord),
                            japanese: `${cleanWord}、温かいお茶でも飲んで一息つきましょう。`,
                            kana: `${cleanKana}、あたたかい おちゃでも のんで ひといき つきましょう。`,
                            chinese: `${cleanMeaning}，喝杯热茶歇口气吧。`,
                            category: 'life',
                            source: 'daily_conversation',
                            words: [cleanWord]
                        };
                    }

                    // 15. 其它日常生活名词
                    return {
                        id: 'daily_' + (item.id || cleanWord),
                        japanese: `毎日の暮らしの中で、身近な${cleanWord}を大切に使い続けています。`,
                        kana: `まいにちの くらしの なかで、みぢかな ${cleanKana}を たいせつに つかい つづけています。`,
                        chinese: `在平常的日常生活中，非常爱惜身边的${cleanMeaning}。`,
                        category: 'life',
                        source: 'daily_conversation',
                        words: [cleanWord]
                    };
                };

const currentWordSentenceIndex = ref(0);

                const currentWordSentenceList = computed(() => {
                    const word = currentPracticeWord.value;
                    if (!word) return [];
                    return getSentencesForWord(word, sentences.value);
                });

                const currentWordSentence = computed(() => {
                    const list = currentWordSentenceList.value;
                    if (list.length === 0) return null;
                    const idx = Math.abs(currentWordSentenceIndex.value) % list.length;
                    return list[idx];
                });

                const nextWordSentence = () => {
                    if (currentWordSentenceList.value.length > 1) {
                        currentWordSentenceIndex.value = (currentWordSentenceIndex.value + 1) % currentWordSentenceList.value.length;
                    }
                };

                const playCurrentWordSentence = () => {
                    if (currentWordSentence.value) {
                        playSentence(currentWordSentence.value);
                    }
                };

                watch(currentPracticeWord, () => {
                    currentWordSentenceIndex.value = 0;
                });

                const startPractice = (forceRandom = false) => {
                    let queue = [];
                    const now = Date.now();

                    if (forceRandom) {
                        queue = [...words.value];
                        // Shuffle
                        for (let i = queue.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [queue[i], queue[j]] = [queue[j], queue[i]];
                        }
                        queue = queue.slice(0, 30);
                    } else {
                        queue = words.value.filter(w => (w.next_review_date || 0) <= now);
                        // Shuffle
                        for (let i = queue.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [queue[i], queue[j]] = [queue[j], queue[i]];
                        }
                    }

                    todayQueue.value = queue;
                    initialQueueLength.value = queue.length;

                    if (queue.length > 0) {
                        practiceState.value = 'listening';
                        speakCurrent();
                    }
                };

                const cleanPronunciation = (str) => {
                    if (!str) return '';
                    return str
                        .replace(/[~～・·…\.\(\)（）\/、，,。！？!?\-_—\s]/g, '')
                        .trim();
                };

                const getWordAudioText = (item) => {
                    if (!item) return '';
                    if (typeof item === 'string') return cleanPronunciation(item);

                    // 若用户手动指定“纯假名逐字拼读”，则直接取假名
                    if (audioTarget.value === 'kana') {
                        const cleanKana = cleanPronunciation(item.kana);
                        if (cleanKana) return cleanKana;
                    }

                    // 【真人自然语调模式 (默认推荐)】：
                    // 1. 接尾词/前缀 (如 ～君, ～屋, ～後) -> 自动取假名发音 (如 くん, や, ご)
                    if (item.word && (item.word.startsWith('～') || item.word.startsWith('~'))) {
                        return cleanPronunciation(item.kana);
                    }

                    // 2. 针对单独出现时极易被 TTS 引擎误判声调/音读的多音字，进行精确校正：
                    if (item.word === '方' && item.kana === 'かた') return 'かた';
                    if (item.word === '角' && item.kana === 'かど') return 'かど';
                    if (item.word === '何' && item.kana === 'なに') return 'なに';
                    if (item.word === '何' && item.kana === 'なん') return 'なん';
                    if (item.word === '日' && item.kana === 'ひ') return 'ひ';
                    if (item.word === '日' && item.kana === 'にち') return 'にち';
                    if (item.word === '月' && item.kana === 'つき') return 'つき';
                    if (item.word === '月' && item.kana === 'がつ') return 'がつ';
                    if (item.word === '後' && item.kana === 'あと') return 'あと';
                    if (item.word === '後' && item.kana === 'うしろ') return 'うしろ';

                    // 3. 常规词汇：优先使用日文汉字词形，语音引擎（Siri/京子/Nanami）将依据词性自动发出纯正东京腔高低重音
                    return cleanPronunciation(item.word) || cleanPronunciation(item.kana);
                };

                // 真人原声发音高速缓存池与预加载系统
                const onlineAudioCache = new Map(); // text -> Audio instance

                const getOnlineAudioUrl = (text) => {
                    const encoded = encodeURIComponent(text);
                    // 第一通道：Google 神经网络高品质真人语流（日本直连 <15ms，最正宗的东京音调）
                    return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=${encoded}`;
                };

                const getOnlineFallbackUrl = (text) => {
                    const encoded = encodeURIComponent(text);
                    // 第二备用通道：网易有道高速音频
                    return `https://dict.youdao.com/dictvoice?audio=${encoded}&le=jap`;
                };

                const preloadOnlineAudio = (text) => {
                    if (!text || typeof window === 'undefined') return;
                    text = text.replace(/[~～\-_—]/g, '').trim();
                    if (!text || onlineAudioCache.has(text)) return;

                    try {
                        const audio = new Audio();
                        audio.preload = 'auto';
                        audio.src = getOnlineAudioUrl(text);
                        onlineAudioCache.set(text, audio);
                        if (onlineAudioCache.size > 200) {
                            const first = onlineAudioCache.keys().next().value;
                            onlineAudioCache.delete(first);
                        }
                    } catch (e) {}
                };

                const playOnlineAudio = (text, onFallback) => {
                    try {
                        if (synth && synth.speaking) {
                            synth.cancel();
                        }
                        if (currentAudio) {
                            currentAudio.pause();
                            currentAudio.currentTime = 0;
                        }

                        let audio = onlineAudioCache.get(text);
                        if (!audio) {
                            audio = new Audio();
                            audio.preload = 'auto';
                            audio.src = getOnlineAudioUrl(text);
                            onlineAudioCache.set(text, audio);
                            if (onlineAudioCache.size > 200) {
                                const first = onlineAudioCache.keys().next().value;
                                onlineAudioCache.delete(first);
                            }
                        }

                        currentAudio = audio;
                        audio.playbackRate = Number(speechRate.value) || 1.0;
                        audio.currentTime = 0;

                        let fallbackCalled = false;
                        const triggerFallback = () => {
                            if (!fallbackCalled) {
                                fallbackCalled = true;
                                try {
                                    const fallbackAudio = new Audio(getOnlineFallbackUrl(text));
                                    fallbackAudio.playbackRate = Number(speechRate.value) || 1.0;
                                    currentAudio = fallbackAudio;
                                    fallbackAudio.play().catch(() => {
                                        if (onFallback) onFallback();
                                    });
                                } catch (err) {
                                    if (onFallback) onFallback();
                                }
                            }
                        };

                        // 超时保护：若网络挂起超过 1200ms 仍未开始播放，立即自动切换备用音源
                        const timeoutId = setTimeout(() => {
                            if (audio.paused && audio.currentTime === 0) {
                                triggerFallback();
                            }
                        }, 1200);

                        audio.onplaying = () => {
                            clearTimeout(timeoutId);
                        };

                        audio.onerror = () => {
                            clearTimeout(timeoutId);
                            triggerFallback();
                        };

                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch((err) => {
                                if (err.name !== 'AbortError') {
                                    clearTimeout(timeoutId);
                                    triggerFallback();
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Online audio play failed:', e);
                        if (onFallback) onFallback();
                    }
                };

                let activeUtterance = null;
                const speakTTS = (text) => {
                    if (!synth) return;
                    try {
                        if (currentAudio) {
                            currentAudio.pause();
                            currentAudio.currentTime = 0;
                        }
                        if (synth.paused) {
                            synth.resume();
                        }

                        const utter = new SpeechSynthesisUtterance(text);
                        utter.lang = 'ja-JP';
                        utter.rate = Number(speechRate.value) || 1.0;

                        const selectedVoice = getJapaneseVoice();
                        if (selectedVoice) {
                            utter.voice = selectedVoice;
                        }

                        // Retain reference on global scope to prevent iOS Safari GC premature cleanup bug
                        activeUtterance = utter;
                        window._japaneseActiveUtterance = utter;
                        utter.onend = () => {
                            activeUtterance = null;
                            window._japaneseActiveUtterance = null;
                        };
                        utter.onerror = (err) => {
                            console.warn('SpeechSynthesis error:', err);
                            activeUtterance = null;
                            window._japaneseActiveUtterance = null;
                        };

                        // On iOS Safari, calling cancel() immediately before speak() drops the utterance.
                        // Add tiny delay only if actively speaking.
                        if (synth.speaking) {
                            synth.cancel();
                            setTimeout(() => {
                                synth.speak(utter);
                            }, 25);
                        } else {
                            synth.speak(utter);
                        }
                    } catch (e) {
                        console.error('SpeechSynthesis error:', e);
                    }
                };

                const playWord = (item) => {
                    if (!item) return;
                    const text = getWordAudioText(item);
                    if (!text) return;

                    if (audioEngine.value === 'online') {
                        playOnlineAudio(text, () => {
                            speakTTS(text);
                        });
                    } else {
                        // 本地零延迟 TTS 模式（即点即播，<10ms）
                        const voice = getJapaneseVoice();
                        if (!voice && synth && (availableVoices.value.length === 0 || !availableVoices.value.some(v => /ja|japanese|京子|siri/i.test(v.lang || v.name)))) {
                            playOnlineAudio(text);
                        } else {
                            speakTTS(text);
                        }
                    }
                };

                const playCurrent = () => {
                    if (currentPracticeWord.value) {
                        playWord(currentPracticeWord.value);
                    }
                };

                const testAudio = (sample) => {
                    playWord(sample);
                    showToast('正在播放单词发音...');
                };

                const testSentenceAudio = (sample) => {
                    playSentence(sample);
                    showToast('正在播放句子发音...');
                };

                // Backward-compatibility aliases
                const speakWord = (item) => playWord(item);
                const speakCurrent = () => playCurrent();

                const calculateNextReview = (level) => {
                    const DAY = 24 * 60 * 60 * 1000;
                    let daysToAdd = 0;
                    switch(level) {
                        case 0: daysToAdd = 0; break;
                        case 1: daysToAdd = 1; break;
                        case 2: daysToAdd = 3; break;
                        case 3: daysToAdd = 7; break;
                        case 4: daysToAdd = 14; break;
                        default: daysToAdd = 30; break;
                    }
                    return Date.now() + (daysToAdd * DAY);
                };

                const handleKnown = () => {
                    const current = currentPracticeWord.value;
                    if (!current) return;

                    const index = words.value.findIndex(w => w.id === current.id);
                    if (index !== -1) {
                        const newLevel = (words.value[index].level || 0) + 1;
                        words.value[index].level = newLevel;
                        words.value[index].next_review_date = calculateNextReview(newLevel);
                        saveData();
                    }

                    todayQueue.value.shift();
                    checkQueueStatus();
                };

                const handleUnknown = () => {
                    practiceState.value = 'reveal';
                    const current = currentPracticeWord.value;
                    if (!current) return;

                    const index = words.value.findIndex(w => w.id === current.id);
                    if (index !== -1) {
                        words.value[index].level = 0;
                        saveData();
                    }
                };

                const nextWord = () => {
                    const current = todayQueue.value.shift();
                    if (current) {
                        todayQueue.value.push(current);
                    }
                    practiceState.value = 'listening';
                    playCurrent();
                };

                const checkQueueStatus = () => {
                    if (todayQueue.value.length === 0) {
                        practiceState.value = 'idle';
                        const count = initialQueueLength.value;
                        initialQueueLength.value = 0;
                        if (count > 0) {
                            setTimeout(() => {
                                window.showApiapiaPerfectReward && window.showApiapiaPerfectReward({
                                    moduleName: '日语单词听力',
                                    detail: `今日复习的 ${count} 个单词已全部顺利掌握！`
                                });
                            }, 350);
                        }
                    } else {
                        practiceState.value = 'listening';
                        playCurrent();
                    }
                };

                // Sentence Methods
                const loadSentenceData = () => {
                    let loadedSentences = [];
                    try {
                        const raw = localStorage.getItem(LOCAL_STORAGE_SENTENCES_KEY);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                loadedSentences = parsed;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse sentence data from localStorage', e);
                    }

                    if (loadedSentences.length > 0) {
                        let hasChanges = false;
                        try {
                            if (window.BUILTIN_SENTENCES_ALL && Array.isArray(window.BUILTIN_SENTENCES_ALL)) {
                                const existingMap = new Map();
                                const idMap = new Map();
                                loadedSentences.forEach(s => {
                                    if (s.id) idMap.set(s.id, s);
                                    if (s.japanese) existingMap.set(s.japanese, s);
                                });
                                let newCount = 0;
                                window.BUILTIN_SENTENCES_ALL.forEach(builtinS => {
                                    const exist = (builtinS.id && idMap.get(builtinS.id)) || (builtinS.japanese && existingMap.get(builtinS.japanese));
                                    if (exist) {
                                        // 保持用户的学习历史进度 (level, next_review_date)，仅同步校对属性
                                        if (!exist.id && builtinS.id) {
                                            exist.id = builtinS.id;
                                            hasChanges = true;
                                        }
                                        if (builtinS.words && JSON.stringify(exist.words) !== JSON.stringify(builtinS.words)) {
                                            exist.words = builtinS.words;
                                            hasChanges = true;
                                        }
                                        if (builtinS.kana && exist.kana !== builtinS.kana) {
                                            exist.kana = builtinS.kana;
                                            hasChanges = true;
                                        }
                                        if (builtinS.chinese && exist.chinese !== builtinS.chinese) {
                                            exist.chinese = builtinS.chinese;
                                            hasChanges = true;
                                        }
                                    } else {
                                        loadedSentences.push({
                                            ...builtinS,
                                            level: 0,
                                            next_review_date: Date.now()
                                        });
                                        if (builtinS.id) idMap.set(builtinS.id, builtinS);
                                        if (builtinS.japanese) existingMap.set(builtinS.japanese, builtinS);
                                        newCount++;
                                        hasChanges = true;
                                    }
                                });
                                if (newCount > 0) {
                                    console.log(`Auto-merged ${newCount} new built-in sentences.`);
                                }
                            }
                        } catch (mergeErr) {
                            console.error('Error auto-merging sentences:', mergeErr);
                        }

                        sentences.value = loadedSentences;
                        if (hasChanges) {
                            saveSentenceData();
                        }
                        return;
                    }

                    // Auto-load built-in sentences if localStorage is empty
                    if (window.BUILTIN_SENTENCES_ALL && Array.isArray(window.BUILTIN_SENTENCES_ALL) && window.BUILTIN_SENTENCES_ALL.length > 0) {
                        sentences.value = window.BUILTIN_SENTENCES_ALL.map(s => ({
                            ...s,
                            level: 0,
                            next_review_date: Date.now()
                        }));
                        saveSentenceData();
                    } else {
                        sentences.value = [];
                    }
                };

                const saveSentenceData = () => {
                    try {
                        localStorage.setItem(LOCAL_STORAGE_SENTENCES_KEY, JSON.stringify(sentences.value));
                    } catch (e) {
                        console.error('Failed to save sentences to localStorage', e);
                    }
                    triggerAutoSync();
                };

                const playSentence = (sentenceObj) => {
                    if (!sentenceObj) return;
                    let text = audioTarget.value === 'kana' ? (sentenceObj.kana || sentenceObj.japanese) : sentenceObj.japanese;
                    text = text.replace(/[~～\-_—]/g, '').trim();
                    if (!text) return;

                    if (audioEngine.value === 'online') {
                        playOnlineAudio(text, () => {
                            speakTTS(text);
                        });
                    } else {
                        // 本地零延迟 TTS 模式（即点即播，<10ms）
                        const voice = getJapaneseVoice();
                        if (!voice && synth && (availableVoices.value.length === 0 || !availableVoices.value.some(v => /ja|japanese|京子|siri/i.test(v.lang || v.name)))) {
                            playOnlineAudio(text);
                        } else {
                            speakTTS(text);
                        }
                    }
                };

                const playCurrentSentence = () => {
                    if (currentPracticeSentence.value) {
                        playSentence(currentPracticeSentence.value);
                    }
                };

                const startSentencePractice = (forceAll = false) => {
                    let queue = [];
                    if (forceAll || eligibleDueSentences.value.length === 0) {
                        queue = [...eligibleSentences.value];
                        for (let i = queue.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [queue[i], queue[j]] = [queue[j], queue[i]];
                        }
                        queue = queue.slice(0, 15);
                    } else {
                        queue = [...eligibleDueSentences.value];
                        for (let i = queue.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [queue[i], queue[j]] = [queue[j], queue[i]];
                        }
                    }

                    sentenceQueue.value = queue;
                    initialSentenceQueueLength.value = queue.length;

                    if (queue.length > 0) {
                        sentencePracticeState.value = 'listening';
                        playCurrentSentence();
                    } else {
                        showToast('当前没有匹配的可练习句子');
                    }
                };

                const handleSentenceKnown = () => {
                    const current = currentPracticeSentence.value;
                    if (!current) return;

                    const index = sentences.value.findIndex(s => s.id === current.id);
                    if (index !== -1) {
                        const newLevel = (sentences.value[index].level || 0) + 1;
                        sentences.value[index].level = newLevel;
                        sentences.value[index].next_review_date = calculateNextReview(newLevel);
                        saveSentenceData();
                    }

                    sentenceQueue.value.shift();
                    checkSentenceQueueStatus();
                };

                const handleSentenceUnknown = () => {
                    sentencePracticeState.value = 'reveal';
                    const current = currentPracticeSentence.value;
                    if (!current) return;

                    const index = sentences.value.findIndex(s => s.id === current.id);
                    if (index !== -1) {
                        sentences.value[index].level = 0;
                        saveSentenceData();
                    }
                };

                const nextSentence = () => {
                    const current = sentenceQueue.value.shift();
                    if (current) {
                        sentenceQueue.value.push(current);
                    }
                    sentencePracticeState.value = 'listening';
                    playCurrentSentence();
                };

                const checkSentenceQueueStatus = () => {
                    if (sentenceQueue.value.length === 0) {
                        sentencePracticeState.value = 'idle';
                        const count = initialSentenceQueueLength.value;
                        initialSentenceQueueLength.value = 0;
                        if (count > 0) {
                            setTimeout(() => {
                                window.showApiapiaPerfectReward && window.showApiapiaPerfectReward({
                                    moduleName: '日语句子听力',
                                    detail: `今日复习的 ${count} 个句子已全部顺利掌握！`
                                });
                            }, 350);
                        } else {
                            showToast('🎉 太棒了！本轮句子听力练习完成！');
                        }
                    } else {
                        sentencePracticeState.value = 'listening';
                        playCurrentSentence();
                    }
                };

                // 智能后台预加载：在练习与翻页时预先加载音频至内存，彻底消除等待与网络延迟
                watch(currentPracticeWord, (word) => {
                    if (word && audioEngine.value === 'online') {
                        const txt = getWordAudioText(word);
                        if (txt) preloadOnlineAudio(txt);
                        if (todayQueue.value && todayQueue.value.length > 1) {
                            todayQueue.value.slice(1, 3).forEach(w => {
                                const nextTxt = getWordAudioText(w);
                                if (nextTxt) preloadOnlineAudio(nextTxt);
                            });
                        }
                    }
                }, { immediate: true });

                watch(currentPracticeSentence, (sentence) => {
                    if (sentence && audioEngine.value === 'online') {
                        const txt = audioTarget.value === 'kana' ? (sentence.kana || sentence.japanese) : sentence.japanese;
                        if (txt) preloadOnlineAudio(txt);
                        if (sentenceQueue.value && sentenceQueue.value.length > 1) {
                            sentenceQueue.value.slice(1, 3).forEach(s => {
                                const nextTxt = audioTarget.value === 'kana' ? (s.kana || s.japanese) : s.japanese;
                                if (nextTxt) preloadOnlineAudio(nextTxt);
                            });
                        }
                    }
                }, { immediate: true });

                watch(paginatedWords, (items) => {
                    if (items && items.length > 0 && audioEngine.value === 'online') {
                        setTimeout(() => {
                            items.slice(0, 10).forEach(w => {
                                const txt = getWordAudioText(w);
                                if (txt) preloadOnlineAudio(txt);
                            });
                        }, 250);
                    }
                }, { immediate: true });

                // ==================== 假名听写与辨析模块 (参考 @hanzi 流程) ====================
                const LOCAL_STORAGE_KANA_WRONG = 'japanese_study_wrong_kana_v1';
                const kanaData = ref(window.KANA_DATA || []);
                const kanaCurrentSubTab = ref('setup'); // 'setup' | 'wrong' | 'chart'
                const kanaTypeMode = ref('mixed'); // 'hiragana' | 'katakana' | 'mixed' | 'conversion'
                const kanaRangeScope = ref('seion'); // 'seion' | 'dakuon' | 'youon' | 'all' | 'custom'
                const kanaSelectedRows = ref(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa']);
                const kanaQuestionCount = ref(10); // 10, 20, 0 (全部)
                const kanaPracticeState = ref('idle'); // 'idle' | 'writing' | 'checking' | 'summary'
                const kanaSession = ref([]);
                const kanaCurrentIndex = ref(0);
                const kanaAnswers = ref([]);
                const kanaWrongList = ref([]);
                const chartGroupTab = ref('seion'); // 'seion' | 'dakuon' | 'youon'

                // Canvas & Drawing refs
                const kanaCanvasRef = ref(null);
                const kanaStrokes = ref([]);
                let kanaActiveStroke = null;
                const kanaCapturedWriting = ref('');
                const showKanaResultDetailModal = ref(false);
                const selectedKanaResultDetail = ref(null);

                const kanaRowOptions = [
                    { id: 'a', name: 'あ行 (a, i, u, e, o)' },
                    { id: 'ka', name: 'か行 (ka, ki, ku, ke, ko)' },
                    { id: 'sa', name: 'さ行 (sa, shi, su, se, so)' },
                    { id: 'ta', name: 'た行 (ta, chi, tsu, te, to)' },
                    { id: 'na', name: 'な行 (na, ni, nu, ne, no)' },
                    { id: 'ha', name: 'は行 (ha, hi, fu, he, ho)' },
                    { id: 'ma', name: 'ま行 (ma, mi, mu, me, mo)' },
                    { id: 'ya', name: 'や行 (ya, yu, yo)' },
                    { id: 'ra', name: 'ら行 (ra, ri, ru, re, ro)' },
                    { id: 'wa', name: 'わ行 (wa, wo, n)' }
                ];

                const toggleKanaRow = (rowId) => {
                    const idx = kanaSelectedRows.value.indexOf(rowId);
                    if (idx >= 0) {
                        if (kanaSelectedRows.value.length <= 1) {
                            showToast('至少保留一行假名');
                            return;
                        }
                        kanaSelectedRows.value.splice(idx, 1);
                    } else {
                        kanaSelectedRows.value.push(rowId);
                    }
                };

                const loadKanaWrongList = () => {
                    try {
                        const raw = localStorage.getItem(LOCAL_STORAGE_KANA_WRONG);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed)) {
                                kanaWrongList.value = parsed;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to load kana wrong list', e);
                    }
                };

                const saveKanaWrongList = () => {
                    try {
                        localStorage.setItem(LOCAL_STORAGE_KANA_WRONG, JSON.stringify(kanaWrongList.value));
                    } catch (e) {
                        console.error('Failed to save kana wrong list', e);
                    }
                };

                const currentKanaItem = computed(() => {
                    return kanaSession.value[kanaCurrentIndex.value] || null;
                });

                const currentKanaExpectedChar = computed(() => {
                    const it = currentKanaItem.value;
                    if (!it) return '';
                    return it.expectedChar || (it.targetType === 'katakana' ? it.katakana : it.hiragana);
                });

                const currentKanaPairedChar = computed(() => {
                    const it = currentKanaItem.value;
                    if (!it) return '';
                    return it.pairedChar || (it.targetType === 'katakana' ? it.hiragana : it.katakana);
                });

                const kanaTypeModeLabel = computed(() => {
                    switch (kanaTypeMode.value) {
                        case 'hiragana': return '平假名';
                        case 'katakana': return '片假名';
                        case 'mixed': return '平片混合';
                        case 'conversion': return '平片互换';
                        default: return '假名听写';
                    }
                });

                const currentKanaQuestionNumber = computed(() => {
                    if (!kanaSession.value || kanaSession.value.length === 0) return 0;
                    return kanaCurrentIndex.value + 1;
                });

                const totalKanaQuestions = computed(() => {
                    return kanaSession.value ? kanaSession.value.length : 0;
                });

                const kanaRemainingCount = computed(() => {
                    if (!kanaSession.value || kanaSession.value.length === 0) return 0;
                    return Math.max(0, kanaSession.value.length - (kanaCurrentIndex.value + 1));
                });

                const kanaProgressPercent = computed(() => {
                    if (!kanaSession.value || kanaSession.value.length === 0) return 0;
                    return Math.min(100, Math.round(((kanaCurrentIndex.value + 1) / kanaSession.value.length) * 100));
                });

                const kanaAccuracyRate = computed(() => {
                    if (kanaAnswers.value.length === 0) return 0;
                    const correct = kanaAnswers.value.filter(a => a.isCorrect).length;
                    return Math.round((correct / kanaAnswers.value.length) * 100);
                });

                const kanaWrongCountInSession = computed(() => {
                    return kanaAnswers.value.filter(a => !a.isCorrect).length;
                });

                const kanaSummaryMessage = computed(() => {
                    const rate = kanaAccuracyRate.value;
                    if (rate === 100) return '🎊 太棒了！全对通关，平假名与片假名辨析极为清晰准确！';
                    if (rate >= 80) return '🎉 表现出色！假名书写很标准，稍加巩固即可全面掌握！';
                    if (rate >= 60) return '💪 顺利过关！错题已追加至末尾重练，建议复习错题本强化。';
                    return '🌱 还在打基础阶段，多看五十音图速查表，继续加油！';
                });

                const chartKanaList = computed(() => {
                    const all = (kanaData.value && kanaData.value.length > 0) ? kanaData.value : (window.KANA_DATA || []);
                    if (chartGroupTab.value === 'seion') {
                        const seion = all.filter(k => k.group === 'seion');
                        const findK = (id) => seion.find(k => k.id === id);
                        return [
                            // あ行 (a, i, u, e, o)
                            findK('k_a'), findK('k_i'), findK('k_u'), findK('k_e'), findK('k_o'),
                            // か行
                            findK('k_ka'), findK('k_ki'), findK('k_ku'), findK('k_ke'), findK('k_ko'),
                            // さ行
                            findK('k_sa'), findK('k_shi'), findK('k_su'), findK('k_se'), findK('k_so'),
                            // た行
                            findK('k_ta'), findK('k_chi'), findK('k_tsu'), findK('k_te'), findK('k_to'),
                            // な行
                            findK('k_na'), findK('k_ni'), findK('k_nu'), findK('k_ne'), findK('k_no'),
                            // は行
                            findK('k_ha'), findK('k_hi'), findK('k_fu'), findK('k_he'), findK('k_ho'),
                            // ま行
                            findK('k_ma'), findK('k_mi'), findK('k_mu'), findK('k_me'), findK('k_mo'),
                            // や行 (ya, 空, yu, 空, yo)
                            findK('k_ya'), { isEmpty: true, id: 'e_yi' }, findK('k_yu'), { isEmpty: true, id: 'e_ye' }, findK('k_yo'),
                            // ら行
                            findK('k_ra'), findK('k_ri'), findK('k_ru'), findK('k_re'), findK('k_ro'),
                            // わ行 (wa, 空, 空, 空, wo)
                            findK('k_wa'), { isEmpty: true, id: 'e_wi' }, { isEmpty: true, id: 'e_wu' }, { isEmpty: true, id: 'e_we' }, findK('k_wo'),
                            // 拨音 (n, 空, 空, 空, 空)
                            findK('k_n'), { isEmpty: true, id: 'e_n2' }, { isEmpty: true, id: 'e_n3' }, { isEmpty: true, id: 'e_n4' }, { isEmpty: true, id: 'e_n5' }
                        ].filter(Boolean);
                    } else if (chartGroupTab.value === 'dakuon') {
                        const dakuon = all.filter(k => k.group === 'dakuon');
                        const findD = (id) => dakuon.find(k => k.id === id);
                        return [
                            // が行
                            findD('k_ga'), findD('k_gi'), findD('k_gu'), findD('k_ge'), findD('k_go'),
                            // ざ行
                            findD('k_za'), findD('k_ji_z'), findD('k_zu_z'), findD('k_ze'), findD('k_zo'),
                            // だ行
                            findD('k_da'), findD('k_ji_d'), findD('k_zu_d'), findD('k_de'), findD('k_do'),
                            // ば行
                            findD('k_ba'), findD('k_bi'), findD('k_bu'), findD('k_be'), findD('k_bo'),
                            // ぱ行
                            findD('k_pa'), findD('k_pi'), findD('k_pu'), findD('k_pe'), findD('k_po')
                        ].filter(Boolean);
                    } else {
                        // 常用拗音 (33字)
                        return all.filter(k => k.group === 'youon');
                    }
                });

                const playKanaAudio = (text) => {
                    if (!text) return;
                    if (audioEngine.value === 'online') {
                        playOnlineAudio(text, () => {
                            speakTTS(text);
                        });
                    } else {
                        const voice = getJapaneseVoice();
                        if (!voice && synth && (availableVoices.value.length === 0 || !availableVoices.value.some(v => /ja|japanese|京子|siri/i.test(v.lang || v.name)))) {
                            playOnlineAudio(text);
                        } else {
                            speakTTS(text);
                        }
                    }
                };

                const playCurrentKana = () => {
                    const item = currentKanaItem.value;
                    if (!item) return;
                    playKanaAudio(item.hiragana);
                };

                // 画板 Canvas 手写相关实现 (参考 @hanzi 田字格)
                const redrawKanaCanvas = () => {
                    const canvas = kanaCanvasRef.value;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    ctx.clearRect(0, 0, rect.width, rect.height);
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    kanaStrokes.value.forEach(stroke => {
                        if (!stroke || stroke.length === 0) return;
                        ctx.beginPath();
                        ctx.moveTo(stroke[0].x, stroke[0].y);
                        stroke.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
                        if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
                        ctx.lineWidth = stroke[0].width || 8;
                        ctx.stroke();
                    });
                };

                const initKanaCanvas = () => {
                    const canvas = kanaCanvasRef.value;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    if (!rect.width || !rect.height) return;

                    const ratio = Math.min(window.devicePixelRatio || 1, 3);
                    canvas.width = Math.round(rect.width * ratio);
                    canvas.height = Math.round(rect.height * ratio);
                    const ctx = canvas.getContext('2d');
                    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
                    redrawKanaCanvas();
                };

                const getCanvasPoint = (event) => {
                    const canvas = kanaCanvasRef.value;
                    const rect = canvas.getBoundingClientRect();
                    const pressure = event.pressure > 0 ? event.pressure : 0.5;
                    return {
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                        width: 6 + pressure * 6
                    };
                };

                const beginKanaStroke = (event) => {
                    if (kanaPracticeState.value !== 'writing') return;
                    event.preventDefault();
                    const canvas = kanaCanvasRef.value;
                    if (!canvas) return;
                    if (event.setPointerCapture && event.pointerId) {
                        try { canvas.setPointerCapture(event.pointerId); } catch(e){}
                    }
                    const pt = getCanvasPoint(event);
                    kanaActiveStroke = [pt];
                    kanaStrokes.value.push(kanaActiveStroke);
                    redrawKanaCanvas();
                };

                const continueKanaStroke = (event) => {
                    if (!kanaActiveStroke) return;
                    event.preventDefault();
                    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
                    events.forEach(pe => kanaActiveStroke.push(getCanvasPoint(pe)));
                    redrawKanaCanvas();
                };

                const endKanaStroke = (event) => {
                    if (!kanaActiveStroke) return;
                    event.preventDefault();
                    kanaActiveStroke = null;
                };

                const undoKanaStroke = () => {
                    if (kanaPracticeState.value !== 'writing') return;
                    kanaStrokes.value.pop();
                    redrawKanaCanvas();
                };

                const clearKanaWriting = () => {
                    kanaStrokes.value = [];
                    kanaActiveStroke = null;
                    kanaCapturedWriting.value = '';
                    redrawKanaCanvas();
                };

                const captureKanaWriting = () => {
                    const canvas = kanaCanvasRef.value;
                    if (!canvas || kanaStrokes.value.length === 0) {
                        kanaCapturedWriting.value = '';
                        return '';
                    }
                    kanaCapturedWriting.value = canvas.toDataURL('image/png');
                    return kanaCapturedWriting.value;
                };

                const startKanaPractice = (customItems = null, forcedMode = null) => {
                    let pool = [];
                    if (customItems && customItems.length > 0) {
                        pool = [...customItems];
                    } else {
                        const all = (kanaData.value && kanaData.value.length > 0) ? kanaData.value : (window.KANA_DATA || []);
                        if (kanaRangeScope.value === 'all') {
                            pool = [...all];
                        } else if (kanaRangeScope.value === 'custom') {
                            pool = all.filter(k => kanaSelectedRows.value.includes(k.row));
                        } else {
                            pool = all.filter(k => k.group === kanaRangeScope.value);
                        }
                    }

                    if (pool.length === 0) {
                        showToast('所选范围内没有假名，请重新选择');
                        return;
                    }

                    const shuffled = [...pool].sort(() => Math.random() - 0.5);
                    const count = (customItems || kanaQuestionCount.value === 0) ? shuffled.length : Math.min(kanaQuestionCount.value, shuffled.length);
                    const selected = shuffled.slice(0, count);

                    const mode = forcedMode || kanaTypeMode.value;
                    const sessionItems = selected.map(k => {
                        let tType = mode;
                        let convDir = null;
                        if (mode === 'mixed') {
                            tType = Math.random() > 0.5 ? 'hiragana' : 'katakana';
                        } else if (mode === 'conversion') {
                            tType = 'conversion';
                            convDir = Math.random() > 0.5 ? 'hira_to_kata' : 'kata_to_hira';
                        }
                        
                        const expected = (tType === 'katakana' || convDir === 'hira_to_kata') ? k.katakana : k.hiragana;
                        const paired = (tType === 'katakana' || convDir === 'hira_to_kata') ? k.hiragana : k.katakana;

                        return {
                            ...k,
                            targetType: tType,
                            conversionDirection: convDir,
                            expectedChar: expected,
                            pairedChar: paired
                        };
                    });

                    kanaSession.value = sessionItems;
                    kanaCurrentIndex.value = 0;
                    kanaAnswers.value = [];
                    kanaPracticeState.value = 'writing';
                    clearKanaWriting();

                    // 用户点击“开始听写”时第一时间直接播放第一题读音（在用户点击事件手势内同步触发）
                    if (sessionItems.length > 0) {
                        playKanaAudio(sessionItems[0].hiragana);
                    }

                    nextTick(() => {
                        initKanaCanvas();
                    });
                };

                const submitKanaWriting = () => {
                    captureKanaWriting();
                    kanaPracticeState.value = 'checking';
                    // 写好了核对时不再自动发音，避免打扰视觉核对；若需要重听可点击核对卡片中的“🔊 重听发音”
                };

                const recordKanaAnswer = (isCorrect) => {
                    const item = currentKanaItem.value;
                    if (!item) return;

                    const record = {
                        item: { ...item },
                        expectedChar: currentKanaExpectedChar.value,
                        pairedChar: currentKanaPairedChar.value,
                        targetType: item.targetType,
                        conversionDirection: item.conversionDirection,
                        romaji: item.romaji,
                        rowName: item.rowName,
                        groupName: item.groupName,
                        example: item.example,
                        exampleKata: item.exampleKata,
                        strokesHira: item.strokesHira,
                        strokesKata: item.strokesKata,
                        writingUrl: kanaCapturedWriting.value,
                        isCorrect: isCorrect,
                        timestamp: Date.now()
                    };

                    kanaAnswers.value.push(record);

                    if (!isCorrect) {
                        // 参考 @hanzi 机制：答错的题目自动追加到本轮队列末尾重练，加深记忆！
                        kanaSession.value.push({ ...item });

                        // 记入错题本
                        const wrongKey = `${item.id}__${item.targetType}`;
                        const existIndex = kanaWrongList.value.findIndex(w => w.key === wrongKey);
                        if (existIndex >= 0) {
                            kanaWrongList.value[existIndex].errorCount += 1;
                            kanaWrongList.value[existIndex].lastFailedAt = Date.now();
                        } else {
                            kanaWrongList.value.unshift({
                                key: wrongKey,
                                kanaId: item.id,
                                targetType: item.targetType,
                                conversionDirection: item.conversionDirection,
                                expectedChar: currentKanaExpectedChar.value,
                                pairedChar: currentKanaPairedChar.value,
                                romaji: item.romaji,
                                rowName: item.rowName,
                                groupName: item.groupName,
                                example: item.example,
                                exampleKata: item.exampleKata,
                                strokesHira: item.strokesHira,
                                strokesKata: item.strokesKata,
                                hiragana: item.hiragana,
                                katakana: item.katakana,
                                errorCount: 1,
                                lastFailedAt: Date.now()
                            });
                        }
                        saveKanaWrongList();
                    } else {
                        // 回答正确，扣减错题本中的错误计数
                        const wrongKey = `${item.id}__${item.targetType}`;
                        const existIndex = kanaWrongList.value.findIndex(w => w.key === wrongKey);
                        if (existIndex >= 0) {
                            kanaWrongList.value[existIndex].errorCount -= 1;
                            if (kanaWrongList.value[existIndex].errorCount <= 0) {
                                kanaWrongList.value.splice(existIndex, 1);
                            }
                            saveKanaWrongList();
                        }
                    }

                    if (kanaCurrentIndex.value < kanaSession.value.length - 1) {
                        kanaCurrentIndex.value += 1;
                        kanaPracticeState.value = 'writing';
                        clearKanaWriting();
                        const nextItem = kanaSession.value[kanaCurrentIndex.value];
                        if (nextItem) {
                            playKanaAudio(nextItem.hiragana);
                        }
                        nextTick(() => {
                            initKanaCanvas();
                        });
                    } else {
                        kanaPracticeState.value = 'summary';
                        if (kanaAccuracyRate.value === 100 && kanaAnswers.value.length > 0) {
                            setTimeout(() => {
                                window.showApiapiaPerfectReward && window.showApiapiaPerfectReward({
                                    moduleName: '五十音假名听写',
                                    detail: `本轮假名听写全部正确，正确率 100%！`
                                });
                            }, 350);
                        }
                    }
                };

                const retryWrongInSession = () => {
                    const wrongAnswers = kanaAnswers.value.filter(a => !a.isCorrect);
                    if (wrongAnswers.length === 0) return;
                    const items = wrongAnswers.map(a => a.item);
                    startKanaPractice(items);
                };

                const practiceFromWrongBook = () => {
                    if (kanaWrongList.value.length === 0) {
                        showToast('错题本暂时没有错字，先去练习吧！');
                        return;
                    }
                    const items = kanaWrongList.value.map(w => ({
                        id: w.kanaId,
                        hiragana: w.hiragana,
                        katakana: w.katakana,
                        romaji: w.romaji,
                        groupName: w.groupName,
                        rowName: w.rowName,
                        example: w.example,
                        exampleKata: w.exampleKata,
                        strokesHira: w.strokesHira,
                        strokesKata: w.strokesKata,
                        targetType: w.targetType,
                        conversionDirection: w.conversionDirection,
                        expectedChar: w.expectedChar,
                        pairedChar: w.pairedChar
                    }));
                    startKanaPractice(items);
                };

                const removeFromWrongBook = (itemKey) => {
                    kanaWrongList.value = kanaWrongList.value.filter(w => w.key !== itemKey);
                    saveKanaWrongList();
                    showToast('已从错题本移出');
                };

                const clearWrongBook = async () => {
                    if (window.kidConfirm) {
                        const ok = await window.kidConfirm({
                            title: '清空错题本？',
                            message: '确定要清空假名错题记录吗？',
                            icon: '🗑️',
                            type: 'danger',
                            confirmText: '确定清空',
                            cancelText: '取消'
                        });
                        if (ok) {
                            kanaWrongList.value = [];
                            saveKanaWrongList();
                            showToast('已清空错题本', 'success');
                        }
                    } else if (confirm('确定要清空假名错题本吗？')) {
                        kanaWrongList.value = [];
                        saveKanaWrongList();
                        showToast('已清空错题本');
                    }
                };

                const quitKanaPractice = async () => {
                    if (kanaPracticeState.value === 'writing') {
                        if (window.kidConfirmExitPractice) {
                            const ok = await window.kidConfirmExitPractice({
                                title: '退出假名听写？',
                                message: '确定要退出本轮假名听写吗？未完成的练习进度将离开哦～',
                                confirmText: '确定退出',
                                cancelText: '继续练习'
                            });
                            if (!ok) return;
                        }
                    }
                    kanaPracticeState.value = 'idle';
                    kanaSession.value = [];
                    kanaAnswers.value = [];
                    clearKanaWriting();
                };

                // 练习中退出二次确认 handlers
                const confirmReturnHome = async (e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    const isPracticing = practiceState.value !== 'idle' ||
                                         sentencePracticeState.value !== 'idle' ||
                                         kanaPracticeState.value === 'writing';
                    if (isPracticing) {
                        if (window.kidConfirmExitPractice) {
                            const ok = await window.kidConfirmExitPractice({
                                title: '返回学习中心？',
                                message: '当前正在练习中，确定要退出练习并返回首页吗？',
                                confirmText: '确定退出',
                                cancelText: '继续练习'
                            });
                            if (ok) {
                                window.location.href = '../../index.html';
                            }
                        } else {
                            window.location.href = '../../index.html';
                        }
                    } else {
                        window.location.href = '../../index.html';
                    }
                };

                const confirmExitWordPractice = async () => {
                    if (window.kidConfirmExitPractice) {
                        const ok = await window.kidConfirmExitPractice({
                            title: '结束单词练习？',
                            message: '确定要结束本轮单词听力练习吗？',
                            confirmText: '确定结束',
                            cancelText: '继续练习'
                        });
                        if (ok) {
                            practiceState.value = 'idle';
                        }
                    } else {
                        practiceState.value = 'idle';
                    }
                };

                const confirmExitSentencePractice = async () => {
                    if (window.kidConfirmExitPractice) {
                        const ok = await window.kidConfirmExitPractice({
                            title: '结束句子练习？',
                            message: '确定要结束本轮句子精听练习吗？',
                            confirmText: '确定结束',
                            cancelText: '继续练习'
                        });
                        if (ok) {
                            sentencePracticeState.value = 'idle';
                        }
                    } else {
                        sentencePracticeState.value = 'idle';
                    }
                };

                return {
                    currentTab,
                    words,
                    toastMessage,
                    showAddForm,
                    form,
                    editingId,
                    searchQuery,
                    pageSize,
                    currentPage,
                    totalPages,
                    filteredWords,
                    paginatedWords,
                    todayDueCount,
                    masteredCount,
                    practiceState,
                    todayQueue,
                    initialQueueLength,
                    currentPracticeWord,

                    // Kana Practice Module (参考 @hanzi 流程)
                    kanaData,
                    kanaCurrentSubTab,
                    kanaTypeMode,
                    kanaTypeModeLabel,
                    kanaRangeScope,
                    kanaSelectedRows,
                    kanaRowOptions,
                    toggleKanaRow,
                    kanaQuestionCount,
                    kanaPracticeState,
                    kanaSession,
                    kanaCurrentIndex,
                    currentKanaQuestionNumber,
                    totalKanaQuestions,
                    kanaRemainingCount,
                    kanaProgressPercent,
                    kanaAnswers,
                    kanaWrongList,
                    currentKanaItem,
                    currentKanaExpectedChar,
                    currentKanaPairedChar,
                    kanaAccuracyRate,
                    kanaWrongCountInSession,
                    kanaSummaryMessage,
                    chartGroupTab,
                    chartKanaList,
                    kanaCanvasRef,
                    kanaStrokes,
                    kanaCapturedWriting,
                    showKanaResultDetailModal,
                    selectedKanaResultDetail,
                    playKanaAudio,
                    playCurrentKana,
                    initKanaCanvas,
                    redrawKanaCanvas,
                    beginKanaStroke,
                    continueKanaStroke,
                    endKanaStroke,
                    undoKanaStroke,
                    clearKanaWriting,
                    startKanaPractice,
                    submitKanaWriting,
                    recordKanaAnswer,
                    retryWrongInSession,
                    practiceFromWrongBook,
                    removeFromWrongBook,
                    clearWrongBook,
                    quitKanaPractice,
                    confirmReturnHome,
                    confirmExitWordPractice,
                    confirmExitSentencePractice,

                    // Cloudflare Cloud Sync
                    showSyncModal,
                    syncKey,
                    autoSync,
                    syncStatus,
                    syncStatusText,
                    lastSyncTime,
                    saveSyncConfig,
                    pushToCloud,
                    pullFromCloud,
                    
                    // Audio & Voice Engine
                    isIOS,
                    showAudioSettings,
                    audioEngine,
                    audioTarget,
                    speechRate,
                    jaVoiceName,
                    availableVoices,
                    saveAudioConfig,
                    playWord,
                    playCurrent,
                    testAudio,
                    testSentenceAudio,
                    speakWord,
                    speakCurrent,

                    // Sentence Practice
                    sentences,
                    sentenceScope,
                    sentencePracticeState,
                    sentenceQueue,
                    initialSentenceQueueLength,
                    currentPracticeSentence,
                    eligibleSentences,
                    eligibleDueSentences,
                    sentenceDueCount,
                    sentenceMasteredCount,
                    learnedWordsCount,
                    isWordLearned,
                    startSentencePractice,
                    playSentence,
                    playCurrentSentence,
                    handleSentenceKnown,
                    handleSentenceUnknown,
                    nextSentence,

                    // Sentence Browser in Management
                    manageSubTab,
                    sentenceSearchQuery,
                    sentenceCurrentPage,
                    sentencePageSize,
                    filteredSentencesList,
                    sentenceTotalPages,
                    paginatedSentences,

                    saveWord,
                    editWord,
                    cancelEdit,
                    deleteWord,
                    promptEditMeaning,
                    formatDate,
                    importBuiltin,
                    resetSentences,
                    handleFileUpload,
                    exportData,
                    clearAllWords,
                    
                    startPractice,
                    handleKnown,
                    handleUnknown,
                    nextWord,

                    // 单词造句与例句播放
                    currentWordSentence,
                    currentWordSentenceList,
                    currentWordSentenceIndex,
                    nextWordSentence,
                    playCurrentWordSentence
                };
            }
        });
        if (typeof vant !== 'undefined') {
            app.use(vant);
        }
        app.mount('#app');
