/**
 * 英语小能手 · 核心交互逻辑 (Vue 3 驱动)
 * 融合：零基础托业语境短文精读 + 100 核心生活动词 3D 翻牌闪卡
 */

(function () {
    const { createApp, ref, computed, onMounted, nextTick, watch } = Vue;

    // =========================================================================
    // 1. Web Speech API 语音播放管理器封装
    // =========================================================================
    const voicePlayer = {
        isSpeaking: false,
        preferredVoice: null,
        currentRate: 1.0,

        init() {
            const updateVoices = () => {
                if (!('speechSynthesis' in window)) return;
                const voices = window.speechSynthesis.getVoices();
                this.preferredVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Google')))
                    || voices.find(v => v.lang === 'en-US')
                    || null;
            };

            if ('speechSynthesis' in window) {
                updateVoices();
                if (window.speechSynthesis.onvoiceschanged !== undefined) {
                    window.speechSynthesis.onvoiceschanged = updateVoices;
                }
            }
        },

        speak(text, onEndCallback, rate = 1.0) {
            if (!('speechSynthesis' in window)) {
                if (onEndCallback) onEndCallback();
                return;
            }

            window.speechSynthesis.cancel();
            if (!text) {
                if (onEndCallback) onEndCallback();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = rate || this.currentRate || 1.0;
            if (this.preferredVoice) utterance.voice = this.preferredVoice;

            utterance.onend = () => {
                this.isSpeaking = false;
                if (onEndCallback) onEndCallback();
            };

            utterance.onerror = () => {
                this.isSpeaking = false;
                if (onEndCallback) onEndCallback();
            };

            this.isSpeaking = true;
            window.speechSynthesis.speak(utterance);
        },

        stop() {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            this.isSpeaking = false;
        }
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
            const wordDict = ref(typeof TOEIC_WORD_DICT !== 'undefined' ? TOEIC_WORD_DICT : {});
            const currentArticleId = ref(1);
            const toeicSubTab = ref('reading'); // 'reading' | 'words' | 'grammar'
            const showChinese = ref(true); // 全篇译文开关

            // 播放器状态
            const activeSentenceId = ref(null);
            const isSpeakingNow = ref(false);
            const playbackMode = ref('continuous'); // 'continuous' | 'loop'
            const speechRate = ref(1.0); // 1.0 | 0.85 | 0.75

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
            const verbList = ref(typeof CORE_VERBS !== 'undefined' ? CORE_VERBS : (typeof words !== 'undefined' ? words : []));
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

            const activeSentenceIndex = computed(() => {
                if (!currentArticle.value || !currentArticle.value.sentences) return -1;
                return currentArticle.value.sentences.findIndex(s => s.id === activeSentenceId.value);
            });

            const currentSentenceTextPreview = computed(() => {
                if (activeSentenceIndex.value >= 0 && currentArticle.value.sentences) {
                    const s = currentArticle.value.sentences[activeSentenceIndex.value];
                    return s ? s.en : '';
                }
                return '点击播放或点任意句子开始';
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
                if (percent === 100) return '太厉害啦！已熟练掌握全部 100 个核心高频生活动词！🎉';
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

                    if (playbackMode.value === 'loop') {
                        setTimeout(() => {
                            if (isSpeakingNow.value) playSentenceById(sent.id);
                        }, 400);
                    } else if (playbackMode.value === 'continuous') {
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
                    } else {
                        isSpeakingNow.value = false;
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

            const togglePlayPause = () => {
                if (isSpeakingNow.value) {
                    stopPlayback();
                } else {
                    const targetId = activeSentenceId.value || currentArticle.value.sentences?.[0]?.id;
                    if (targetId) playSentenceById(targetId);
                }
            };

            const prevSentence = () => {
                const sents = currentArticle.value.sentences || [];
                if (sents.length === 0) return;
                let newIndex = activeSentenceIndex.value <= 0 ? sents.length - 1 : activeSentenceIndex.value - 1;
                playSentenceById(sents[newIndex].id);
            };

            const nextSentence = () => {
                const sents = currentArticle.value.sentences || [];
                if (sents.length === 0) return;
                let newIndex = activeSentenceIndex.value >= sents.length - 1 ? 0 : activeSentenceIndex.value + 1;
                playSentenceById(sents[newIndex].id);
            };

            const togglePlaybackMode = () => {
                playbackMode.value = playbackMode.value === 'continuous' ? 'loop' : 'continuous';
                window.kidToast && window.kidToast(playbackMode.value === 'continuous' ? '已切换为：整篇连播' : '已切换为：单句循环', 'info');
            };

            const toggleSpeechRate = () => {
                if (speechRate.value === 1.0) speechRate.value = 0.85;
                else if (speechRate.value === 0.85) speechRate.value = 0.75;
                else speechRate.value = 1.0;
                window.kidToast && window.kidToast(`语速已切换为：${speechRate.value}x`, 'info');
            };

            const scrollToActiveSentence = () => {
                const targetId = activeSentenceId.value || currentArticle.value.sentences?.[0]?.id;
                if (!targetId) return;
                const el = document.getElementById('sentence-' + targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                const dictEntry = wordDict.value[lower] || {};

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
                voicePlayer.speak(text, null, 1.0);
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
            };

            const nextVerb = () => {
                if (currentVerbIndex.value < verbList.value.length - 1) {
                    currentVerbIndex.value++;
                } else {
                    currentVerbIndex.value = 0;
                }
                verbFlipped.value = false;
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
                    message: '确定要清空全部 100 个核心动词的掌握记录吗？此操作不可恢复。',
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

            // ------------ 初始化生命周期 ------------
            onMounted(() => {
                voicePlayer.init();
                loadLocalData();
                setupKeyboard();
                nextTick(() => updateScoreRing());

                window.addEventListener('apiapia-theme-changed', () => {
                    updateScoreRing();
                });
            });

            return {
                currentTab,
                articles,
                wordDict,
                currentArticleId,
                currentArticle,
                completedArticles,
                completedArticlesCount,
                isCurrentArticleCompleted,
                toeicSubTab,
                showChinese,
                activeSentenceId,
                activeSentenceIndex,
                currentSentenceTextPreview,
                isSpeakingNow,
                playbackMode,
                speechRate,
                selectedWordInfo,
                wordAnswers,
                grammarAnswers,
                showWordExampleZh,
                showQuizZh,
                verbList,
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
                togglePlayPause,
                prevSentence,
                nextSentence,
                togglePlaybackMode,
                toggleSpeechRate,
                scrollToActiveSentence,
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

    app.mount('#app');
})();
