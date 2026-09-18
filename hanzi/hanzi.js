"use strict";

const STORAGE_KEY = "hanziDictationStatsV1";
const STROKE_PROGRESS_KEY = "hanziStrokeProgressV1";
const STROKE_ORDER_KEY = "hanziStrokeOrderV1";
const SPEECH_SETTINGS_KEY = "hanziSpeechSettingsV1";
const SYNC_KEY_STORAGE = "hanziSyncKeyV1";
const AUTO_SYNC_STORAGE = "hanziAutoSyncV1";
const LAST_SYNC_TIME_KEY = "hanziLastSyncTimeV1";

let debounceSyncTimer = null;

const state = {
    mode: "dictation",
    session: [],
    currentIndex: 0,
    writings: [],
    answers: [],
    recognitionSession: [],
    recognitionIndex: 0,
    recognitionAnswers: [],
    choiceSession: [],
    choiceIndex: 0,
    choiceAnswers: [],
    choiceHadMistake: false,
    choiceLocked: false,
    speechRate: 0.78,
    speechMode: "hint",
    strokes: [],
    activeStroke: null,
    currentWriting: "",
    answerStrokeWriter: null,
    answerStrokeRenderToken: 0,
    currentStory: "",
    strokeSession: [],
    strokeIndex: 0,
    strokeWriter: null,
    strokeRenderToken: 0,
    strokeStartToken: 0
};

const els = {
    setupScreen: document.getElementById("setupScreen"),
    dictationScreen: document.getElementById("dictationScreen"),
    recognitionScreen: document.getElementById("recognitionScreen"),
    summaryScreen: document.getElementById("summaryScreen"),
    categorySelect: document.getElementById("categorySelect"),
    countSelect: document.getElementById("countSelect"),
    speechMode: document.getElementById("speechMode"),
    speechRate: document.getElementById("speechRate"),
    openSettingsBtn: document.getElementById("openSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    confirmSettingsBtn: document.getElementById("confirmSettingsBtn"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    settingsModal: document.getElementById("settingsModal"),
    testSpeechBtn: document.getElementById("testSpeechBtn"),
    openSyncBtn: document.getElementById("openSyncBtn"),
    closeSyncBtn: document.getElementById("closeSyncBtn"),
    confirmSyncBtn: document.getElementById("confirmSyncBtn"),
    syncModalBackdrop: document.getElementById("syncModalBackdrop"),
    syncModal: document.getElementById("syncModal"),
    syncKeyInput: document.getElementById("syncKeyInput"),
    autoSyncCheckbox: document.getElementById("autoSyncCheckbox"),
    pushSyncBtn: document.getElementById("pushSyncBtn"),
    pullSyncBtn: document.getElementById("pullSyncBtn"),
    syncStatusLabel: document.getElementById("syncStatusLabel"),
    lastSyncTimeLabel: document.getElementById("lastSyncTimeLabel"),
    syncOverviewNote: document.getElementById("syncOverviewNote"),
    ebbinghausBanner: document.getElementById("ebbinghausBanner"),
    ebBannerTitle: document.getElementById("ebBannerTitle"),
    ebBannerDesc: document.getElementById("ebBannerDesc"),
    quickDueBtn: document.getElementById("quickDueBtn"),
    dueCount: document.getElementById("dueCount"),
    masteredCount: document.getElementById("masteredCount"),
    startBtn: document.getElementById("startBtn"),
    recognitionStartBtn: document.getElementById("recognitionStartBtn"),
    choiceStartBtn: document.getElementById("choiceStartBtn"),
    storyStartBtn: document.getElementById("storyStartBtn"),
    strokeStartBtn: document.getElementById("strokeStartBtn"),
    resetDataBtn: document.getElementById("resetDataBtn"),
    totalPracticed: document.getElementById("totalPracticed"),
    totalCorrect: document.getElementById("totalCorrect"),
    wrongCount: document.getElementById("wrongCount"),
    wrongbookSetup: document.getElementById("wrongbookSetup"),
    wrongbookListSetup: document.getElementById("wrongbookListSetup"),

    currentNumber: document.getElementById("currentNumber"),
    totalNumber: document.getElementById("totalNumber"),
    dictationStageLabel: document.getElementById("dictationStageLabel"),
    progressBar: document.getElementById("progressBar"),
    questionPinyin: document.getElementById("questionPinyin"),
    speakBtn: document.getElementById("speakBtn"),
    writingArea: document.getElementById("writingArea"),
    writingBoard: document.getElementById("writingBoard"),
    writingCanvas: document.getElementById("writingCanvas"),
    undoStrokeBtn: document.getElementById("undoStrokeBtn"),
    clearWritingBtn: document.getElementById("clearWritingBtn"),
    showAnswerBtn: document.getElementById("showAnswerBtn"),
    answerPanel: document.getElementById("answerPanel"),
    answerHint: document.getElementById("answerHint"),
    currentWritingPreview: document.getElementById("currentWritingPreview"),
    answerStrokeWriter: document.getElementById("answerStrokeWriter"),
    answerStrokeStatus: document.getElementById("answerStrokeStatus"),
    replayAnswerStrokeBtn: document.getElementById("replayAnswerStrokeBtn"),
    correctBtn: document.getElementById("correctBtn"),
    wrongBtn: document.getElementById("wrongBtn"),
    quitBtn: document.getElementById("quitBtn"),
    dictationLevelBadge: document.getElementById("dictationLevelBadge"),
    dictationEbHint: document.getElementById("dictationEbHint"),
    dictationEbPredictText: document.getElementById("dictationEbPredictText"),

    recognitionCurrentNumber: document.getElementById("recognitionCurrentNumber"),
    recognitionTotalNumber: document.getElementById("recognitionTotalNumber"),
    recognitionProgressBar: document.getElementById("recognitionProgressBar"),
    recognitionCharBtn: document.getElementById("recognitionCharBtn"),
    recognitionChar: document.getElementById("recognitionChar"),
    recognitionTapTip: document.getElementById("recognitionTapTip"),
    recognitionReveal: document.getElementById("recognitionReveal"),
    recognitionPinyin: document.getElementById("recognitionPinyin"),
    recognitionHint: document.getElementById("recognitionHint"),
    recognitionReplayBtn: document.getElementById("recognitionReplayBtn"),
    recognitionWrongBtn: document.getElementById("recognitionWrongBtn"),
    recognitionCorrectBtn: document.getElementById("recognitionCorrectBtn"),
    quitRecognitionBtn: document.getElementById("quitRecognitionBtn"),
    recognitionLevelBadge: document.getElementById("recognitionLevelBadge"),
    recognitionEbHint: document.getElementById("recognitionEbHint"),
    recognitionEbPredictText: document.getElementById("recognitionEbPredictText"),

    choiceScreen: document.getElementById("choiceScreen"),
    choiceCurrentNumber: document.getElementById("choiceCurrentNumber"),
    choiceTotalNumber: document.getElementById("choiceTotalNumber"),
    choiceProgressBar: document.getElementById("choiceProgressBar"),
    choiceSpeakBtn: document.getElementById("choiceSpeakBtn"),
    choiceOptions: document.getElementById("choiceOptions"),
    choiceFeedback: document.getElementById("choiceFeedback"),
    choiceLevelBadge: document.getElementById("choiceLevelBadge"),
    quitChoiceBtn: document.getElementById("quitChoiceBtn"),

    storyScreen: document.getElementById("storyScreen"),
    storyText: document.getElementById("storyText"),
    storyPinyin: document.getElementById("storyPinyin"),
    storyPinyinBtn: document.getElementById("storyPinyinBtn"),
    storySpeakBtn: document.getElementById("storySpeakBtn"),
    storyNextBtn: document.getElementById("storyNextBtn"),
    quitStoryBtn: document.getElementById("quitStoryBtn"),

    strokeScreen: document.getElementById("strokeScreen"),
    strokeCurrentNumber: document.getElementById("strokeCurrentNumber"),
    strokeTotalNumber: document.getElementById("strokeTotalNumber"),
    strokeProgressBar: document.getElementById("strokeProgressBar"),
    strokePinyin: document.getElementById("strokePinyin"),
    strokeHint: document.getElementById("strokeHint"),
    strokeGrid: document.getElementById("strokeGrid"),
    strokeWriter: document.getElementById("strokeWriter"),
    strokeStatus: document.getElementById("strokeStatus"),
    previousStrokeBtn: document.getElementById("previousStrokeBtn"),
    nextStrokeBtn: document.getElementById("nextStrokeBtn"),
    quitStrokeBtn: document.getElementById("quitStrokeBtn"),

    scoreRing: document.getElementById("scoreRing"),
    scoreText: document.getElementById("scoreText"),
    summaryMessage: document.getElementById("summaryMessage"),
    resultList: document.getElementById("resultList"),
    practiceWrongBtn: document.getElementById("practiceWrongBtn"),
    continueDueBtn: document.getElementById("continueDueBtn"),
    backHomeBtn: document.getElementById("backHomeBtn")
};

const DAY = 24 * 60 * 60 * 1000;

function calculateNextReview(level) {
    let daysToAdd = 0;
    switch (Number(level) || 0) {
        case 0: daysToAdd = 0; break;       // 今日/即时复习
        case 1: daysToAdd = 1; break;       // 1 天后
        case 2: daysToAdd = 3; break;       // 3 天后
        case 3: daysToAdd = 7; break;       // 7 天后 (已掌握阶段)
        case 4: daysToAdd = 14; break;      // 14 天后
        case 5: daysToAdd = 30; break;      // 30 天后
        default: daysToAdd = 60; break;     // 60 天后
    }
    return Date.now() + daysToAdd * DAY;
}

function getNextReviewDays(level) {
    switch (Number(level) || 0) {
        case 0: return "今日";
        case 1: return "1天后";
        case 2: return "3天后";
        case 3: return "7天后";
        case 4: return "14天后";
        case 5: return "30天后";
        default: return "60天后";
    }
}

function formatDateDisplay(ts) {
    if (!ts) return "今日待复习";
    if (ts <= Date.now()) return "今日待复习";
    const d = new Date(Number(ts));
    const diffDays = Math.ceil((ts - Date.now()) / DAY);
    return `${diffDays}天后 (${d.getMonth() + 1}/${d.getDate()})`;
}

function updateLevelBadge(badgeEl, char) {
    if (!badgeEl) return;
    const stats = loadStats();
    const cs = getCharStats(stats, char);
    const level = cs.level || 0;
    const isMastered = level >= 3;
    const isDue = (cs.nextReviewDate || 0) <= Date.now();

    badgeEl.textContent = `Lv.${level}${isMastered ? " 🌟" : ""}`;
    badgeEl.className = `level-badge ${isMastered ? "level-mastered" : (isDue ? "level-due" : "")}`;
    badgeEl.title = `艾宾浩斯等级 Lv.${level}${isMastered ? " (已掌握)" : ""}，下次复习: ${formatDateDisplay(cs.nextReviewDate)}`;
}

function getDefaultStats() {
    const characters = {};
    const now = Date.now();
    // 所有汉字均已学习过，初始全部设为 Lv.1 且进入今日待复习队列
    if (typeof HANZI_DATA !== "undefined" && Array.isArray(HANZI_DATA)) {
        HANZI_DATA.forEach(item => {
            characters[item.char] = {
                practiced: 0,
                correct: 0,
                wrong: 0,
                streak: 0,
                lastPracticed: null,
                level: 1,
                nextReviewDate: now
            };
        });
    }
    return {
        totalPracticed: 0,
        totalCorrect: 0,
        characters
    };
}

function ensureAllCharactersLearned(stats) {
    if (!stats.characters) stats.characters = {};
    let changed = false;
    const now = Date.now();

    if (typeof HANZI_DATA !== "undefined" && Array.isArray(HANZI_DATA)) {
        HANZI_DATA.forEach(item => {
            const char = item.char;
            if (!stats.characters[char]) {
                stats.characters[char] = {
                    practiced: 0,
                    correct: 0,
                    wrong: 0,
                    streak: 0,
                    lastPracticed: null,
                    level: 1, // 已学习过，初始从 Lv.1 开始
                    nextReviewDate: now
                };
                changed = true;
            } else {
                const c = stats.characters[char];
                if (c.level === undefined || c.level === null) {
                    if (c.wrong > 0 && c.streak === 0) {
                        c.level = 0;
                        c.nextReviewDate = now;
                    } else if (c.streak >= 5) {
                        c.level = 4;
                        c.nextReviewDate = now + 14 * DAY;
                    } else if (c.streak >= 3) {
                        c.level = 3;
                        c.nextReviewDate = now + 7 * DAY;
                    } else if (c.streak >= 1) {
                        c.level = 2;
                        c.nextReviewDate = now + 3 * DAY;
                    } else {
                        c.level = 1;
                        c.nextReviewDate = now;
                    }
                    changed = true;
                }
                if (c.nextReviewDate === undefined || c.nextReviewDate === null) {
                    c.nextReviewDate = now;
                    changed = true;
                }
            }
        });
    }

    if (changed) {
        saveStats(stats);
    }
    return stats;
}

function loadStats() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const def = getDefaultStats();
            saveStats(def);
            return def;
        }

        const parsed = JSON.parse(raw);
        const stats = {
            totalPracticed: Number(parsed.totalPracticed) || 0,
            totalCorrect: Number(parsed.totalCorrect) || 0,
            characters: parsed.characters || {}
        };
        return ensureAllCharactersLearned(stats);
    } catch (error) {
        console.warn("读取学习记录失败：", error);
        return getDefaultStats();
    }
}

function saveStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    triggerAutoSync();
}

function loadSpeechSettings() {
    try {
        const raw = localStorage.getItem(SPEECH_SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.speechMode && els.speechMode) {
                els.speechMode.value = parsed.speechMode;
                state.speechMode = parsed.speechMode;
            }
            if (parsed.speechRate && els.speechRate) {
                els.speechRate.value = parsed.speechRate;
                state.speechRate = Number(parsed.speechRate);
            }
        } else {
            if (els.speechMode) state.speechMode = els.speechMode.value;
            if (els.speechRate) state.speechRate = Number(els.speechRate.value);
        }
    } catch (error) {
        console.warn("读取朗读设置失败：", error);
    }
}

function saveSpeechSettings() {
    try {
        if (!els.speechMode || !els.speechRate) return;
        localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify({
            speechMode: els.speechMode.value,
            speechRate: els.speechRate.value
        }));
        state.speechMode = els.speechMode.value;
        state.speechRate = Number(els.speechRate.value);
    } catch (error) {
        console.warn("保存朗读设置失败：", error);
    }
}

function openSettingsModal() {
    if (!els.settingsModal) return;
    els.settingsModal.classList.remove("hidden");
    if (els.openSettingsBtn) {
        els.openSettingsBtn.setAttribute("aria-expanded", "true");
    }
}

function closeSettingsModal() {
    if (!els.settingsModal) return;
    els.settingsModal.classList.add("hidden");
    if (els.openSettingsBtn) {
        els.openSettingsBtn.setAttribute("aria-expanded", "false");
    }
    window.speechSynthesis?.cancel?.();
}

function openSyncModal() {
    if (!els.syncModal) return;
    loadSyncConfigToUI();
    els.syncModal.classList.remove("hidden");
    if (els.openSyncBtn) {
        els.openSyncBtn.setAttribute("aria-expanded", "true");
    }
}

function closeSyncModal() {
    if (!els.syncModal) return;
    saveSyncConfigFromUI();
    els.syncModal.classList.add("hidden");
    if (els.openSyncBtn) {
        els.openSyncBtn.setAttribute("aria-expanded", "false");
    }
}

function loadSyncConfigToUI() {
    try {
        const savedKey = localStorage.getItem(SYNC_KEY_STORAGE) || "";
        const autoSync = localStorage.getItem(AUTO_SYNC_STORAGE) === "true";
        const lastSync = localStorage.getItem(LAST_SYNC_TIME_KEY) || "";

        if (els.syncKeyInput) els.syncKeyInput.value = savedKey;
        if (els.autoSyncCheckbox) els.autoSyncCheckbox.checked = autoSync;
        if (els.lastSyncTimeLabel) els.lastSyncTimeLabel.textContent = lastSync || "未同步";
    } catch (e) {
        console.warn("读取同步配置失败：", e);
    }
}

function saveSyncConfigFromUI() {
    try {
        if (els.syncKeyInput) {
            localStorage.setItem(SYNC_KEY_STORAGE, els.syncKeyInput.value.trim());
        }
        if (els.autoSyncCheckbox) {
            localStorage.setItem(AUTO_SYNC_STORAGE, els.autoSyncCheckbox.checked ? "true" : "false");
        }
        updateSyncOverviewBadge();
    } catch (e) {
        console.warn("保存同步配置失败：", e);
    }
}

function updateSyncOverviewBadge() {
    if (!els.syncOverviewNote) return;
    const key = (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim();
    if (key) {
        const displayKey = key.length > 10 ? `${key.slice(0, 8)}...` : key;
        els.syncOverviewNote.textContent = `已绑定云端同步 (${displayKey})`;
    } else {
        els.syncOverviewNote.textContent = "支持 Cloudflare 云端备份与多端同步";
    }
}

function setSyncStatus(type, text) {
    if (!els.syncStatusLabel) return;
    els.syncStatusLabel.className = `sync-status-val ${type}`;
    els.syncStatusLabel.textContent = text;
}

function setLastSyncTime(timeStr) {
    try {
        localStorage.setItem(LAST_SYNC_TIME_KEY, timeStr);
    } catch (_) {}
    if (els.lastSyncTimeLabel) {
        els.lastSyncTimeLabel.textContent = timeStr || "未同步";
    }
}

function triggerAutoSync() {
    const key = (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim();
    const autoSync = localStorage.getItem(AUTO_SYNC_STORAGE) === "true";
    if (!autoSync || !key) return;

    clearTimeout(debounceSyncTimer);
    debounceSyncTimer = setTimeout(() => {
        pushToCloud(true);
    }, 2500);
}

async function pushToCloud(silent = false) {
    const key = (els.syncKeyInput ? els.syncKeyInput.value.trim() : "") || (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim();
    if (!key) {
        if (!silent) alert("请先输入专属同步密钥 (Sync Key)！");
        return;
    }

    setSyncStatus("syncing", "正在推送...");
    try {
        let strokeProg = "";
        try {
            strokeProg = localStorage.getItem(STROKE_PROGRESS_KEY) || "";
        } catch (_) {}

        let speechSettings = {};
        try {
            const raw = localStorage.getItem(SPEECH_SETTINGS_KEY);
            if (raw) speechSettings = JSON.parse(raw);
        } catch (_) {}

        const res = await fetch(`/api/hanzi/sync?key=${encodeURIComponent(key)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stats: loadStats(),
                strokeProgress: strokeProg,
                speechSettings: speechSettings,
                syncKey: key
            })
        });

        const json = await res.json();
        if (json.success) {
            const now = new Date();
            const nowStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            setSyncStatus("success", `同步成功 (${now.toLocaleTimeString()})`);
            setLastSyncTime(nowStr);
            if (!silent) alert("☁️ 已成功将本地学习数据推送到云端备份！");
        } else {
            setSyncStatus("error", json.message || "同步失败");
            if (!silent) alert("推送云端失败：" + (json.message || json.error || "未知错误"));
        }
    } catch (err) {
        setSyncStatus("error", "网络或接口异常");
        if (!silent) alert("推送失败，请检查网络连接或 Cloudflare 部署状态：" + err.message);
    }
}

async function pullFromCloud(silent = false) {
    const key = (els.syncKeyInput ? els.syncKeyInput.value.trim() : "") || (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim();
    if (!key) {
        if (!silent) alert("请先输入专属同步密钥 (Sync Key)！");
        return;
    }

    setSyncStatus("syncing", "正在拉取...");
    try {
        const res = await fetch(`/api/hanzi/sync?key=${encodeURIComponent(key)}`);
        const json = await res.json();

        if (json.success && json.data) {
            const cloudData = json.data;
            if (cloudData.stats && typeof cloudData.stats === "object") {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData.stats));
            }
            if (cloudData.strokeProgress) {
                localStorage.setItem(STROKE_PROGRESS_KEY, cloudData.strokeProgress);
            }
            if (cloudData.speechSettings && typeof cloudData.speechSettings === "object") {
                localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(cloudData.speechSettings));
                loadSpeechSettings();
            }

            refreshHomeStats();
            const now = new Date();
            const nowStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            setSyncStatus("success", `拉取成功 (${now.toLocaleTimeString()})`);
            setLastSyncTime(nowStr);

            if (!silent) {
                const total = cloudData.stats?.totalPracticed || 0;
                const wrong = Object.values(cloudData.stats?.characters || {}).filter(c => c.wrong > 0).length;
                alert(`☁️ 已成功拉取云端数据！（累计练习 ${total} 次，错字本 ${wrong} 个）`);
            }
        } else if (json.success && !json.data) {
            setSyncStatus("success", "云端暂无数据");
            if (!silent) alert("该密钥在云端尚无记录，您可以先点击【推送到云端】进行初次备份！");
        } else {
            setSyncStatus("error", json.message || "拉取失败");
            if (!silent) alert("拉取失败：" + (json.message || json.error || "未知错误"));
        }
    } catch (err) {
        setSyncStatus("error", "网络或接口异常");
        if (!silent) alert("拉取失败，请检查网络连接或 Cloudflare 部署状态：" + err.message);
    }
}

function previewSpeech() {
    if (!("speechSynthesis" in window)) {
        alert("当前浏览器不支持语音朗读。建议使用 Chrome、Edge、Safari 或手机自带浏览器。");
        return;
    }
    window.speechSynthesis.cancel();

    const rate = Number(els.speechRate.value) || 0.78;
    const mode = els.speechMode.value;
    let text = "天。天空的天。";
    if (mode === "char") {
        text = "天";
    } else if (mode === "twice") {
        text = "天。天。";
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;

    utterance.onerror = event => {
        console.warn("试听播放失败：", event.error);
    };

    window.speechSynthesis.speak(utterance);
}

function getCharStats(stats, char) {
    const saved = (stats && stats.characters && stats.characters[char]) || {};
    return {
        practiced: 0,
        correct: 0,
        wrong: 0,
        streak: 0,
        lastPracticed: null,
        level: 1,
        nextReviewDate: Date.now(),
        ...saved
    };
}

function updateStatsForAnswer(item, isCorrect) {
    const stats = loadStats();
    const charStats = getCharStats(stats, item.char);

    stats.totalPracticed += 1;
    charStats.practiced += 1;
    charStats.lastPracticed = new Date().toISOString();

    const oldLevel = Number(charStats.level) || 0;
    let newLevel = oldLevel;

    if (isCorrect) {
        stats.totalCorrect += 1;
        charStats.correct += 1;
        charStats.streak += 1;
        newLevel = oldLevel + 1;
        charStats.level = newLevel;
        charStats.nextReviewDate = calculateNextReview(newLevel);
    } else {
        charStats.wrong += 1;
        charStats.streak = 0;
        newLevel = 0;
        charStats.level = 0;
        charStats.nextReviewDate = Date.now(); // 设为今日待复习
    }

    stats.characters[item.char] = charStats;
    saveStats(stats);
    return { oldLevel, newLevel, nextReviewDate: charStats.nextReviewDate };
}

function getWrongCharacters(stats = loadStats()) {
    return HANZI_DATA
        .map(item => ({
            ...item,
            wrongScore: getCharStats(stats, item.char).wrong
        }))
        .filter(item => item.wrongScore > 0)
        .sort((a, b) => b.wrongScore - a.wrongScore);
}

function getDueCharacters(stats = loadStats()) {
    const now = Date.now();
    return HANZI_DATA.filter(item => {
        const cs = getCharStats(stats, item.char);
        return (cs.nextReviewDate || 0) <= now;
    });
}

function getMasteredCharacters(stats = loadStats()) {
    return HANZI_DATA.filter(item => {
        const cs = getCharStats(stats, item.char);
        return (cs.level || 0) >= 3;
    });
}

function refreshHomeStats() {
    const stats = loadStats();
    const wrongChars = getWrongCharacters(stats);
    const dueChars = getDueCharacters(stats);
    const masteredChars = getMasteredCharacters(stats);

    if (els.dueCount) els.dueCount.textContent = dueChars.length;
    if (els.masteredCount) els.masteredCount.textContent = masteredChars.length;
    if (els.wrongCount) els.wrongCount.textContent = wrongChars.length;
    if (els.totalPracticed) els.totalPracticed.textContent = stats.totalPracticed;

    const statDue = document.getElementById("statDue");
    const statMastered = document.getElementById("statMastered");
    const statWrong = document.getElementById("statWrong");
    const statTotal = document.getElementById("statTotal");
    if (statDue) statDue.textContent = dueChars.length;
    if (statMastered) statMastered.textContent = masteredChars.length;
    if (statWrong) statWrong.textContent = wrongChars.length;
    if (statTotal) statTotal.textContent = stats.totalPracticed;

    const navDueBadge = document.getElementById("navDueBadge");
    const navWrongBadge = document.getElementById("navWrongBadge");
    if (navDueBadge) {
        navDueBadge.textContent = dueChars.length > 99 ? '99+' : dueChars.length;
        navDueBadge.classList.toggle("hidden", dueChars.length === 0);
    }
    if (navWrongBadge) {
        navWrongBadge.textContent = wrongChars.length > 99 ? '99+' : wrongChars.length;
        navWrongBadge.classList.toggle("hidden", wrongChars.length === 0);
    }

    // 艾宾浩斯复习横幅状态提示
    if (els.ebbinghausBanner) {
        if (dueChars.length > 0) {
            if (els.ebBannerTitle) els.ebBannerTitle.textContent = `⏰ 今日艾宾浩斯待复习：${dueChars.length} 个汉字`;
            if (els.ebBannerDesc) els.ebBannerDesc.textContent = `遗忘曲线提醒：今日有 ${dueChars.length} 个汉字到达最佳复习点，及时复习可大幅提升长期记忆！`;
            if (els.quickDueBtn) {
                els.quickDueBtn.classList.remove("hidden");
                els.quickDueBtn.textContent = `⚡ 立即复习 (${dueChars.length})`;
            }
        } else {
            if (els.ebBannerTitle) els.ebBannerTitle.textContent = `🎉 今日复习已全部完成！`;
            if (els.ebBannerDesc) els.ebBannerDesc.textContent = `所有 ${HANZI_DATA.length} 个汉字均在艾宾浩斯记忆保护期内，保持良好记忆节奏！`;
            if (els.quickDueBtn) {
                els.quickDueBtn.classList.add("hidden");
            }
        }
    }

    els.wrongbookListSetup.innerHTML = "";

    if (wrongChars.length === 0) {
        els.wrongbookSetup.classList.add("hidden");
    } else {
        els.wrongbookSetup.classList.remove("hidden");
        wrongChars.slice(0, 30).forEach(item => {
            const chip = document.createElement("span");
            chip.className = "wrong-item";
            const charStats = getCharStats(stats, item.char);
            chip.textContent = `${item.char} (Lv.${charStats.level || 0})`;
            const wrongRate = charStats.practiced
                ? Math.round((charStats.wrong / charStats.practiced) * 100)
                : 0;
            chip.title = `累计错误 ${charStats.wrong} 次，错误率 ${wrongRate}%`;
            els.wrongbookListSetup.appendChild(chip);
        });
    }

    buildCategoryOptions();
}

function buildCategoryOptions() {
    const stats = loadStats();
    const dueChars = getDueCharacters(stats);
    const wrongChars = getWrongCharacters(stats);
    const categories = [...new Set(HANZI_DATA.map(item => item.category))];

    const prevValue = els.categorySelect ? els.categorySelect.value : "";

    const options = [
        {
            value: "due",
            label: `🌟 今日待复习（${dueChars.length}个）${dueChars.length > 0 ? " [艾宾浩斯推荐]" : " [已完成]"}`
        },
        {
            value: "all",
            label: `🌐 全部汉字轮练（${HANZI_DATA.length}个）`
        },
        {
            value: "wrong",
            label: `📕 错字本专项（${wrongChars.length}个）`
        },
        ...categories.map(category => ({
            value: category,
            label: `📂 ${category}（${HANZI_DATA.filter(item => item.category === category).length}个）`
        }))
    ];

    if (!els.categorySelect) return;
    els.categorySelect.innerHTML = "";
    options.forEach(option => {
        const node = document.createElement("option");
        node.value = option.value;
        node.textContent = option.label;
        els.categorySelect.appendChild(node);
    });

    if (prevValue && options.some(o => o.value === prevValue)) {
        els.categorySelect.value = prevValue;
    } else if (dueChars.length > 0) {
        els.categorySelect.value = "due";
    } else {
        els.categorySelect.value = "all";
    }
}

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function createSession() {
    const selectedCategory = els.categorySelect.value;
    const requestedCount = Number(els.countSelect.value);
    const stats = loadStats();

    let pool;

    if (selectedCategory === "due") {
        pool = getDueCharacters(stats);
        if (pool.length === 0) {
            alert("🎉 今日艾宾浩斯待复习汉字已全部完成！已为您切换至全部汉字练习。");
            pool = [...HANZI_DATA];
        }
    } else if (selectedCategory === "wrong") {
        pool = getWrongCharacters(stats);
        if (pool.length === 0) {
            alert("错字本还是空的，太棒了！已为您切换至今日待复习。");
            pool = getDueCharacters(stats);
            if (pool.length === 0) pool = [...HANZI_DATA];
        }
    } else if (selectedCategory === "all") {
        const due = getDueCharacters(stats);
        const nonDue = HANZI_DATA.filter(item => !due.some(d => d.char === item.char));
        pool = [...shuffle(due), ...shuffle(nonDue)];
    } else {
        pool = HANZI_DATA.filter(item => item.category === selectedCategory);
    }

    const count = Math.min(requestedCount, pool.length);

    return shuffle(pool).slice(0, count);
}

function startSession(customItems = null) {
    const items = customItems || createSession();
    if (!items || items.length === 0) return;

    state.mode = "dictation";
    state.session = shuffle(items);
    state.currentIndex = 0;
    state.writings = [];
    state.answers = [];
    state.speechRate = Number(els.speechRate.value);
    state.speechMode = els.speechMode.value;

    showScreen("dictation");
    renderQuestion();

    setTimeout(() => speakCurrent(), 350);
}

function renderQuestion() {
    const item = state.session[state.currentIndex];
    if (!item) return;

    clearAnswerStroke();
    els.speakBtn.closest(".listen-area").classList.remove("hidden");
    els.currentNumber.textContent = state.currentIndex + 1;
    els.totalNumber.textContent = state.session.length;
    els.dictationStageLabel.textContent = "听写";
    els.progressBar.style.width =
        `${((state.currentIndex + 1) / state.session.length) * 100}%`;
    els.questionPinyin.textContent = PINYIN_MAP[item.char] || "";

    updateLevelBadge(els.dictationLevelBadge, item.char);

    els.answerPanel.classList.add("hidden");
    els.showAnswerBtn.classList.remove("hidden");
    els.showAnswerBtn.textContent = "✨ 写好了，核对本题";
    els.writingArea.classList.remove("hidden");
    els.answerHint.textContent = "";
    els.currentWritingPreview.removeAttribute("src");
    els.currentWritingPreview.classList.add("hidden");
    resetWriting();
}

function resizeWritingCanvas() {
    const rect = els.writingBoard.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    els.writingCanvas.width = Math.round(rect.width * ratio);
    els.writingCanvas.height = Math.round(rect.height * ratio);
    const context = els.writingCanvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    redrawWriting();
}

function redrawWriting() {
    const context = els.writingCanvas.getContext("2d");
    const rect = els.writingCanvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#1e293b";
    context.lineCap = "round";
    context.lineJoin = "round";

    state.strokes.forEach(stroke => {
        if (stroke.length === 0) return;
        context.beginPath();
        context.moveTo(stroke[0].x, stroke[0].y);
        stroke.slice(1).forEach(point => context.lineTo(point.x, point.y));
        if (stroke.length === 1) context.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
        context.lineWidth = stroke[0].width;
        context.stroke();
    });
}

function getWritingPoint(event) {
    const rect = els.writingCanvas.getBoundingClientRect();
    const pressure = event.pressure > 0 ? event.pressure : 0.5;
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: 6 + pressure * 6
    };
}

function beginStroke(event) {
    if (!els.answerPanel.classList.contains("hidden")) return;
    event.preventDefault();
    els.writingCanvas.setPointerCapture(event.pointerId);
    state.activeStroke = [getWritingPoint(event)];
    state.strokes.push(state.activeStroke);
    redrawWriting();
}

function continueStroke(event) {
    if (!state.activeStroke) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.() || [event];
    events.forEach(pointEvent => state.activeStroke.push(getWritingPoint(pointEvent)));
    redrawWriting();
}

function endStroke(event) {
    if (!state.activeStroke) return;
    event.preventDefault();
    state.activeStroke = null;
}

function resetWriting() {
    state.strokes = [];
    state.activeStroke = null;
    state.currentWriting = "";
    requestAnimationFrame(resizeWritingCanvas);
}

function undoStroke() {
    if (!els.answerPanel.classList.contains("hidden")) return;
    state.strokes.pop();
    redrawWriting();
}

function captureWriting() {
    state.currentWriting = state.strokes.length > 0
        ? els.writingCanvas.toDataURL("image/png")
        : "";
    return state.currentWriting;
}

function getChineseVoice() {
    const voices = window.speechSynthesis?.getVoices?.() || [];

    return (
        voices.find(voice => /^zh-CN/i.test(voice.lang)) ||
        voices.find(voice => /^zh/i.test(voice.lang)) ||
        voices[0] ||
        null
    );
}

function speakCurrent() {
    const item = state.session[state.currentIndex];

    if (!item || !("speechSynthesis" in window)) {
        alert("当前浏览器不支持语音朗读。建议使用 Chrome、Edge、Safari 或手机自带浏览器。");
        return;
    }

    window.speechSynthesis.cancel();

    let text;
    if (state.speechMode === "char") {
        text = item.char;
    } else if (state.speechMode === "twice") {
        text = `${item.char}。${item.char}。`;
    } else {
        text = `${item.char}。${item.hint}。`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = state.speechRate;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;

    utterance.onerror = event => {
        console.warn("语音播放失败：", event.error);
    };

    window.speechSynthesis.speak(utterance);
}

function submitWriting() {
    const writing = captureWriting();
    state.writings[state.currentIndex] = writing;
    renderReview();
}

function clearAnswerStroke() {
    state.answerStrokeRenderToken += 1;
    state.answerStrokeWriter?.pauseAnimation?.();
    state.answerStrokeWriter = null;
    els.answerStrokeWriter.replaceChildren();
    els.replayAnswerStrokeBtn.disabled = true;
    els.answerStrokeStatus.textContent = "正在准备笔画演示……";
    els.answerStrokeStatus.classList.remove("hidden");
}

function renderAnswerStroke(char) {
    clearAnswerStroke();

    if (typeof HanziWriter === "undefined") {
        els.answerStrokeStatus.textContent = "笔画组件加载失败，请检查网络后刷新页面。";
        return;
    }

    const renderToken = ++state.answerStrokeRenderToken;
    const size = Math.round(els.answerStrokeWriter.getBoundingClientRect().width);

    state.answerStrokeWriter = HanziWriter.create(els.answerStrokeWriter, char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.08),
        showOutline: true,
        showCharacter: false,
        strokeColor: "#1e293b",
        outlineColor: "#d7dbe3",
        strokeAnimationSpeed: 0.8,
        delayBetweenStrokes: 400,
        delayBetweenLoops: 2000,
        onLoadCharDataSuccess: () => {
            if (renderToken !== state.answerStrokeRenderToken) return;
            els.answerStrokeStatus.classList.add("hidden");
            els.replayAnswerStrokeBtn.disabled = false;
            state.answerStrokeWriter.loopCharacterAnimation();
        },
        onLoadCharDataError: () => {
            if (renderToken !== state.answerStrokeRenderToken) return;
            els.answerStrokeStatus.textContent = `暂时无法加载“${char}”的笔画数据。`;
        }
    });
}

function replayAnswerStroke() {
    if (!state.answerStrokeWriter) return;
    state.answerStrokeWriter.cancelQuiz?.();
    state.answerStrokeWriter.loopCharacterAnimation();
}

function renderReview() {
    window.speechSynthesis?.cancel?.();
    const item = state.session[state.currentIndex];
    const writing = state.writings[state.currentIndex];
    els.dictationStageLabel.textContent = "判断";
    els.currentNumber.textContent = state.currentIndex + 1;
    els.totalNumber.textContent = state.session.length;
    els.progressBar.style.width =
        `${((state.currentIndex + 1) / state.session.length) * 100}%`;
    els.questionPinyin.textContent = PINYIN_MAP[item.char] || "";
    if (writing) {
        els.currentWritingPreview.src = writing;
        els.currentWritingPreview.alt = `手写的“${item.char}”`;
        els.currentWritingPreview.classList.remove("hidden");
    } else {
        els.currentWritingPreview.removeAttribute("src");
        els.currentWritingPreview.alt = "本题没有手写内容";
        els.currentWritingPreview.classList.add("hidden");
    }
    const pinyin = PINYIN_MAP[item.char] || "";
    els.answerHint.textContent = `${pinyin} · ${item.hint}`;

    // 艾宾浩斯排期预测提示
    const stats = loadStats();
    const cs = getCharStats(stats, item.char);
    const curLevel = cs.level || 0;
    const nextDays = getNextReviewDays(curLevel + 1);
    if (els.dictationEbPredictText) {
        els.dictationEbPredictText.textContent = `✅ 写对了将升至 Lv.${curLevel + 1}（${nextDays}复习） · ❌ 记错了重置为 Lv.0 并本轮追加重练`;
    }

    els.answerPanel.classList.remove("hidden");
    els.showAnswerBtn.classList.add("hidden");
    els.writingArea.classList.add("hidden");
    els.speakBtn.closest(".listen-area").classList.add("hidden");
    renderAnswerStroke(item.char);
}

function recordAnswer(isCorrect) {
    const item = state.session[state.currentIndex];

    state.answers.push({
        item,
        isCorrect,
        writing: state.writings[state.currentIndex]
    });

    updateStatsForAnswer(item, isCorrect);

    // 回答错误追加到本轮末尾重练，巩固记忆
    if (!isCorrect) {
        state.session.push(item);
    }

    if (state.currentIndex < state.session.length - 1) {
        state.currentIndex += 1;
        renderQuestion();
        setTimeout(() => speakCurrent(), 260);
    } else {
        finishSession();
    }
}


function startRecognition(customItems = null) {
    const items = customItems || createSession();
    if (!items || items.length === 0) return;

    state.mode = "recognition";
    state.recognitionSession = shuffle(items);
    state.recognitionIndex = 0;
    state.recognitionAnswers = [];
    state.speechRate = Number(els.speechRate.value);
    state.speechMode = els.speechMode.value;

    showScreen("recognition");
    renderRecognitionQuestion();
}

function renderRecognitionQuestion() {
    const item = state.recognitionSession[state.recognitionIndex];
    if (!item) return;

    els.recognitionCurrentNumber.textContent = state.recognitionIndex + 1;
    els.recognitionTotalNumber.textContent = state.recognitionSession.length;
    els.recognitionProgressBar.style.width =
        `${((state.recognitionIndex + 1) / state.recognitionSession.length) * 100}%`;

    els.recognitionChar.textContent = item.char;
    els.recognitionTapTip.textContent = "🔊 点一下听读音";
    els.recognitionPinyin.textContent = "";
    els.recognitionHint.textContent = "";

    updateLevelBadge(els.recognitionLevelBadge, item.char);

    const stats = loadStats();
    const cs = getCharStats(stats, item.char);
    const curLevel = cs.level || 0;
    const nextDays = getNextReviewDays(curLevel + 1);
    if (els.recognitionEbPredictText) {
        els.recognitionEbPredictText.textContent = `✅ 读对了将升至 Lv.${curLevel + 1}（${nextDays}复习） · ❌ 没读出重置为 Lv.0 并本轮追加重练`;
    }

    els.recognitionReveal.classList.add("hidden");
}

function speakRecognitionCurrent() {
    const item = state.recognitionSession[state.recognitionIndex];

    if (!item || !("speechSynthesis" in window)) {
        alert("当前浏览器不支持语音朗读。建议使用 Chrome、Edge、Safari 或手机自带浏览器。");
        return;
    }

    window.speechSynthesis.cancel();

    let text;
    if (state.speechMode === "char") {
        text = item.char;
    } else if (state.speechMode === "twice") {
        text = `${item.char}。${item.char}。`;
    } else {
        text = `${item.char}。${item.hint}。`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = state.speechRate;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;

    utterance.onerror = event => {
        console.warn("语音播放失败：", event.error);
    };

    window.speechSynthesis.speak(utterance);

    els.recognitionPinyin.textContent = PINYIN_MAP[item.char] || "";
    els.recognitionHint.textContent = item.hint;
    els.recognitionTapTip.textContent = "🔊 再点可以重听";
    els.recognitionReveal.classList.remove("hidden");
}

function recordRecognitionAnswer(isCorrect) {
    const item = state.recognitionSession[state.recognitionIndex];

    state.recognitionAnswers.push({
        item,
        isCorrect
    });

    updateStatsForAnswer(item, isCorrect);

    if (!isCorrect) {
        state.recognitionSession.push(item);
    }

    if (state.recognitionIndex < state.recognitionSession.length - 1) {
        state.recognitionIndex += 1;
        renderRecognitionQuestion();
    } else {
        finishRecognition();
    }
}

function finishRecognition() {
    window.speechSynthesis?.cancel?.();

    const correctCount =
        state.recognitionAnswers.filter(answer => answer.isCorrect).length;
    const total = state.recognitionAnswers.length;
    const percentage =
        total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const unfamiliarAnswers =
        state.recognitionAnswers.filter(answer => !answer.isCorrect);

    els.scoreText.textContent = `${percentage}%`;
    els.scoreRing.style.background =
        `conic-gradient(var(--primary) ${percentage}%, #e7ebf3 ${percentage}%)`;

    let message;
    if (percentage === 100) {
        message = `太棒了！这 ${total} 个字都会读！`;
    } else if (percentage >= 80) {
        message = `认读得很好！会读 ${correctCount} 个，再练一下不熟悉的字。`;
    } else if (percentage >= 60) {
        message = `已经会读 ${correctCount} 个。点击下面的按钮，可以再练不会的字。`;
    } else {
        message = `今天认识了更多汉字。多看几遍、多听几遍，很快就会读了。`;
    }

    els.summaryMessage.textContent = message;
    els.resultList.innerHTML = "";
    els.resultList.classList.remove("dictation-results");

    const stats = loadStats();
    state.recognitionAnswers.forEach(answer => {
        const chip = document.createElement("span");
        chip.className = `result-chip ${answer.isCorrect ? "correct" : "wrong"}`;
        const cs = getCharStats(stats, answer.item.char);
        chip.textContent = `${answer.item.char} (Lv.${cs.level})`;
        chip.title = `${answer.isCorrect ? "会读" : "还不会读"} · 当前 Lv.${cs.level}，下次复习: ${formatDateDisplay(cs.nextReviewDate)}`;
        els.resultList.appendChild(chip);
    });

    els.practiceWrongBtn.disabled = unfamiliarAnswers.length === 0;
    els.practiceWrongBtn.textContent =
        unfamiliarAnswers.length === 0
            ? "本轮全部会读"
            : `再练不会的字（${unfamiliarAnswers.length}个）`;

    if (els.continueDueBtn) {
        const dueCount = getDueCharacters(stats).length;
        if (dueCount > 0) {
            els.continueDueBtn.classList.remove("hidden");
            els.continueDueBtn.textContent = `⚡ 继续复习今日待复习汉字（还剩 ${dueCount} 个）`;
        } else {
            els.continueDueBtn.classList.add("hidden");
        }
    }

    showScreen("summary");
    refreshHomeStats();
}

function getChoiceOptions(item) {
    const sameCategory = shuffle(HANZI_DATA.filter(candidate =>
        candidate.char !== item.char && candidate.category === item.category
    ));
    const otherItems = shuffle(HANZI_DATA.filter(candidate =>
        candidate.char !== item.char && candidate.category !== item.category
    ));
    return shuffle([item, ...sameCategory, ...otherItems].slice(0, 3));
}

function startChoice(customItems = null) {
    const items = customItems || createSession();
    if (!items || items.length === 0) return;

    state.mode = "choice";
    state.choiceSession = shuffle(items);
    state.choiceIndex = 0;
    state.choiceAnswers = [];
    state.speechRate = Number(els.speechRate.value);
    showScreen("choice");
    renderChoiceQuestion();
}

function renderChoiceQuestion() {
    const item = state.choiceSession[state.choiceIndex];
    if (!item) return;

    state.choiceHadMistake = false;
    state.choiceLocked = false;
    if (els.choiceCurrentNumber) els.choiceCurrentNumber.textContent = state.choiceIndex + 1;
    if (els.choiceTotalNumber) els.choiceTotalNumber.textContent = state.choiceSession.length;
    if (els.choiceProgressBar) {
        els.choiceProgressBar.style.width =
            `${((state.choiceIndex + 1) / state.choiceSession.length) * 100}%`;
    }
    if (els.choiceLevelBadge) {
        updateLevelBadge(els.choiceLevelBadge, item.char);
    }
    els.choiceFeedback?.classList.add("hidden");
    if (els.choiceOptions) {
        els.choiceOptions.innerHTML = "";
        getChoiceOptions(item).forEach(option => {
            const button = document.createElement("button");
            button.className = "choice-option";
            button.textContent = option.char;
            button.setAttribute("aria-label", `选择汉字${option.char}`);
            button.addEventListener("click", () => chooseCharacter(option, button));
            els.choiceOptions.appendChild(button);
        });
    }

    setTimeout(speakChoiceCurrent, 300);
}

function speakChoiceCurrent() {
    const item = state.choiceSession[state.choiceIndex];
    if (!item || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${item.char}。${item.hint}。`);
    utterance.lang = "zh-CN";
    utterance.rate = state.speechRate;
    utterance.pitch = 1.02;
    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
}

function playErrorSound() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + 0.01;
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(260, startAt);
        oscillator.frequency.setValueAtTime(180, startAt + 0.14);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.48, startAt + 0.015);
        gain.gain.setValueAtTime(0.48, startAt + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
        oscillator.connect(gain).connect(context.destination);
        context.resume?.();
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.31);
        oscillator.addEventListener("ended", () => context.close());
    } catch (error) {
        console.warn("提示音播放失败：", error);
    }
}

function chooseCharacter(option, button) {
    if (state.choiceLocked) return;
    const item = state.choiceSession[state.choiceIndex];

    if (option.char !== item.char) {
        if (!state.choiceHadMistake) {
            state.choiceSession.push(item);
        }
        state.choiceHadMistake = true;
        button.classList.add("wrong-choice");
        button.setAttribute("aria-label", `选择汉字${option.char}，回答错误`);
        button.disabled = true;
        playErrorSound();
        return;
    }

    state.choiceLocked = true;
    button.classList.add("correct-choice");
    els.choiceOptions?.querySelectorAll("button").forEach(node => {
        node.disabled = true;
    });
    els.choiceFeedback?.classList.remove("hidden");
    const isFirstTryCorrect = !state.choiceHadMistake;
    state.choiceAnswers.push({item, isCorrect: isFirstTryCorrect});
    updateStatsForAnswer(item, isFirstTryCorrect);
}

function nextChoiceQuestion() {
    if (!state.choiceLocked) return;
    if (state.choiceIndex < state.choiceSession.length - 1) {
        state.choiceIndex += 1;
        renderChoiceQuestion();
    } else {
        finishChoice();
    }
}

function finishChoice() {
    window.speechSynthesis?.cancel?.();
    const correctCount = state.choiceAnswers.filter(answer => answer.isCorrect).length;
    const total = state.choiceAnswers.length;
    const percentage = total ? Math.round(correctCount / total * 100) : 0;
    const wrongAnswers = state.choiceAnswers.filter(answer => !answer.isCorrect);
    els.scoreText.textContent = `${percentage}%`;
    els.scoreRing.style.background =
        `conic-gradient(var(--primary) ${percentage}%, #e7ebf3 ${percentage}%)`;
    els.summaryMessage.textContent = percentage === 100
        ? `太棒了！${total} 个字全部一次选对！`
        : `完成啦！有 ${correctCount} 个字一次选对，没选对的再听听就会了。`;
    els.resultList.innerHTML = "";
    els.resultList.classList.remove("dictation-results");
    const stats = loadStats();
    state.choiceAnswers.forEach(answer => {
        const chip = document.createElement("span");
        chip.className = `result-chip ${answer.isCorrect ? "correct" : "wrong"}`;
        const cs = getCharStats(stats, answer.item.char);
        chip.textContent = `${answer.item.char} (Lv.${cs.level})`;
        chip.title = `${answer.isCorrect ? "一次选对" : "再次尝试后选对"} · 当前 Lv.${cs.level}，下次复习: ${formatDateDisplay(cs.nextReviewDate)}`;
        els.resultList.appendChild(chip);
    });
    els.practiceWrongBtn.disabled = wrongAnswers.length === 0;
    els.practiceWrongBtn.textContent = wrongAnswers.length
        ? `再练本轮易错字（${wrongAnswers.length}个）`
        : "本轮全部一次选对";

    if (els.continueDueBtn) {
        const dueCount = getDueCharacters(stats).length;
        if (dueCount > 0) {
            els.continueDueBtn.classList.remove("hidden");
            els.continueDueBtn.textContent = `⚡ 继续复习今日待复习汉字（还剩 ${dueCount} 个）`;
        } else {
            els.continueDueBtn.classList.add("hidden");
        }
    }

    showScreen("summary");
    refreshHomeStats();
}

function finishSession() {
    window.speechSynthesis?.cancel?.();
    clearAnswerStroke();

    const correctCount = state.answers.filter(answer => answer.isCorrect).length;
    const total = state.answers.length;
    const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const wrongAnswers = state.answers.filter(answer => !answer.isCorrect);

    state.mode = "dictation";
    els.scoreText.textContent = `${percentage}%`;
    els.scoreRing.style.background =
        `conic-gradient(var(--primary) ${percentage}%, #e7ebf3 ${percentage}%)`;

    let message;
    if (percentage === 100) {
        message = `太棒了！今天 ${total} 个字全部写对了！`;
    } else if (percentage >= 80) {
        message = `表现很好！写对了 ${correctCount} 个，再复习一下错字就更棒了。`;
    } else if (percentage >= 60) {
        message = `已经写对了 ${correctCount} 个。慢慢来，错字多练几次就会记住。`;
    } else {
        message = `今天完成了 ${total} 个字的练习。先把错字再听一遍，不着急。`;
    }

    els.summaryMessage.textContent = message;
    els.resultList.innerHTML = "";

    els.resultList.classList.add("dictation-results");

    const stats = loadStats();
    state.answers.forEach(answer => {
        const card = document.createElement("div");
        card.className = `dictation-result ${answer.isCorrect ? "correct" : "wrong"}`;

        const comparison = document.createElement("div");
        comparison.className = "comparison";

        const writtenBox = document.createElement("div");
        writtenBox.className = "comparison-box";
        const writtenLabel = document.createElement("strong");
        writtenLabel.textContent = "孩子写的";
        writtenBox.appendChild(writtenLabel);
        if (answer.writing) {
            const image = document.createElement("img");
            image.className = "written-preview";
            image.src = answer.writing;
            image.alt = `手写的“${answer.item.char}”`;
            writtenBox.appendChild(image);
        } else {
            const empty = document.createElement("div");
            empty.className = "result-standard";
            empty.textContent = "未写";
            writtenBox.appendChild(empty);
        }

        const standardBox = document.createElement("div");
        standardBox.className = "comparison-box";
        const standardLabel = document.createElement("strong");
        standardLabel.textContent = "正确答案";
        const standard = document.createElement("div");
        standard.className = "result-standard";
        standard.textContent = answer.item.char;
        standardBox.append(standardLabel, standard);

        comparison.append(writtenBox, standardBox);
        const verdict = document.createElement("div");
        verdict.className = "result-verdict";
        const cs = getCharStats(stats, answer.item.char);
        const reviewText = cs.nextReviewDate ? formatDateDisplay(cs.nextReviewDate) : "待定";
        verdict.innerHTML = `<span>${answer.isCorrect ? "✅ 写对了" : "❌ 写错了"}</span> <span class="level-badge ${cs.level >= 3 ? "level-mastered" : (cs.nextReviewDate <= Date.now() ? "level-due" : "")}" style="margin-left: 8px;">Lv.${cs.level}</span><span style="font-size: 0.82rem; color: #64748b; margin-left: 6px;">下次: ${reviewText}</span>`;
        card.append(comparison, verdict);
        els.resultList.appendChild(card);
    });

    els.practiceWrongBtn.disabled = wrongAnswers.length === 0;
    els.practiceWrongBtn.textContent =
        wrongAnswers.length === 0
            ? "本轮没有错字"
            : `再练本轮错字（${wrongAnswers.length}个）`;

    if (els.continueDueBtn) {
        const dueCount = getDueCharacters(stats).length;
        if (dueCount > 0) {
            els.continueDueBtn.classList.remove("hidden");
            els.continueDueBtn.textContent = `⚡ 继续复习今日待复习汉字（还剩 ${dueCount} 个）`;
        } else {
            els.continueDueBtn.classList.add("hidden");
        }
    }

    showScreen("summary");
    refreshHomeStats();
}

function showScreen(name) {
    els.setupScreen?.classList.toggle("hidden", name !== "setup");
    els.dictationScreen?.classList.toggle("hidden", name !== "dictation");
    els.recognitionScreen?.classList.toggle("hidden", name !== "recognition");
    els.choiceScreen?.classList.toggle("hidden", name !== "choice");
    els.storyScreen?.classList.toggle("hidden", name !== "story");
    els.strokeScreen?.classList.toggle("hidden", name !== "stroke");
    els.summaryScreen?.classList.toggle("hidden", name !== "summary");

    const bottomNav = document.getElementById("hanziBottomNav");
    if (bottomNav) {
        bottomNav.classList.toggle("hidden", name !== "setup");
    }
    window.scrollTo({top: 0, behavior: "smooth"});
}

function getCachedStrokeOrder() {
    try {
        const cache = JSON.parse(localStorage.getItem(STROKE_ORDER_KEY));
        const sourceChars = HANZI_DATA.map(item => item.char);
        if (
            cache?.source === sourceChars.join("") &&
            Array.isArray(cache.characters) &&
            cache.characters.length === sourceChars.length
        ) {
            const itemByChar = new Map(HANZI_DATA.map(item => [item.char, item]));
            return cache.characters.map(char => itemByChar.get(char)).filter(Boolean);
        }
    } catch (error) {
        console.warn("读取笔画顺序缓存失败：", error);
    }
    return null;
}

async function createStrokeSession() {
    const cachedItems = getCachedStrokeOrder();
    if (cachedItems) return cachedItems;

    const itemsWithCounts = await Promise.all(HANZI_DATA.map(async (item, sourceIndex) => {
        try {
            const characterData = await HanziWriter.loadCharacterData(item.char);
            return {item, sourceIndex, strokeCount: characterData.strokes.length};
        } catch (error) {
            console.warn(`无法读取“${item.char}”的笔画数：`, error);
            return {item, sourceIndex, strokeCount: Number.MAX_SAFE_INTEGER};
        }
    }));

    itemsWithCounts.sort((a, b) =>
        a.strokeCount - b.strokeCount || a.sourceIndex - b.sourceIndex
    );
    const items = itemsWithCounts.map(entry => entry.item);

    const allCountsLoaded = itemsWithCounts.every(
        entry => entry.strokeCount !== Number.MAX_SAFE_INTEGER
    );
    if (allCountsLoaded) {
        try {
            localStorage.setItem(STROKE_ORDER_KEY, JSON.stringify({
                source: HANZI_DATA.map(item => item.char).join(""),
                characters: items.map(item => item.char)
            }));
        } catch (error) {
            console.warn("保存笔画顺序缓存失败：", error);
        }
    }

    return items;
}

async function startStrokePractice() {
    const startToken = ++state.strokeStartToken;
    showScreen("stroke");
    els.strokeCurrentNumber.textContent = "…";
    els.strokeTotalNumber.textContent = HANZI_DATA.length;
    els.strokeProgressBar.style.width = "0%";
    els.strokePinyin.textContent = "";
    els.strokeHint.textContent = "";
    els.strokeWriter.replaceChildren();
    els.strokeStatus.textContent = "正在按笔画数从少到多排序……";
    els.strokeStatus.classList.remove("hidden");
    els.previousStrokeBtn.disabled = true;
    els.nextStrokeBtn.disabled = true;

    if (typeof HanziWriter === "undefined") {
        els.strokeStatus.textContent = "笔画组件加载失败，请检查网络后刷新页面。";
        return;
    }

    const items = await createStrokeSession();
    if (startToken !== state.strokeStartToken) return;

    state.strokeSession = items;
    let savedChar = "";
    try {
        savedChar = localStorage.getItem(STROKE_PROGRESS_KEY) || "";
    } catch (error) {
        console.warn("读取笔画学习进度失败：", error);
    }
    const savedIndex = items.findIndex(item => item.char === savedChar);
    state.strokeIndex = savedIndex >= 0 ? savedIndex : 0;
    renderStrokeCharacter();
}

function renderStrokeCharacter() {
    const item = state.strokeSession[state.strokeIndex];
    if (!item) return;

    const renderToken = ++state.strokeRenderToken;
    state.strokeWriter?.pauseAnimation?.();
    state.strokeWriter = null;
    els.strokeWriter.replaceChildren();
    els.strokeStatus.textContent = "正在准备笔画动画……";
    els.strokeStatus.classList.remove("hidden");

    els.strokeCurrentNumber.textContent = state.strokeIndex + 1;
    els.strokeTotalNumber.textContent = state.strokeSession.length;
    els.strokeProgressBar.style.width =
        `${((state.strokeIndex + 1) / state.strokeSession.length) * 100}%`;
    els.strokePinyin.textContent = PINYIN_MAP[item.char] || "";
    els.strokeHint.textContent = `${item.char} · ${item.hint}`;
    els.previousStrokeBtn.disabled = state.strokeIndex === 0;
    els.nextStrokeBtn.disabled = false;
    els.nextStrokeBtn.textContent = state.strokeIndex === state.strokeSession.length - 1
        ? "回到第一字 ↺"
        : "下一字 →";
    speakStrokeCharacter(item.char);

    if (typeof HanziWriter === "undefined") {
        els.strokeStatus.textContent = "笔画组件加载失败，请检查网络后刷新页面。";
        return;
    }

    const size = Math.round(els.strokeGrid.getBoundingClientRect().width);
    state.strokeWriter = HanziWriter.create(els.strokeWriter, item.char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.09),
        showOutline: true,
        showCharacter: false,
        strokeColor: "#20242c",
        outlineColor: "#d7dbe3",
        strokeAnimationSpeed: 0.65,
        delayBetweenStrokes: 650,
        delayBetweenLoops: 1800,
        onLoadCharDataSuccess: () => {
            if (renderToken !== state.strokeRenderToken) return;
            els.strokeStatus.classList.add("hidden");
            state.strokeWriter.loopCharacterAnimation();
        },
        onLoadCharDataError: () => {
            if (renderToken !== state.strokeRenderToken) return;
            els.strokeStatus.textContent = `暂时无法加载“${item.char}”的笔画数据。`;
        }
    });
    try {
        localStorage.setItem(STROKE_PROGRESS_KEY, item.char);
    } catch (error) {
        console.warn("保存笔画学习进度失败：", error);
    }
}

function speakStrokeCharacter(char) {
    if (!char || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(char);
    utterance.lang = "zh-CN";
    utterance.rate = Number(els.speechRate.value) || 0.78;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;
    utterance.onerror = event => {
        console.warn("笔画练习读音失败：", event.error);
    };
    window.speechSynthesis.speak(utterance);
}

function showPreviousStrokeCharacter() {
    if (state.strokeIndex === 0) return;
    state.strokeIndex -= 1;
    renderStrokeCharacter();
}

function showNextStrokeCharacter() {
    state.strokeIndex = state.strokeIndex === state.strokeSession.length - 1
        ? 0
        : state.strokeIndex + 1;
    renderStrokeCharacter();
}

function quitStrokePractice() {
    state.strokeStartToken += 1;
    state.strokeRenderToken += 1;
    state.strokeWriter?.pauseAnimation?.();
    state.strokeWriter = null;
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
}

function makeRandomStory() {
    let story = "";
    let attempts = 0;

    do {
        story = STORY_SENTENCES[Math.floor(Math.random() * STORY_SENTENCES.length)];
        attempts += 1;
    } while (story === state.currentStory && attempts < 5);

    return story;
}

function renderRandomStory() {
    window.speechSynthesis?.cancel?.();
    state.currentStory = makeRandomStory();
    els.storyText.textContent = state.currentStory;
    els.storyPinyin.textContent = Array.from(state.currentStory)
        .map(char => PINYIN_MAP[char] || char)
        .join(" ");
    els.storyPinyin.classList.add("hidden");
    els.storyPinyinBtn.textContent = "显示拼音";
}

function startStory() {
    renderRandomStory();
    showScreen("story");
}

function toggleStoryPinyin() {
    const willShow = els.storyPinyin.classList.contains("hidden");
    els.storyPinyin.classList.toggle("hidden", !willShow);
    els.storyPinyinBtn.textContent = willShow ? "隐藏拼音" : "显示拼音";
}

function speakStory() {
    if (!("speechSynthesis" in window)) {
        alert("当前浏览器不支持语音朗读。建议使用 Chrome、Edge、Safari 或手机自带浏览器。");
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(state.currentStory);
    utterance.lang = "zh-CN";
    utterance.rate = Number(els.speechRate.value) || 0.78;
    utterance.pitch = 1.02;
    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
}

function quitSession() {
    const confirmed = confirm("确定要退出本轮听写吗？已经判定过的题目会保留记录。");
    if (!confirmed) return;

    window.speechSynthesis?.cancel?.();
    clearAnswerStroke();
    showScreen("setup");
    refreshHomeStats();
}


function quitRecognition() {
    const confirmed = confirm("确定要退出本轮认读练习吗？");
    if (!confirmed) return;

    window.speechSynthesis?.cancel?.();
    showScreen("setup");
    refreshHomeStats();
}

function quitChoice() {
    if (!confirm("确定要退出本轮选字游戏吗？")) return;
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
    refreshHomeStats();
}

function resetAllData() {
    const confirmed = confirm(
        "确定要清空全部学习记录吗？错字本和累计成绩都会被删除，此操作不能恢复。"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STROKE_PROGRESS_KEY);
    refreshHomeStats();
    triggerAutoSync();
    alert("学习记录已经清空。");
}

els.startBtn.addEventListener("click", () => startSession());
els.recognitionStartBtn.addEventListener("click", () => startRecognition());
els.choiceStartBtn.addEventListener("click", () => startChoice());
els.storyStartBtn.addEventListener("click", startStory);
els.strokeStartBtn.addEventListener("click", startStrokePractice);

els.speakBtn.addEventListener("click", speakCurrent);
els.writingCanvas.addEventListener("pointerdown", beginStroke);
els.writingCanvas.addEventListener("pointermove", continueStroke);
els.writingCanvas.addEventListener("pointerup", endStroke);
els.writingCanvas.addEventListener("pointercancel", endStroke);
els.undoStrokeBtn.addEventListener("click", undoStroke);
els.clearWritingBtn.addEventListener("click", resetWriting);
window.addEventListener("resize", resizeWritingCanvas);
els.showAnswerBtn.addEventListener("click", submitWriting);
els.replayAnswerStrokeBtn.addEventListener("click", replayAnswerStroke);
els.correctBtn.addEventListener("click", () => recordAnswer(true));
els.wrongBtn.addEventListener("click", () => recordAnswer(false));
els.quitBtn.addEventListener("click", quitSession);

els.recognitionCharBtn.addEventListener("click", speakRecognitionCurrent);
els.recognitionReplayBtn.addEventListener("click", speakRecognitionCurrent);
els.recognitionCorrectBtn.addEventListener(
    "click",
    () => recordRecognitionAnswer(true)
);
els.recognitionWrongBtn.addEventListener(
    "click",
    () => recordRecognitionAnswer(false)
);
els.quitRecognitionBtn.addEventListener("click", quitRecognition);
els.choiceSpeakBtn.addEventListener("click", speakChoiceCurrent);
els.choiceFeedback.addEventListener("click", nextChoiceQuestion);
els.quitChoiceBtn.addEventListener("click", quitChoice);
els.storyPinyinBtn.addEventListener("click", toggleStoryPinyin);
els.storySpeakBtn.addEventListener("click", speakStory);
els.storyNextBtn.addEventListener("click", renderRandomStory);
els.quitStoryBtn.addEventListener("click", () => {
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
});
els.previousStrokeBtn.addEventListener("click", showPreviousStrokeCharacter);
els.nextStrokeBtn.addEventListener("click", showNextStrokeCharacter);
els.quitStrokeBtn.addEventListener("click", quitStrokePractice);

els.backHomeBtn.addEventListener("click", () => {
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
    refreshHomeStats();
});

els.practiceWrongBtn.addEventListener("click", () => {
    if (state.mode === "recognition") {
        const unfamiliarItems = state.recognitionAnswers
            .filter(answer => !answer.isCorrect)
            .map(answer => answer.item);

        if (unfamiliarItems.length > 0) {
            startRecognition(unfamiliarItems);
        }
        return;
    }

    if (state.mode === "choice") {
        const wrongItems = state.choiceAnswers
            .filter(answer => !answer.isCorrect)
            .map(answer => answer.item);
        if (wrongItems.length > 0) startChoice(wrongItems);
        return;
    }

    const wrongItems = state.answers
        .filter(answer => !answer.isCorrect)
        .map(answer => answer.item);

    if (wrongItems.length > 0) {
        startSession(wrongItems);
    }
});

if (els.quickDueBtn) {
    els.quickDueBtn.addEventListener("click", () => {
        if (els.categorySelect) {
            els.categorySelect.value = "due";
        }
        startSession();
    });
}

if (els.continueDueBtn) {
    els.continueDueBtn.addEventListener("click", () => {
        if (els.categorySelect) {
            els.categorySelect.value = "due";
        }
        if (state.mode === "recognition") {
            startRecognition();
        } else if (state.mode === "choice") {
            startChoice();
        } else {
            startSession();
        }
    });
}

els.resetDataBtn.addEventListener("click", resetAllData);

if (els.openSettingsBtn) {
    els.openSettingsBtn.addEventListener("click", openSettingsModal);
}
if (els.closeSettingsBtn) {
    els.closeSettingsBtn.addEventListener("click", closeSettingsModal);
}
if (els.confirmSettingsBtn) {
    els.confirmSettingsBtn.addEventListener("click", closeSettingsModal);
}
if (els.modalBackdrop) {
    els.modalBackdrop.addEventListener("click", closeSettingsModal);
}
if (els.speechMode) {
    els.speechMode.addEventListener("change", saveSpeechSettings);
}
if (els.speechRate) {
    els.speechRate.addEventListener("change", saveSpeechSettings);
}
if (els.testSpeechBtn) {
    els.testSpeechBtn.addEventListener("click", previewSpeech);
}

if (els.openSyncBtn) {
    els.openSyncBtn.addEventListener("click", openSyncModal);
}
if (els.closeSyncBtn) {
    els.closeSyncBtn.addEventListener("click", closeSyncModal);
}
if (els.confirmSyncBtn) {
    els.confirmSyncBtn.addEventListener("click", closeSyncModal);
}
if (els.syncModalBackdrop) {
    els.syncModalBackdrop.addEventListener("click", closeSyncModal);
}
if (els.pushSyncBtn) {
    els.pushSyncBtn.addEventListener("click", () => pushToCloud(false));
}
if (els.pullSyncBtn) {
    els.pullSyncBtn.addEventListener("click", () => pullFromCloud(false));
}
if (els.syncKeyInput) {
    els.syncKeyInput.addEventListener("change", saveSyncConfigFromUI);
}
if (els.autoSyncCheckbox) {
    els.autoSyncCheckbox.addEventListener("change", saveSyncConfigFromUI);
}

function initSync() {
    loadSyncConfigToUI();
    updateSyncOverviewBadge();
    const key = (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim();
    const autoSync = localStorage.getItem(AUTO_SYNC_STORAGE) === "true";
    if (key && autoSync) {
        pullFromCloud(true);
    }
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (els.syncModal && !els.syncModal.classList.contains("hidden")) {
            closeSyncModal();
            return;
        }
        if (els.settingsModal && !els.settingsModal.classList.contains("hidden")) {
            closeSettingsModal();
            return;
        }
    }

    const dictationActive =
        !els.dictationScreen.classList.contains("hidden");
    const recognitionActive =
        !els.recognitionScreen.classList.contains("hidden");
    const choiceActive = !els.choiceScreen.classList.contains("hidden");
    const storyActive = !els.storyScreen.classList.contains("hidden");
    const strokeActive = !els.strokeScreen.classList.contains("hidden");

    if (!dictationActive && !recognitionActive && !choiceActive && !storyActive && !strokeActive) return;

    if (event.code === "Space" && !strokeActive) {
        event.preventDefault();

        if (dictationActive) {
            speakCurrent();
        } else if (recognitionActive) {
            speakRecognitionCurrent();
        } else if (choiceActive) {
            speakChoiceCurrent();
        } else if (storyActive) {
            speakStory();
        }
    }

    if (dictationActive) {
        if (
            event.key === "Enter" &&
            !els.showAnswerBtn.classList.contains("hidden")
        ) {
            submitWriting();
        }

        if (!els.answerPanel.classList.contains("hidden")) {
            if (event.key === "ArrowLeft") recordAnswer(false);
            if (event.key === "ArrowRight") recordAnswer(true);
        }
    }

    if (
        recognitionActive &&
        !els.recognitionReveal.classList.contains("hidden")
    ) {
        if (event.key === "ArrowLeft") recordRecognitionAnswer(false);
        if (event.key === "ArrowRight") recordRecognitionAnswer(true);
    }

    if (strokeActive) {
        if (event.key === "ArrowLeft") showPreviousStrokeCharacter();
        if (event.key === "ArrowRight") showNextStrokeCharacter();
    }
});

if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

buildCategoryOptions();
refreshHomeStats();
loadSpeechSettings();
initSync();

function switchHomeTab(tabName) {
    const tabPracticeView = document.getElementById("tabPracticeView");
    const tabWrongView = document.getElementById("tabWrongView");
    const tabStatsView = document.getElementById("tabStatsView");
    const navTabPractice = document.getElementById("navTabPractice");
    const navTabWrong = document.getElementById("navTabWrong");
    const navTabStats = document.getElementById("navTabStats");

    if (!tabPracticeView) return;

    tabPracticeView.classList.toggle("hidden", tabName !== "practice");
    tabWrongView?.classList.toggle("hidden", tabName !== "wrong");
    tabStatsView?.classList.toggle("hidden", tabName !== "stats");

    const updateBtn = (btn, isActive) => {
        if (!btn) return;
        btn.className = `flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation relative ${isActive ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}`;
        const icon = btn.querySelector('.text-xl, .text-2xl');
        if (icon) icon.className = `text-xl sm:text-2xl transition-transform ${isActive ? 'scale-110' : 'opacity-75'}`;
        const indicator = btn.querySelector('.nav-indicator');
        if (indicator) indicator.className = `nav-indicator w-6 h-1 rounded-full mt-0.5 ${isActive ? 'bg-indigo-600' : 'bg-transparent'}`;
    };

    updateBtn(navTabPractice, tabName === "practice");
    updateBtn(navTabWrong, tabName === "wrong");
    updateBtn(navTabStats, tabName === "stats");
}

document.getElementById("navTabPractice")?.addEventListener("click", () => switchHomeTab("practice"));
document.getElementById("navTabWrong")?.addEventListener("click", () => switchHomeTab("wrong"));
document.getElementById("navTabStats")?.addEventListener("click", () => switchHomeTab("stats"));

document.getElementById("practiceWrongFromTabBtn")?.addEventListener("click", () => {
    const stats = loadStats();
    const wrongChars = getWrongCharacters(stats);
    if (wrongChars.length === 0) {
        alert("错字本目前为空，太棒啦！");
        return;
    }
    startSession(wrongChars);
});

