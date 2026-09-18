const { createApp, ref, computed, onMounted, watch } = Vue;

        const LOCAL_STORAGE_KEY = 'ja_vocab_list';

        const app = createApp({
            setup() {
                // Main State
                const currentTab = ref('practice');
                const words = ref([]);
                const toastMessage = ref('');
                let toastTimer = null;

                const showToast = (msg) => {
                    if (typeof vant !== 'undefined' && vant.showToast) {
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
                        if (!silent) alert('请先输入专属同步密钥 (Sync Key)！');
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
                            if (!silent) showToast('☁️ 已成功将本地学习进度推送到云端备份！');
                        } else {
                            syncStatus.value = 'error';
                            syncStatusText.value = json.message || '同步失败';
                            if (!silent) alert('推送云端失败：' + (json.message || json.error));
                        }
                    } catch (err) {
                        syncStatus.value = 'error';
                        syncStatusText.value = '网络或接口异常';
                        if (!silent) alert('推送失败，请检查网络连接或 Cloudflare 部署状态：' + err.message);
                    }
                };

                const pullFromCloud = async (silent = false) => {
                    const key = syncKey.value.trim();
                    if (!key) {
                        if (!silent) alert('请先输入专属同步密钥 (Sync Key)！');
                        return;
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
                                showToast(`☁️ 已同步最新数据（${words.value.length} 词，${sentences.value.length} 句）`);
                            }
                        } else if (json.success && !json.data) {
                            syncStatus.value = 'idle';
                            syncStatusText.value = '云端暂无数据';
                            if (!silent) alert('该密钥在云端尚未有数据备份，请先在已有数据的设备上点击【推送到云端备份】。');
                        } else {
                            syncStatus.value = 'error';
                            syncStatusText.value = json.message || '拉取失败';
                            if (!silent) alert('拉取失败：' + (json.message || json.error));
                        }
                    } catch (err) {
                        syncStatus.value = 'error';
                        syncStatusText.value = '网络异常';
                        if (!silent) alert('拉取失败，请检查网络或服务配置：' + err.message);
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
                const importBuiltin = () => {
                    const toImport = window.BUILTIN_VOCAB || window.BUILTIN_VOCAB_ALL || [];
                    if (toImport.length === 0) {
                        showToast('未找到内置词库数据文件');
                        return;
                    }

                    if (words.value.length > 0) {
                        const confirmAppend = confirm(`当前已有 ${words.value.length} 个词汇。\n点击【确定】进行合并追加（去重），点击【取消】放弃。`);
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
                                        alert('未能从 JSON 数组中识别出有效词汇。');
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
                                    showToast(`文件解析成功，已导入 ${added} 个新词汇！`);
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
                                alert('未能从文件中识别出有效词汇。请确保文件格式为「单词(假名)」或 JSON。');
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
                            showToast(`文件解析成功，已导入 ${added} 个新词汇！`);
                        } catch (err) {
                            console.error(err);
                            alert('解析文件失败：' + err.message);
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

                const resetSentences = () => {
                    const doReset = () => {
                        if (window.BUILTIN_SENTENCES_ALL && Array.isArray(window.BUILTIN_SENTENCES_ALL)) {
                            sentences.value = window.BUILTIN_SENTENCES_ALL.map(s => ({
                                ...s,
                                level: 0,
                                next_review_date: Date.now()
                            }));
                            saveSentenceData();
                            showToast(`已重置并载入全部 ${sentences.value.length} 个内置句子！`);
                        }
                    };
                    if (typeof vant !== 'undefined' && vant.showConfirmDialog) {
                        vant.showConfirmDialog({
                            title: '重置句子库',
                            message: '确定要重置全部内置句子并将其复习等级恢复为初始状态吗？',
                            confirmButtonColor: '#4f46e5'
                        }).then(doReset).catch(() => {});
                    } else if (confirm('确定要重置全部内置句子吗？')) {
                        doReset();
                    }
                };

                // Clear All
                const clearAllWords = () => {
                    const doClear = () => {
                        words.value = [];
                        saveData();
                        showToast('已清空词库');
                    };
                    if (typeof vant !== 'undefined' && vant.showConfirmDialog) {
                        vant.showConfirmDialog({
                            title: '清空确认',
                            message: `确定要清空全部 ${words.value.length} 个词汇吗？此操作不可恢复。`,
                            confirmButtonColor: '#e11d48'
                        }).then(doClear).catch(() => {});
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

                const deleteWord = (id) => {
                    const doDelete = () => {
                        words.value = words.value.filter(w => w.id !== id);
                        saveData();
                        showToast('词汇已删除');
                    };
                    if (typeof vant !== 'undefined' && vant.showConfirmDialog) {
                        vant.showConfirmDialog({
                            title: '删除确认',
                            message: '确定要删除该词汇吗？',
                            confirmButtonColor: '#e11d48'
                        }).then(doDelete).catch(() => {});
                    } else if (confirm('确定要删除该词汇吗？')) {
                        doDelete();
                    }
                };

                const promptEditMeaning = (word) => {
                    const newMeaning = prompt(`请为「${word.word} (${word.kana})」输入中文释义：`, word.meaning || '');
                    if (newMeaning !== null) {
                        word.meaning = newMeaning.trim();
                        const idx = words.value.findIndex(w => w.id === word.id);
                        if (idx !== -1) {
                            words.value[idx].meaning = word.meaning;
                            saveData();
                            showToast('释义已更新！');
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
                        showToast('🎉 太棒了！本轮句子听力练习完成！');
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
                    nextWord
                };
            }
        });
        if (typeof vant !== 'undefined') {
            app.use(vant);
        }
        app.mount('#app');
