/**
 * 英语小能手 · 核心交互逻辑 (Vue 3 驱动)
 * 融合：零基础托业语境短文精读 + 100 核心生活动词 3D 翻牌闪卡
 */

(function () {
    const { createApp, ref, computed, onMounted, nextTick, watch } = Vue;

    // =========================================================================
    // 1. 语音辅助判断（区分单词与句子，精准匹配真人音源通道）
    // =========================================================================
    const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

    const isSentenceText = (text) => {
        const clean = (text || '').trim();
        return /\s/.test(clean) && (clean.split(/\s+/).length > 2 || clean.length > 25 || /[.?!;,]/.test(clean));
    };

    // =========================================================================
    // 2. 自包含轻量 Canvas 彩带粒子动画（无需外部 CDN）
    // =========================================================================
    function triggerConfetti(originY = 0.6) {
        try {
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            const width = (canvas.width = window.innerWidth);
            const height = (canvas.height = window.innerHeight);

            const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#38bdf8', '#fb7185', '#a855f7'];
            const particles = [];
            const count = 45;

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: width * 0.5 + (Math.random() - 0.5) * 120,
                    y: height * originY,
                    vx: (Math.random() - 0.5) * 14,
                    vy: -Math.random() * 12 - 3,
                    size: Math.random() * 7 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * 360,
                    rotSpeed: (Math.random() - 0.5) * 10,
                    opacity: 1
                });
            }

            let animId = null;
            const startTime = Date.now();

            function render() {
                const elapsed = Date.now() - startTime;
                ctx.clearRect(0, 0, width, height);

                let activeCount = 0;
                particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.35;
                    p.vx *= 0.985;
                    p.rotation += p.rotSpeed;

                    if (elapsed > 1200) {
                        p.opacity = Math.max(0, p.opacity - 0.035);
                    }

                    if (p.opacity > 0 && p.y < height + 40) {
                        activeCount++;
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate((p.rotation * Math.PI) / 180);
                        ctx.globalAlpha = p.opacity;
                        ctx.fillStyle = p.color;
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                        ctx.restore();
                    }
                });

                if (activeCount > 0 && elapsed < 2800) {
                    animId = requestAnimationFrame(render);
                } else {
                    if (animId) cancelAnimationFrame(animId);
                    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                }
            }

            animId = requestAnimationFrame(render);
        } catch (e) {
            // 静默优雅降级
        }
    }

    // =========================================================================
    // 3. Vue 3 核心应用
    // =========================================================================
    const app = createApp({
        setup() {
            // ------------ 导航与模式 ------------
            // currentTab: 'toeic' (托业短文) | 'verbs' (核心动词) | 'list' (词库列表) | 'stats' (进度看板)
            const currentTab = ref('toeic');

            // ------------ 托业短文状态 ------------
            const articles = ref(typeof TOEIC_ARTICLES !== 'undefined' ? TOEIC_ARTICLES : []);
            const wordDict = typeof TOEIC_WORD_DICT !== 'undefined' ? TOEIC_WORD_DICT : {};
            const currentArticleId = ref(1);
            const toeicSubTab = ref('reading'); // 'reading' | 'words' | 'grammar'
            const showChinese = ref(true); // 全篇译文开关

            // ------------ 设备检测与发音引擎配置（参考 @japanese 架构） ------------
            const isIOS = typeof navigator !== 'undefined' && (
                /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
            );

            const AUDIO_CONFIG_KEY = 'english_study_audio_config_v1';
            const showAudioSettings = ref(false);
            // 默认采用【真人原声发音】（有道词典真人美英原声 + Google/百度神经网络自然语流 + 智能预加载缓存池 + 本地 TTS 兜底）
            const audioEngine = ref('online'); // 'online' | 'tts'
            const audioAccent = ref('us');     // 'us' (美音) | 'uk' (英音)
            const speechRate = ref(1.0);       // 0.75 ~ 1.25
            const enVoiceName = ref('');
            const availableVoices = ref([]);

            // 播放器状态
            const activeSentenceId = ref(null);
            const isSpeakingNow = ref(false);

            const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
            let sharedAudio = null;
            let activeUtterance = null;
            let currentSessionId = 0;
            let activeTimeoutId = null;
            let audioUnlocked = false;
            let ttsUnlocked = false;

            const getSharedAudio = () => {
                if (!sharedAudio && typeof Audio !== 'undefined') {
                    sharedAudio = new Audio();
                    sharedAudio.preload = 'auto';
                    sharedAudio.setAttribute('playsinline', '');
                    sharedAudio.setAttribute('webkit-playsinline', '');
                }
                return sharedAudio;
            };

            const initVoices = () => {
                if (!synth) return;
                const allVoices = synth.getVoices() || [];
                const enVoices = allVoices.filter(v => {
                    const lang = (v.lang || '').toLowerCase().replace('_', '-');
                    return lang.startsWith('en') ||
                        /english|英语|samantha|alex|ava|allison|susan|tom|daniel|serena|oliver|karen|moira|tessa|siri|aria|guy|jenny|ryan|sonia/i.test(v.name);
                });
                availableVoices.value = enVoices;

                if (enVoices.length > 0) {
                    if (!enVoiceName.value || !enVoices.some(v => v.name === enVoiceName.value)) {
                        const preferUK = audioAccent.value === 'uk';
                        const accentVoices = enVoices.filter(v => {
                            const lang = (v.lang || '').toLowerCase().replace('_', '-');
                            return preferUK ? (lang.includes('gb') || lang.includes('uk')) : lang.includes('us');
                        });
                        const pool = accentVoices.length > 0 ? accentVoices : enVoices;

                        // 本地真人级音色匹配优先级（参考 @japanese）：
                        // 1. Apple 原生 Siri 真人语音 (iPad/iOS 极品音质)
                        // 2. 微软 Edge 自然神经语音 (Aria / Jenny / Guy / Sonia / Ryan / Natural)
                        // 3. Apple Enhanced / Premium 高清增强语音 (Samantha / Ava / Alex / Daniel)
                        // 4. Apple 经典语音 (Samantha / Alex / Daniel / Serena)
                        // 5. Google 英语语音
                        const siri = pool.find(v => /siri/i.test(v.name)) || enVoices.find(v => /siri/i.test(v.name));
                        const natural = pool.find(v => /natural|online|aria|jenny|guy|sonia|ryan/i.test(v.name));
                        const enhanced = pool.find(v => /enhanced|premium|高品質|高品位/i.test(v.name));
                        const appleClassic = preferUK
                            ? pool.find(v => /daniel|serena|oliver|kate|martha/i.test(v.name))
                            : pool.find(v => /samantha|alex|ava|allison|tom/i.test(v.name));
                        const google = pool.find(v => /google/i.test(v.name));
                        enVoiceName.value = (siri || natural || enhanced || appleClassic || google || pool[0] || enVoices[0]).name;
                    }
                }
            };

            const getEnglishVoice = () => {
                if (!synth) return null;
                const allVoices = synth.getVoices() || [];
                if (availableVoices.value.length === 0 && allVoices.length > 0) {
                    initVoices();
                }
                const enVoices = allVoices.filter(v => {
                    const lang = (v.lang || '').toLowerCase().replace('_', '-');
                    return lang.startsWith('en') ||
                        /english|英语|samantha|alex|ava|allison|susan|tom|daniel|serena|oliver|karen|moira|tessa|siri|aria|guy|jenny|ryan|sonia/i.test(v.name);
                });
                if (enVoiceName.value) {
                    const found = enVoices.find(v => v.name === enVoiceName.value);
                    if (found) return found;
                }
                const preferUK = audioAccent.value === 'uk';
                const accentVoices = enVoices.filter(v => {
                    const lang = (v.lang || '').toLowerCase().replace('_', '-');
                    return preferUK ? (lang.includes('gb') || lang.includes('uk')) : lang.includes('us');
                });
                const pool = accentVoices.length > 0 ? accentVoices : enVoices;
                const siri = pool.find(v => /siri/i.test(v.name)) || enVoices.find(v => /siri/i.test(v.name));
                const natural = pool.find(v => /natural|online|aria|jenny|guy|sonia|ryan/i.test(v.name));
                const enhanced = pool.find(v => /enhanced|premium|高品質|高品位/i.test(v.name));
                const appleClassic = preferUK
                    ? pool.find(v => /daniel|serena|oliver|kate|martha/i.test(v.name))
                    : pool.find(v => /samantha|alex|ava|allison|tom/i.test(v.name));
                const google = pool.find(v => /google/i.test(v.name));
                return siri || natural || enhanced || appleClassic || google || pool[0] || enVoices[0] || null;
            };

            const loadAudioConfig = () => {
                try {
                    const raw = localStorage.getItem(AUDIO_CONFIG_KEY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.audioEngine) audioEngine.value = parsed.audioEngine;
                        if (parsed.audioAccent) audioAccent.value = parsed.audioAccent;
                        if (parsed.speechRate !== undefined && parsed.speechRate !== null) {
                            const r = Number(parsed.speechRate);
                            if (!isNaN(r) && r >= 0.7 && r <= 1.5) {
                                speechRate.value = Math.round(r * 100) / 100;
                            }
                        }
                        if (parsed.enVoiceName) enVoiceName.value = parsed.enVoiceName;
                    }
                } catch (e) {
                    console.error('加载英语语音配置失败', e);
                }
            };

            const saveAudioConfig = () => {
                try {
                    const r = Number(speechRate.value);
                    if (!isNaN(r) && r >= 0.7 && r <= 1.5) {
                        speechRate.value = Math.round(r * 100) / 100;
                    } else {
                        speechRate.value = 1.0;
                    }
                    localStorage.setItem(AUDIO_CONFIG_KEY, JSON.stringify({
                        audioEngine: audioEngine.value,
                        audioAccent: audioAccent.value,
                        speechRate: speechRate.value,
                        enVoiceName: enVoiceName.value
                    }));
                } catch (e) {
                    console.error('保存英语语音配置失败', e);
                }
            };

            // 真人原声发音高速缓存池与预加载系统（参考 @japanese）
            const onlineAudioCache = new Map(); // cacheKey -> Audio instance

            const buildOnlineUrls = (cleanText) => {
                const encoded = encodeURIComponent(cleanText);
                const isUK = audioAccent.value === 'uk';
                const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encoded}&type=${isUK ? 1 : 2}`;
                const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${isUK ? 'en-gb' : 'en'}&q=${encoded}`;
                const baiduUrl = `https://fanyi.baidu.com/gettts?lan=${isUK ? 'uk' : 'en'}&text=${encoded}&spd=3&source=web`;

                // 注意：有道 dictvoice 对完整长句会返回 HTTP 500，因此长句优先走 Google 神经网络 + 百度双通道，单词/短语优先走有道真人原声
                if (isSentenceText(cleanText)) {
                    return [googleUrl, baiduUrl];
                }
                return [youdaoUrl, googleUrl, baiduUrl];
            };

            const preloadOnlineAudio = (text) => {
                if (!text || typeof window === 'undefined' || audioEngine.value !== 'online') return;
                const clean = String(text).replace(/_{2,}/g, ' blank ').replace(/\s+/g, ' ').trim();
                if (!clean) return;
                const cacheKey = `${audioAccent.value}:${clean}`;
                if (onlineAudioCache.has(cacheKey)) return;

                try {
                    const urls = buildOnlineUrls(clean);
                    if (urls.length === 0) return;
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = urls[0];
                    onlineAudioCache.set(cacheKey, audio);
                    if (onlineAudioCache.size > 160) {
                        const firstKey = onlineAudioCache.keys().next().value;
                        onlineAudioCache.delete(firstKey);
                    }
                } catch (e) {}
            };

            const clearPendingTimer = () => {
                if (activeTimeoutId) {
                    clearTimeout(activeTimeoutId);
                    activeTimeoutId = null;
                }
            };

            const speakTTS = (text, rate, sessionId, onFinish) => {
                if (sessionId !== currentSessionId) return;
                if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
                    onFinish();
                    return;
                }
                try {
                    if (sharedAudio) {
                        try { sharedAudio.pause(); } catch (e) {}
                    }
                    if (synth.paused) {
                        synth.resume();
                    }

                    const utter = new SpeechSynthesisUtterance(text);
                    utter.lang = audioAccent.value === 'uk' ? 'en-GB' : 'en-US';
                    utter.rate = Number(rate) || Number(speechRate.value) || 1.0;

                    const selectedVoice = getEnglishVoice();
                    if (selectedVoice) {
                        utter.voice = selectedVoice;
                    }

                    // 挂载全局引用，防止 iOS Safari 垃圾回收提前销毁 utterance 导致无声或 onend 丢失
                    activeUtterance = utter;
                    window._englishActiveUtterance = utter;

                    let done = false;
                    const complete = () => {
                        if (done) return;
                        done = true;
                        clearPendingTimer();
                        if (activeUtterance === utter) activeUtterance = null;
                        if (window._englishActiveUtterance === utter) window._englishActiveUtterance = null;
                        onFinish();
                    };

                    // 安全兜底超时，防止极端情况下 iOS WebKit 不触发 onend 导致连播卡住
                    const maxMs = Math.max(4000, Math.min(25000, text.length * 140));
                    activeTimeoutId = setTimeout(complete, maxMs);

                    utter.onend = complete;
                    utter.onerror = (err) => {
                        if (err && err.error && err.error !== 'canceled' && err.error !== 'interrupted') {
                            console.warn('SpeechSynthesis error:', err.error);
                        }
                        complete();
                    };

                    // iOS Safari 关键修复：绝对不能无条件同步调用 cancel() 后立即 speak()，否则新队列也会被清空
                    if (synth.speaking) {
                        synth.cancel();
                        setTimeout(() => {
                            if (sessionId === currentSessionId) {
                                synth.speak(utter);
                            }
                        }, 30);
                    } else {
                        synth.speak(utter);
                    }
                } catch (e) {
                    console.error('SpeechSynthesis error:', e);
                    onFinish();
                }
            };

            const playOnlineAudio = (cleanText, rate, sessionId, onFinish) => {
                if (sessionId !== currentSessionId) return;
                const urls = buildOnlineUrls(cleanText);
                const audio = getSharedAudio();
                if (!audio || urls.length === 0) {
                    speakTTS(cleanText, rate, sessionId, onFinish);
                    return;
                }

                // 若本地 TTS 正在朗读，先停止它
                if (synth && activeUtterance && synth.speaking) {
                    synth.cancel();
                }

                const tryChannel = (channelIdx) => {
                    if (sessionId !== currentSessionId) return;
                    clearPendingTimer();

                    if (channelIdx >= urls.length) {
                        speakTTS(cleanText, rate, sessionId, onFinish);
                        return;
                    }

                    let settled = false;
                    let hasStarted = false;

                    const fallbackNext = (forceTTS = false) => {
                        if (settled || sessionId !== currentSessionId) return;
                        settled = true;
                        clearPendingTimer();
                        audio.onplaying = audio.onended = audio.onerror = audio.onloadedmetadata = null;
                        if (forceTTS) {
                            speakTTS(cleanText, rate, sessionId, onFinish);
                        } else {
                            tryChannel(channelIdx + 1);
                        }
                    };

                    audio.onplaying = audio.onended = audio.onerror = audio.onloadedmetadata = null;
                    try { audio.pause(); } catch (e) {}

                    audio.src = urls[channelIdx];
                    audio.defaultPlaybackRate = rate;
                    audio.playbackRate = rate;

                    audio.onloadedmetadata = () => {
                        if (sessionId === currentSessionId) {
                            audio.playbackRate = rate;
                        }
                    };

                    audio.onplaying = () => {
                        hasStarted = true;
                        audioUnlocked = true;
                        clearPendingTimer();
                    };

                    audio.onended = () => {
                        if (settled) return;
                        settled = true;
                        clearPendingTimer();
                        audio.onplaying = audio.onended = audio.onerror = audio.onloadedmetadata = null;
                        onFinish();
                    };

                    audio.onerror = () => {
                        fallbackNext(false);
                    };

                    // 超时保护：若当前在线通道超过 1400ms 仍未开始播放，自动无缝切换下一备用音源或本地 TTS
                    activeTimeoutId = setTimeout(() => {
                        if (!hasStarted && audio.paused) {
                            fallbackNext(false);
                        }
                    }, 1400);

                    try {
                        const playPromise = audio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch((err) => {
                                if (sessionId !== currentSessionId || hasStarted) return;
                                if (err && err.name === 'AbortError') return;
                                fallbackNext(err && err.name === 'NotAllowedError');
                            });
                        }
                    } catch (e) {
                        fallbackNext(false);
                    }
                };

                tryChannel(0);
            };

            const voicePlayer = {
                isSpeaking: false,
                speak(text, onEndCallback, rate) {
                    const clean = String(text || '').replace(/_{2,}/g, ' blank ').replace(/\s+/g, ' ').trim();
                    this.stop();
                    if (!clean) {
                        if (onEndCallback) onEndCallback();
                        return;
                    }

                    const sessionId = ++currentSessionId;
                    const playRate = Number(rate) || Number(speechRate.value) || 1.0;
                    this.isSpeaking = true;

                    const onFinish = () => {
                        if (sessionId !== currentSessionId) return;
                        clearPendingTimer();
                        this.isSpeaking = false;
                        if (onEndCallback) onEndCallback();
                    };

                    if (audioEngine.value === 'online') {
                        playOnlineAudio(clean, playRate, sessionId, onFinish);
                    } else {
                        const voice = getEnglishVoice();
                        if (!voice && synth && availableVoices.value.length === 0) {
                            playOnlineAudio(clean, playRate, sessionId, onFinish);
                        } else {
                            speakTTS(clean, playRate, sessionId, onFinish);
                        }
                    }
                },
                stop() {
                    currentSessionId++;
                    clearPendingTimer();
                    if (sharedAudio) {
                        sharedAudio.onplaying = sharedAudio.onended = sharedAudio.onerror = sharedAudio.onloadedmetadata = null;
                        try {
                            sharedAudio.pause();
                            sharedAudio.currentTime = 0;
                        } catch (e) {}
                    }
                    if (synth && (activeUtterance || synth.speaking)) {
                        try { synth.cancel(); } catch (e) {}
                    }
                    activeUtterance = null;
                    window._englishActiveUtterance = null;
                    this.isSpeaking = false;
                }
            };

            // 单词点击即时查词浮现卡片
            const selectedWordInfo = ref(null);

            // 测验作答记录
            const wordAnswers = ref({});
            const grammarAnswers = ref({});
            const showWordExampleZh = ref({});
            const showQuizZh = ref({});

            // 托业通关记录 [articleId, ...]
            const completedArticles = ref([]);

            // ------------ 核心动词卡状态 ------------
            const verbList = ref(typeof CORE_VERBS !== 'undefined' ? CORE_VERBS : []);
            const currentVerbIndex = ref(0);
            const verbFlipped = ref(false);
            const verbProgress = ref({}); // { [index]: 'known' | 'unknown' }
            const verbFilter = ref('all'); // 'all' | 'known' | 'unknown'
            const verbSearch = ref('');

            // ------------ 计算属性 ------------
            const currentArticle = computed(() => {
                return articles.value.find(a => a.id === currentArticleId.value) || articles.value[0] || {};
            });

            const completedArticlesCount = computed(() => completedArticles.value.length);

            const isCurrentArticleCompleted = computed(() => {
                return completedArticles.value.includes(currentArticleId.value);
            });

            // 动词统计
            const knownVerbsCount = computed(() => {
                return Object.values(verbProgress.value).filter(v => v === 'known').length;
            });

            const unknownVerbsCount = computed(() => {
                return Object.values(verbProgress.value).filter(v => v === 'unknown').length;
            });

            const totalVerbsCount = computed(() => verbList.value.length);

            const verbsRemainingCount = computed(() => {
                return Math.max(0, totalVerbsCount.value - knownVerbsCount.value - unknownVerbsCount.value);
            });

            const verbsMasteryPercent = computed(() => {
                if (totalVerbsCount.value === 0) return 0;
                return Math.round((knownVerbsCount.value / totalVerbsCount.value) * 100);
            });

            const currentVerb = computed(() => {
                return verbList.value[currentVerbIndex.value] || null;
            });

            const currentVerbStatus = computed(() => {
                return verbProgress.value[currentVerbIndex.value] || null;
            });

            // 过滤动词列表
            const filteredVerbList = computed(() => {
                const q = verbSearch.value.trim().toLowerCase();
                return verbList.value
                    .map((item, idx) => ({ ...item, originalIndex: idx }))
                    .filter(item => {
                        const status = verbProgress.value[item.originalIndex];
                        if (verbFilter.value === 'known' && status !== 'known') return false;
                        if (verbFilter.value === 'unknown' && status !== 'unknown') return false;
                        if (q) {
                            return item.english.toLowerCase().includes(q) || item.chinese.includes(q);
                        }
                        return true;
                    });
            });

            // 动词掌握总结文案
            const statsSummaryMessage = computed(() => {
                const percent = verbsMasteryPercent.value;
                if (percent === 100) return `太厉害啦！已熟练掌握全部 ${totalVerbsCount.value} 个核心高频生活动词！🎉`;
                if (percent >= 60) return `已熟练掌握 ${knownVerbsCount.value} 个动词，再巩固一下 ${unknownVerbsCount.value} 个需复习词汇！💪`;
                return `当前已掌握 ${knownVerbsCount.value} 个，保持翻牌复习节奏，越练越轻松！🌟`;
            });

            // ------------ 本地持久化 ------------
            const loadLocalData = () => {
                try {
                    const rawToeic = localStorage.getItem('toeic_completed_articles');
                    if (rawToeic) completedArticles.value = JSON.parse(rawToeic);
                } catch (e) {
                    console.error('加载托业短文打卡记录失败', e);
                }

                try {
                    const rawVerbs = localStorage.getItem('englishWordProgress');
                    if (rawVerbs) verbProgress.value = JSON.parse(rawVerbs);
                } catch (e) {
                    console.error('加载核心动词掌握记录失败', e);
                }
            };

            const saveToeicProgress = () => {
                try {
                    localStorage.setItem('toeic_completed_articles', JSON.stringify(completedArticles.value));
                } catch (e) {
                    console.error('保存托业打卡记录失败', e);
                }
            };

            const saveVerbProgress = () => {
                try {
                    localStorage.setItem('englishWordProgress', JSON.stringify(verbProgress.value));
                } catch (e) {
                    console.error('保存动词记录失败', e);
                }
                updateScoreRing();
            };

            // ------------ 导航与模式切换 ------------
            const switchTab = (tab) => {
                if (currentTab.value === 'toeic' && tab !== 'toeic') {
                    stopPlayback();
                }
                closeWordInfo();
                currentTab.value = tab;

                if (tab === 'stats') {
                    nextTick(() => updateScoreRing());
                }
            };

            const switchToeicSubTab = (subTab) => {
                if (subTab !== 'reading') {
                    stopPlayback();
                }
                closeWordInfo();
                toeicSubTab.value = subTab;
            };

            const selectArticle = (artId) => {
                stopPlayback();
                closeWordInfo();
                currentArticleId.value = artId;
                showWordExampleZh.value = {};
                showQuizZh.value = {};
                nextTick(() => preloadArticleAudio());
            };

            const nextArticle = () => {
                const nextId = currentArticleId.value >= articles.value.length ? 1 : currentArticleId.value + 1;
                selectArticle(nextId);
                toeicSubTab.value = 'reading';
            };

            // ------------ 托业短文阅读与发音 ------------
            const stopPlayback = () => {
                voicePlayer.stop();
                isSpeakingNow.value = false;
            };

            const playSentenceById = (sentId) => {
                const sent = currentArticle.value.sentences?.find(s => s.id === sentId);
                if (!sent) return;

                activeSentenceId.value = sent.id;
                isSpeakingNow.value = true;

                // 平滑居中滚动至当前句子
                nextTick(() => {
                    const el = document.getElementById('sentence-' + sent.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });

                voicePlayer.speak(sent.en, () => {
                    if (!isSpeakingNow.value) return;

                    // 默认整篇连播：当前句读完后自动接续下一句
                    const sents = currentArticle.value.sentences || [];
                    const curIdx = sents.findIndex(s => s.id === sent.id);
                    if (curIdx < sents.length - 1) {
                        const nextSent = sents[curIdx + 1];
                        setTimeout(() => {
                            if (isSpeakingNow.value) playSentenceById(nextSent.id);
                        }, 450);
                    } else {
                        isSpeakingNow.value = false;
                        triggerConfetti();
                    }
                }, speechRate.value);
            };

            const playSingleSentence = (sent) => {
                if (activeSentenceId.value === sent.id && isSpeakingNow.value) {
                    stopPlayback();
                } else {
                    playSentenceById(sent.id);
                }
            };

            // ------------ 单词 Token 化与即时点查 ------------
            const tokenizeSentence = (text, targetWordsList) => {
                if (!text) return [];
                const regex = /([a-zA-Z]+(?:-[a-zA-Z]+)*)|(_{2,})|([^a-zA-Z_]+)/g;
                const tokens = [];
                let match;
                const targets = (targetWordsList || []).map(w => (w.word || '').toLowerCase());

                while ((match = regex.exec(text)) !== null) {
                    if (match[1]) {
                        const word = match[1];
                        const lower = word.toLowerCase();
                        const isTarget = targets.some(t => lower === t || lower.startsWith(t) || t.startsWith(lower));
                        tokens.push({
                            type: 'word',
                            text: word,
                            clean: lower,
                            isTarget
                        });
                    } else if (match[2]) {
                        tokens.push({
                            type: 'blank',
                            text: match[2]
                        });
                    } else if (match[3]) {
                        tokens.push({
                            type: 'punct',
                            text: match[3]
                        });
                    }
                }
                return tokens;
            };

            const handleWordClick = (tok, contextKey) => {
                const lower = tok.clean;
                const dictEntry = wordDict[lower] || {};

                // 优先查验当前文章 target words
                const targetWordItem = currentArticle.value.words?.find(w =>
                    w.word.toLowerCase() === lower || lower.startsWith(w.word.toLowerCase()) || w.word.toLowerCase().startsWith(lower)
                );

                const phonetic = targetWordItem ? targetWordItem.phonetic : (dictEntry.phonetic || '');
                const meaning = targetWordItem ? targetWordItem.meaning : (dictEntry.meaning || '句中常见用词');
                const pos = targetWordItem ? targetWordItem.pos : (dictEntry.pos || '');

                selectedWordInfo.value = {
                    contextKey: contextKey,
                    text: tok.text,
                    clean: lower,
                    phonetic: phonetic,
                    pos: pos,
                    meaning: meaning,
                    isTarget: !!targetWordItem
                };

                // 单独发音
                speakText(tok.text);
            };

            const closeWordInfo = () => {
                selectedWordInfo.value = null;
            };

            const speakText = (text) => {
                if (isSpeakingNow.value) {
                    isSpeakingNow.value = false;
                }
                voicePlayer.speak(text, null, speechRate.value);
            };

            const testAudio = (wordSample) => {
                speakText(wordSample || 'complimentary');
                window.kidToast && window.kidToast('正在播放单词发音...', 'info');
            };

            const testSentenceAudio = (sentenceSample) => {
                speakText(sentenceSample || 'A new complimentary coffee machine is now available in the second-floor breakroom.');
                window.kidToast && window.kidToast('正在播放句子发音...', 'info');
            };

            const preloadArticleAudio = () => {
                const art = currentArticle.value;
                if (!art) return;
                (art.sentences || []).slice(0, 3).forEach(s => preloadOnlineAudio(s.en));
                (art.words || []).slice(0, 5).forEach(w => preloadOnlineAudio(w.word));
            };

            const preloadVerbAudio = () => {
                if (currentVerb.value) {
                    preloadOnlineAudio(currentVerb.value.english);
                }
                const nextIdx = (currentVerbIndex.value + 1) % (verbList.value.length || 1);
                if (verbList.value[nextIdx]) {
                    preloadOnlineAudio(verbList.value[nextIdx].english);
                }
            };

            const toggleWordExampleZh = (word) => {
                showWordExampleZh.value[word] = !showWordExampleZh.value[word];
            };

            const toggleQuizZh = (quizId) => {
                showQuizZh.value[quizId] = !showQuizZh.value[quizId];
            };

            // ------------ 测验与答题打卡 ------------
            const answerWordQuiz = (quiz, optIdx) => {
                wordAnswers.value[quiz.id] = optIdx;
                if (optIdx === quiz.answerIndex) {
                    triggerConfetti();
                    checkAutoCompletion();
                }
            };

            const answerGrammarQuiz = (quiz, optIdx) => {
                grammarAnswers.value[quiz.id] = optIdx;
                if (optIdx === quiz.answerIndex) {
                    triggerConfetti();
                    checkAutoCompletion();
                }
            };

            const checkAutoCompletion = () => {
                const art = currentArticle.value;
                if (!art || !art.wordQuizzes || !art.grammarQuizzes) return;

                const wordQuizzesDone = art.wordQuizzes.every(q => wordAnswers.value[q.id] === q.answerIndex);
                const grammarQuizzesDone = art.grammarQuizzes.every(q => grammarAnswers.value[q.id] === q.answerIndex);

                if (wordQuizzesDone && grammarQuizzesDone) {
                    markArticleAsCompleted(art.id);
                }
            };

            const markArticleAsCompleted = (artId) => {
                if (!completedArticles.value.includes(artId)) {
                    completedArticles.value.push(artId);
                    saveToeicProgress();
                    triggerConfetti(0.4);

                    if (window.showApiapiaPerfectReward) {
                        setTimeout(() => {
                            window.showApiapiaPerfectReward({
                                moduleName: currentArticle.value.title || '托业短文精读',
                                detail: `恭喜你！搞定了本篇全部核心词汇与语法自测！获得 ⭐ 打卡勋章！`
                            });
                        }, 400);
                    } else if (window.kidToast) {
                        window.kidToast('太棒啦！已点亮本课小星星 ⭐！', 'success');
                    }
                }
            };

            const resetCurrentArticleQuizzes = () => {
                const art = currentArticle.value;
                if (!art) return;
                art.wordQuizzes?.forEach(q => delete wordAnswers.value[q.id]);
                art.grammarQuizzes?.forEach(q => delete grammarAnswers.value[q.id]);
                window.kidToast && window.kidToast('本课测验作答已重置，可以重新挑战啦！', 'info');
            };

            const getArticleQuizProgress = (art) => {
                if (!art) return '0/0';
                let correct = 0;
                art.wordQuizzes?.forEach(q => {
                    if (wordAnswers.value[q.id] === q.answerIndex) correct++;
                });
                art.grammarQuizzes?.forEach(q => {
                    if (grammarAnswers.value[q.id] === q.answerIndex) correct++;
                });
                const total = (art.wordQuizzes?.length || 0) + (art.grammarQuizzes?.length || 0);
                return `${correct}/${total}`;
            };

            const getOptionClass = (userAnswerIdx, currentOptIdx, correctIdx) => {
                if (userAnswerIdx === undefined) {
                    return 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700/50';
                }
                if (userAnswerIdx === correctIdx) {
                    if (currentOptIdx === correctIdx) {
                        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500 border-b-4 border-b-emerald-600 font-extrabold shadow-sm';
                    }
                    return 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 opacity-60';
                }
                if (userAnswerIdx === currentOptIdx) {
                    return 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-2 border-rose-400 border-b-4 border-b-rose-500 font-bold animate-shake';
                }
                return 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 border-b-4 border-b-slate-300 dark:border-b-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700/50';
            };

            // ------------ 核心动词卡操作 ------------
            const toggleVerbFlip = () => {
                verbFlipped.value = !verbFlipped.value;
                if (verbFlipped.value && currentVerb.value) {
                    speakText(currentVerb.value.english);
                }
            };

            const prevVerb = () => {
                if (currentVerbIndex.value > 0) {
                    currentVerbIndex.value--;
                } else {
                    currentVerbIndex.value = verbList.value.length - 1;
                }
                verbFlipped.value = false;
                preloadVerbAudio();
            };

            const nextVerb = () => {
                if (currentVerbIndex.value < verbList.value.length - 1) {
                    currentVerbIndex.value++;
                } else {
                    currentVerbIndex.value = 0;
                }
                verbFlipped.value = false;
                preloadVerbAudio();
            };

            const markVerbKnown = () => {
                verbProgress.value[currentVerbIndex.value] = 'known';
                saveVerbProgress();
                nextVerb();
            };

            const markVerbUnknown = () => {
                verbProgress.value[currentVerbIndex.value] = 'unknown';
                saveVerbProgress();
                nextVerb();
            };

            const jumpToVerb = (originalIndex) => {
                currentVerbIndex.value = originalIndex;
                verbFlipped.value = false;
                switchTab('verbs');
            };

            // ------------ 圆环掌握度更新 ------------
            const updateScoreRing = () => {
                const scoreRing = document.getElementById('scoreRing');
                if (!scoreRing) return;
                const percent = verbsMasteryPercent.value;
                const isDark = typeof window.isDarkTheme === 'function' ? window.isDarkTheme() : document.documentElement.classList.contains('dark');
                const emptyColor = isDark ? '#334155' : '#e2e8f0';
                scoreRing.style.background = `conic-gradient(#4f46e5 ${percent}%, ${emptyColor} 0)`;
            };

            // ------------ 清理学习记录 ------------
            const clearToeicProgress = async () => {
                if (!window.kidConfirm) {
                    if (confirm('确定要清空全部托业短文通关记录吗？')) {
                        completedArticles.value = [];
                        saveToeicProgress();
                    }
                    return;
                }
                const ok = await window.kidConfirm({
                    title: '清空托业短文打卡？',
                    message: '确定要清空所有已通关短文打卡记录吗？此操作不可恢复。',
                    icon: '⭐',
                    type: 'danger',
                    confirmText: '确定清空',
                    cancelText: '取消'
                });
                if (ok) {
                    completedArticles.value = [];
                    saveToeicProgress();
                    window.kidToast && window.kidToast('托业短文打卡记录已清空！', 'success');
                }
            };

            const clearVerbProgress = async () => {
                if (!window.kidConfirm) {
                    if (confirm('确定要清空 100 动词记忆记录吗？')) {
                        verbProgress.value = {};
                        saveVerbProgress();
                    }
                    return;
                }
                const ok = await window.kidConfirm({
                    title: '清空动词学习记录？',
                    message: `确定要清空全部 ${totalVerbsCount.value} 个核心动词的掌握记录吗？此操作不可恢复。`,
                    icon: '🗑️',
                    type: 'danger',
                    confirmText: '确定清空',
                    cancelText: '取消'
                });
                if (ok) {
                    verbProgress.value = {};
                    saveVerbProgress();
                    window.kidToast && window.kidToast('核心动词学习记录已清空！', 'success');
                }
            };

            const clearAllProgress = async () => {
                if (!window.kidConfirm) {
                    if (confirm('确定要重置英语模块的全部学习数据吗？')) {
                        completedArticles.value = [];
                        verbProgress.value = {};
                        saveToeicProgress();
                        saveVerbProgress();
                    }
                    return;
                }
                const ok = await window.kidConfirm({
                    title: '清空全部学习记录？',
                    message: '将清空托业短文打卡与核心动词的全部学习记录，回到初始状态。确定继续吗？',
                    icon: '⚠️',
                    type: 'danger',
                    confirmText: '全部重置',
                    cancelText: '取消'
                });
                if (ok) {
                    completedArticles.value = [];
                    verbProgress.value = {};
                    saveToeicProgress();
                    saveVerbProgress();
                    window.kidToast && window.kidToast('英语模块数据已全部重置！', 'success');
                }
            };

            // ------------ 键盘快捷键监听 ------------
            const setupKeyboard = () => {
                document.addEventListener('keydown', (e) => {
                    // 如果在输入框中打字，不触发快捷键
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                    if (currentTab.value === 'verbs') {
                        if (e.key === 'ArrowLeft') {
                            prevVerb();
                        } else if (e.key === 'ArrowRight') {
                            nextVerb();
                        } else if (e.code === 'Space') {
                            e.preventDefault();
                            toggleVerbFlip();
                        } else if (e.key === '1' || e.key === 'ArrowDown') {
                            markVerbUnknown();
                        } else if (e.key === '2' || e.key === 'ArrowUp') {
                            markVerbKnown();
                        }
                    }
                });
            };

            // ------------ 初始化生命周期（含 iOS WebKit 手势解锁与语音包多重预热，参考 @japanese） ------------
            onMounted(() => {
                loadAudioConfig();
                initVoices();
                if (synth) {
                    if (synth.onvoiceschanged !== undefined) {
                        synth.onvoiceschanged = initVoices;
                    }
                }
                setTimeout(initVoices, 250);
                setTimeout(initVoices, 800);
                setTimeout(initVoices, 1600);

                // iPad / iOS WebKit audio & speech gesture unlocker (参考 @japanese)
                const unlockAudioAndTTS = () => {
                    if (synth && !ttsUnlocked) {
                        try {
                            if (synth.paused) synth.resume();
                            if (!synth.speaking && !voicePlayer.isSpeaking) {
                                const dummy = new SpeechSynthesisUtterance('');
                                dummy.volume = 0;
                                synth.speak(dummy);
                            }
                            ttsUnlocked = true;
                        } catch (e) {}
                        initVoices();
                    }
                    if (!audioUnlocked) {
                        try {
                            const audio = getSharedAudio();
                            if (audio && audio.paused && !voicePlayer.isSpeaking) {
                                audio.src = SILENT_WAV;
                                const p = audio.play();
                                if (p !== undefined) {
                                    p.then(() => {
                                        if (audio.src === SILENT_WAV) {
                                            audio.pause();
                                            audio.currentTime = 0;
                                        }
                                        audioUnlocked = true;
                                    }).catch(() => {});
                                }
                            }
                        } catch (e) {}
                    }
                };
                window.addEventListener('touchstart', unlockAudioAndTTS, { once: true, capture: true, passive: true });
                window.addEventListener('touchend', unlockAudioAndTTS, { once: true, capture: true, passive: true });
                window.addEventListener('click', unlockAudioAndTTS, { once: true, capture: true, passive: true });

                // 移动端切后台或锁屏时自动停止播放，防止回到前台后状态错乱
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden' && isSpeakingNow.value) {
                        stopPlayback();
                    }
                });

                loadLocalData();
                setupKeyboard();
                nextTick(() => {
                    updateScoreRing();
                    preloadArticleAudio();
                    preloadVerbAudio();
                });

                window.addEventListener('apiapia-theme-changed', () => {
                    updateScoreRing();
                });
            });

            return {
                isIOS,
                showAudioSettings,
                audioEngine,
                audioAccent,
                enVoiceName,
                availableVoices,
                saveAudioConfig,
                testAudio,
                testSentenceAudio,
                currentTab,
                articles,
                currentArticleId,
                currentArticle,
                completedArticles,
                completedArticlesCount,
                isCurrentArticleCompleted,
                toeicSubTab,
                showChinese,
                activeSentenceId,
                isSpeakingNow,
                speechRate,
                selectedWordInfo,
                wordAnswers,
                grammarAnswers,
                showWordExampleZh,
                showQuizZh,
                currentVerbIndex,
                currentVerb,
                currentVerbStatus,
                verbFlipped,
                verbProgress,
                verbFilter,
                verbSearch,
                filteredVerbList,
                knownVerbsCount,
                unknownVerbsCount,
                totalVerbsCount,
                verbsRemainingCount,
                verbsMasteryPercent,
                statsSummaryMessage,
                switchTab,
                switchToeicSubTab,
                selectArticle,
                nextArticle,
                playSingleSentence,
                tokenizeSentence,
                handleWordClick,
                closeWordInfo,
                speakText,
                toggleWordExampleZh,
                toggleQuizZh,
                answerWordQuiz,
                answerGrammarQuiz,
                markArticleAsCompleted,
                resetCurrentArticleQuizzes,
                getArticleQuizProgress,
                getOptionClass,
                toggleVerbFlip,
                prevVerb,
                nextVerb,
                markVerbKnown,
                markVerbUnknown,
                jumpToVerb,
                clearToeicProgress,
                clearVerbProgress,
                clearAllProgress
            };
        }
    });

    if (typeof vant !== 'undefined') {
        app.use(vant);
    }
    app.mount('#app');
})();
