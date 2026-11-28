"use strict";

const STORAGE_KEY = "hanziDictationStatsV1";
const SPEECH_SETTINGS_KEY = "hanziSpeechSettingsV1";
const SYNC_KEY_STORAGE = "hanziSyncKeyV1";
const AUTO_SYNC_STORAGE = "hanziAutoSyncV1";
const LAST_SYNC_TIME_KEY = "hanziLastSyncTimeV1";
const STORY_PROGRESS_KEY = "hanziStoryProgressV2";
const WRITE_MODE_KEY = "hanziDictationWriteModeV1";
const OUTLINE_MODE_KEY = "hanziIpadOutlineV1";
const RECENT_NEW_COUNT = 25;

const state = {
    mode: "dictation",
    isWrongPractice: false,
    session: [],
    currentIndex: 0,
    answers: [],
    dictationWriteMode: "ipad", // "ipad" | "paper"
    ipadShowOutline: false,
    ipadStrokeWriter: null,
    ipadStrokeRenderToken: 0,
    ipadCurrentStrokeNum: 0,
    ipadCurrentMistakes: 0,
    ipadClickedHint: false,
    ipadGaveUp: false,
    ipadQuizCompleted: false,
    answerStrokeWriter: null,
    answerStrokeRenderToken: 0,
    choiceSession: [],
    choiceIndex: 0,
    choiceAnswers: [],
    choiceHadMistake: false,
    choiceLocked: false,
    speechRate: 0.78,
    speechMode: "hint",
    currentStory: "",
    storyIndex: 0,
    storyFilter: "all", // "all" | "wrong" | "new"
    storyFilteredIndices: [],
    storyFilteredPos: 0,
    storyDetailChar: "",
    showStoryPinyin: false,
    storySpeakingCharIndex: -1,
    storyCharHighlightTimer: null,
    storyReadToken: 0,
    currentUtterance: null,
    speechToken: 0,
    speakDelayTimer: null,
    speechWatchdogTimer: null,
    sharedTTSAudio: null,
    audioUnlocked: false,
    ttsUnlocked: false,
    wallFilter: "all", // "all" | "new" | "wrong" | "learning" | "mastered"
    wallSelectedChar: "",
    reviewLocked: false,
    reviewUnlockTimer: null,
    questionUnlockTimer: null
};

const els = {
    setupScreen: document.getElementById("setupScreen"),
    dictationScreen: document.getElementById("dictationScreen"),
    choiceScreen: document.getElementById("choiceScreen"),
    storyScreen: document.getElementById("storyScreen"),
    summaryScreen: document.getElementById("summaryScreen"),

    categorySelect: document.getElementById("categorySelect"),
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
    choiceStartBtn: document.getElementById("choiceStartBtn"),
    storyStartBtn: document.getElementById("storyStartBtn"),
    resetDataBtn: document.getElementById("resetDataBtn"),
    totalPracticed: document.getElementById("totalPracticed"),
    wrongCount: document.getElementById("wrongCount"),
    wrongbookSetup: document.getElementById("wrongbookSetup"),
    wrongbookListSetup: document.getElementById("wrongbookListSetup"),
    wrongbookEmptyState: document.getElementById("wrongbookEmptyState"),
    wrongbookActions: document.getElementById("wrongbookActions"),
    wrongTabCountBadge: document.getElementById("wrongTabCountBadge"),
    clearWrongBookBtn: document.getElementById("clearWrongBookBtn"),

    // 听写与笔顺界面
    currentNumber: document.getElementById("currentNumber"),
    totalNumber: document.getElementById("totalNumber"),
    dictationStageLabel: document.getElementById("dictationStageLabel"),
    progressBar: document.getElementById("progressBar"),
    dictationLevelBadge: document.getElementById("dictationLevelBadge"),
    quitBtn: document.getElementById("quitBtn"),
    dictationModeIpadBtn: document.getElementById("dictationModeIpadBtn"),
    dictationModePaperBtn: document.getElementById("dictationModePaperBtn"),
    questionPinyin: document.getElementById("questionPinyin"),
    questionMaskedHint: document.getElementById("questionMaskedHint"),
    speakBtn: document.getElementById("speakBtn"),

    // iPad 笔画手写模式
    ipadWritingPanel: document.getElementById("ipadWritingPanel"),
    ipadOutlineHideBtn: document.getElementById("ipadOutlineHideBtn"),
    ipadOutlineShowBtn: document.getElementById("ipadOutlineShowBtn"),
    ipadHintStrokeBtn: document.getElementById("ipadHintStrokeBtn"),
    ipadResetStrokeBtn: document.getElementById("ipadResetStrokeBtn"),
    dictationStrokeGrid: document.getElementById("dictationStrokeGrid"),
    dictationStrokeWriter: document.getElementById("dictationStrokeWriter"),
    dictationStrokeStatus: document.getElementById("dictationStrokeStatus"),
    dictationStrokeFeedback: document.getElementById("dictationStrokeFeedback"),
    ipadPreCompleteBar: document.getElementById("ipadPreCompleteBar"),
    ipadGiveUpBtn: document.getElementById("ipadGiveUpBtn"),
    ipadAssistActionBar: document.getElementById("ipadAssistActionBar"),
    ipadRetryQuizBtn: document.getElementById("ipadRetryQuizBtn"),
    ipadAssistWrongNextBtn: document.getElementById("ipadAssistWrongNextBtn"),
    ipadCompleteBar: document.getElementById("ipadCompleteBar"),
    ipadCompleteInfo: document.getElementById("ipadCompleteInfo"),
    ipadMarkWrongBtn: document.getElementById("ipadMarkWrongBtn"),
    ipadNextBtn: document.getElementById("ipadNextBtn"),

    // 纸上写 · 看答案模式
    paperWritingPanel: document.getElementById("paperWritingPanel"),
    paperPromptBox: document.getElementById("paperPromptBox"),
    showAnswerBtn: document.getElementById("showAnswerBtn"),
    answerPanel: document.getElementById("answerPanel"),
    answerHint: document.getElementById("answerHint"),
    answerStrokeWriter: document.getElementById("answerStrokeWriter"),
    answerStrokeStatus: document.getElementById("answerStrokeStatus"),
    replayAnswerStrokeBtn: document.getElementById("replayAnswerStrokeBtn"),
    correctBtn: document.getElementById("correctBtn"),
    wrongBtn: document.getElementById("wrongBtn"),

    // 听音选字
    choiceCurrentNumber: document.getElementById("choiceCurrentNumber"),
    choiceTotalNumber: document.getElementById("choiceTotalNumber"),
    choiceProgressBar: document.getElementById("choiceProgressBar"),
    choiceSpeakBtn: document.getElementById("choiceSpeakBtn"),
    choiceOptions: document.getElementById("choiceOptions"),
    choiceFeedback: document.getElementById("choiceFeedback"),
    choiceLevelBadge: document.getElementById("choiceLevelBadge"),
    quitChoiceBtn: document.getElementById("quitChoiceBtn"),

    // 故事阅读巩固
    storyCurrentNumber: document.getElementById("storyCurrentNumber"),
    storyTotalNumber: document.getElementById("storyTotalNumber"),
    storyFilterBadge: document.getElementById("storyFilterBadge"),
    storyFilterAllBtn: document.getElementById("storyFilterAllBtn"),
    storyFilterWrongBtn: document.getElementById("storyFilterWrongBtn"),
    storyFilterNewBtn: document.getElementById("storyFilterNewBtn"),
    storyJumpSelect: document.getElementById("storyJumpSelect"),
    storyText: document.getElementById("storyText"),
    storyDetailPlaceholder: document.getElementById("storyDetailPlaceholder"),
    storyDetailContent: document.getElementById("storyDetailContent"),
    storyDetailChar: document.getElementById("storyDetailChar"),
    storyDetailPinyin: document.getElementById("storyDetailPinyin"),
    storyDetailHint: document.getElementById("storyDetailHint"),
    storyDetailSpeakBtn: document.getElementById("storyDetailSpeakBtn"),
    storyDetailWrongToggleBtn: document.getElementById("storyDetailWrongToggleBtn"),
    storyPinyinBtn: document.getElementById("storyPinyinBtn"),
    storySpeakBtn: document.getElementById("storySpeakBtn"),
    storyPrevBtn: document.getElementById("storyPrevBtn"),
    storyNextBtn: document.getElementById("storyNextBtn"),
    quitStoryBtn: document.getElementById("quitStoryBtn"),

    // 已学汉字累计墙
    wallTotalCount: document.getElementById("wallTotalCount"),
    wallFilterAll: document.getElementById("wallFilterAll"),
    wallFilterNew: document.getElementById("wallFilterNew"),
    wallFilterWrong: document.getElementById("wallFilterWrong"),
    wallFilterLearning: document.getElementById("wallFilterLearning"),
    wallFilterMastered: document.getElementById("wallFilterMastered"),
    wallCharInspector: document.getElementById("wallCharInspector"),
    wallInspectorChar: document.getElementById("wallInspectorChar"),
    wallInspectorPinyin: document.getElementById("wallInspectorPinyin"),
    wallInspectorHint: document.getElementById("wallInspectorHint"),
    wallInspectorMeta: document.getElementById("wallInspectorMeta"),
    wallInspectorSpeakBtn: document.getElementById("wallInspectorSpeakBtn"),
    wallInspectorWrongBtn: document.getElementById("wallInspectorWrongBtn"),
    wallInspectorCloseBtn: document.getElementById("wallInspectorCloseBtn"),
    hanziWallGrid: document.getElementById("hanziWallGrid"),

    // 结算页面
    scoreRing: document.getElementById("scoreRing"),
    scoreText: document.getElementById("scoreText"),
    summaryMessage: document.getElementById("summaryMessage"),
    resultList: document.getElementById("resultList"),
    practiceWrongBtn: document.getElementById("practiceWrongBtn"),
    continueDueBtn: document.getElementById("continueDueBtn"),
    backHomeBtn: document.getElementById("backHomeBtn")
};

const DAY = window.ApiapiaSRS.DAY_MS;

function getHanziIndexMap() {
    const map = new Map();
    if (typeof HANZI_DATA !== "undefined" && Array.isArray(HANZI_DATA)) {
        HANZI_DATA.forEach((item, idx) => map.set(item.char, idx));
    }
    return map;
}

const HANZI_INDEX_MAP = getHanziIndexMap();

function isRecentAddition(char) {
    if (typeof HANZI_DATA === "undefined" || !Array.isArray(HANZI_DATA)) return false;
    const idx = HANZI_INDEX_MAP.get(char);
    if (idx === undefined) return false;
    return idx >= Math.max(0, HANZI_DATA.length - RECENT_NEW_COUNT);
}

function calculateNextReview(level) {
    return window.ApiapiaSRS.calculateNextReview(level);
}

function isDueForReview(charStats) {
    return window.ApiapiaSRS.isDueForReview(charStats && charStats.nextReviewDate);
}

function formatDateDisplay(ts) {
    return window.ApiapiaSRS.formatDateDisplay(ts);
}

function updateLevelBadge(badgeEl, char) {
    if (!badgeEl) return;
    const stats = loadStats();
    const cs = getCharStats(stats, char);
    const level = cs.level || 0;
    const isMastered = level >= 3;
    const isDue = (cs.nextReviewDate || 0) <= Date.now();
    const isBrandNew = (cs.practiced || 0) === 0;

    badgeEl.textContent = isBrandNew ? `新字 · Lv.${level}` : `Lv.${level}${isMastered ? " 🌟" : ""}`;
    badgeEl.className = `level-badge ${isMastered ? "level-mastered" : (isDue ? "level-due" : "")}`;
    badgeEl.title = `记忆等级 Lv.${level}${isMastered ? " (已掌握)" : ""}，下次复习: ${formatDateDisplay(cs.nextReviewDate)}`;
}

function getDefaultStats() {
    const characters = {};
    const now = Date.now();
    // 线下已学字库，初始全部设为 Lv.1 且进入今日待复习队列，新加入字 practiced=0
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

function ensureAllCharactersLearned(stats, persist = true) {
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
                    level: 1,
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

    if (changed && persist) {
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
            resetAt: Number(parsed.resetAt) || 0,
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

function loadDictationPreferences() {
    try {
        const savedMode = localStorage.getItem(WRITE_MODE_KEY);
        if (savedMode === "ipad" || savedMode === "paper") {
            state.dictationWriteMode = savedMode;
        }
        const savedOutline = localStorage.getItem(OUTLINE_MODE_KEY);
        if (savedOutline === "true" || savedOutline === "false") {
            state.ipadShowOutline = savedOutline === "true";
        }
    } catch (_) {}
}

function saveDictationPreferences() {
    try {
        localStorage.setItem(WRITE_MODE_KEY, state.dictationWriteMode);
        localStorage.setItem(OUTLINE_MODE_KEY, String(state.ipadShowOutline));
    } catch (_) {}
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
    stopAllSpeech();
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

const hanziSyncClient = window.ApiapiaSync.createSyncClient({
    endpoint: "/api/hanzi/sync",
    getKey: () => (els.syncKeyInput ? els.syncKeyInput.value.trim() : "") || (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim(),
    isAutoSync: () => localStorage.getItem(AUTO_SYNC_STORAGE) === "true",
    onStatusChange: (status, text) => setSyncStatus(status, text),
    onLastSyncTime: (timeStr) => setLastSyncTime(timeStr),
    emptyCloudMessage: "该密钥在云端尚无记录，您可以先点击【推送到云端】进行初次备份！",
    buildPushPayload: (cloudData) => {
        let speechSettings = {};
        try {
            const raw = localStorage.getItem(SPEECH_SETTINGS_KEY);
            if (raw) speechSettings = JSON.parse(raw);
        } catch (_) {}

        let stats = loadStats();
        const cloudStats = cloudData && cloudData.stats;
        if (cloudStats && typeof cloudStats === "object") {
            stats = mergeStats(stats, cloudStats);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
            refreshHomeStats();
        }
        return {
            stats,
            strokeProgress: "",
            speechSettings
        };
    },
    applyPullData: (cloudData) => {
        if (cloudData.stats && typeof cloudData.stats === "object") {
            const merged = mergeStats(loadStats(), cloudData.stats);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            if (!statsEqual(merged, cloudData.stats)) hanziSyncClient.triggerAutoSync();
        }
        if (cloudData.speechSettings && typeof cloudData.speechSettings === "object") {
            localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(cloudData.speechSettings));
            loadSpeechSettings();
        }
        refreshHomeStats();
        const total = cloudData.stats?.totalPracticed || 0;
        const wrong = Object.values(cloudData.stats?.characters || {}).filter(c => c.inWrongBook || c.wrong > 0).length;
        return `☁️ 已拉取云端数据（练习 ${total} 次，错字本 ${wrong} 个）`;
    }
});

function triggerAutoSync() {
    hanziSyncClient.triggerAutoSync();
}

async function pushToCloud(silent = false) {
    return hanziSyncClient.pushToCloud(silent);
}

function getRecordTime(record) {
    if (!record) return 0;
    return Number(record.updatedAt) || Date.parse(record.lastPracticed || "") || 0;
}

function mergeStats(local, cloud) {
    const resetAt = Math.max(Number(local.resetAt) || 0, Number(cloud.resetAt) || 0);
    const localChars = local.characters || {};
    const cloudChars = cloud.characters || {};
    const characters = {};
    new Set([...Object.keys(localChars), ...Object.keys(cloudChars)]).forEach(char => {
        const candidates = [localChars[char], cloudChars[char]]
            .filter(record => record && getRecordTime(record) >= resetAt);
        if (candidates.length === 0) return;
        candidates.sort((a, b) => getRecordTime(b) - getRecordTime(a));
        characters[char] = candidates[0];
    });

    const pickTotals = source => (Number(source.resetAt) || 0) >= resetAt
        ? {practiced: Number(source.totalPracticed) || 0, correct: Number(source.totalCorrect) || 0}
        : {practiced: 0, correct: 0};
    const localTotals = pickTotals(local);
    const cloudTotals = pickTotals(cloud);
    const useLocalTotals = localTotals.practiced >= cloudTotals.practiced;
    const totals = useLocalTotals ? localTotals : cloudTotals;

    return ensureAllCharactersLearned({
        totalPracticed: totals.practiced,
        totalCorrect: totals.correct,
        resetAt,
        characters
    }, false);
}

function statsEqual(a, b) {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch (_) {
        return false;
    }
}

async function pullFromCloud(silent = false) {
    return hanziSyncClient.pullFromCloud(silent);
}

function alertSpeechNotSupported() {
    if (window.kidAlert) {
        window.kidAlert({
            title: "语音未就绪",
            message: "当前浏览器不支持语音朗读。建议使用 Chrome、Edge、Safari 或手机自带浏览器。",
            icon: "🔊",
            type: "warning"
        });
    } else {
        alert("当前浏览器不支持语音朗读。建议使用 Chrome、Edge、Safari 或手机自带浏览器。");
    }
}

function previewSpeech() {
    if (!("speechSynthesis" in window) && typeof Audio === "undefined") {
        alertSpeechNotSupported();
        return;
    }
    const sample = findItem("天") || {char: "天", hint: "天空的天"};
    speakText(getItemSpeechText(sample, els.speechMode.value));
}

function getCharStats(stats, char) {
    const saved = (stats && stats.characters && stats.characters[char]) || {};
    const defaultInWrong = saved.inWrongBook !== undefined
        ? Boolean(saved.inWrongBook)
        : Boolean(saved.wrong > 0 && (saved.streak || 0) < 2 && (saved.level || 0) < 2);
    return {
        practiced: 0,
        correct: 0,
        wrong: 0,
        streak: 0,
        lastPracticed: null,
        level: 1,
        nextReviewDate: Date.now(),
        ...saved,
        inWrongBook: defaultInWrong
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
    charStats.updatedAt = Date.now();

    if (isCorrect) {
        stats.totalCorrect += 1;
        charStats.correct += 1;
        charStats.streak += 1;
        if (isDueForReview(charStats)) {
            newLevel = oldLevel + 1;
            charStats.level = newLevel;
            charStats.nextReviewDate = calculateNextReview(newLevel);
        }
        if (state.isWrongPractice || charStats.streak >= 2 || newLevel >= 2) {
            charStats.inWrongBook = false;
        }
    } else {
        charStats.wrong += 1;
        charStats.streak = 0;
        newLevel = 0;
        charStats.level = 0;
        charStats.nextReviewDate = Date.now();
        charStats.inWrongBook = true;
    }

    stats.characters[item.char] = charStats;
    saveStats(stats);
    return { oldLevel, newLevel, nextReviewDate: charStats.nextReviewDate };
}

function setCharWrongBookState(char, inWrong) {
    if (!char) return false;
    const stats = loadStats();
    const cs = getCharStats(stats, char);
    cs.inWrongBook = Boolean(inWrong);
    if (inWrong) {
        cs.level = 0;
        cs.streak = 0;
        cs.nextReviewDate = Date.now();
    }
    cs.updatedAt = Date.now();
    stats.characters[char] = cs;
    saveStats(stats);
    refreshHomeStats();
    return cs.inWrongBook;
}

function getWrongCharacters(stats = loadStats()) {
    return HANZI_DATA
        .map(item => {
            const cs = getCharStats(stats, item.char);
            return {
                ...item,
                inWrongBook: cs.inWrongBook,
                wrongScore: cs.wrong,
                streak: cs.streak || 0,
                level: cs.level || 0
            };
        })
        .filter(item => item.inWrongBook === true)
        .sort((a, b) => b.wrongScore - a.wrongScore);
}

function getNewAndWeakCharacters(stats = loadStats()) {
    return HANZI_DATA.filter(item => {
        const cs = getCharStats(stats, item.char);
        return (cs.practiced || 0) === 0 || cs.inWrongBook || (cs.practiced || 0) < 2 || isRecentAddition(item.char);
    });
}

function speakSingleCharacter(char) {
    if (!char) return;
    speakText(getCharSpeechText(char));
}

function removeFromWrongBook(char) {
    setCharWrongBookState(char, false);
    if (window.kidToast) {
        window.kidToast(`已将“${char}”移出错字本 👍`, "success");
    }
}

async function clearWrongBook() {
    const stats = loadStats();
    const wrongChars = getWrongCharacters(stats);
    if (wrongChars.length === 0) {
        if (window.kidToast) window.kidToast("错字本已经是空的啦！🎉", "info");
        return;
    }

    const ok = await window.kidConfirm({
        title: "清空错字本？",
        message: `确定要清空全部 ${wrongChars.length} 个错字记录吗？清空后错字本将重置为空。`,
        icon: "🗑️",
        type: "danger",
        confirmText: "确定清空",
        cancelText: "取消"
    });

    if (ok) {
        wrongChars.forEach(item => {
            const cs = getCharStats(stats, item.char);
            cs.inWrongBook = false;
            cs.updatedAt = Date.now();
            stats.characters[item.char] = cs;
        });
        saveStats(stats);
        refreshHomeStats();
        if (window.kidToast) {
            window.kidToast("已清空错字本！🎉", "success");
        }
    }
}

function getUniqueItems(items) {
    const map = new Map();
    (items || []).forEach(item => {
        if (item && item.char && !map.has(item.char)) {
            map.set(item.char, item);
        }
    });
    return Array.from(map.values());
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

    const navDueBadge = document.getElementById("navDueBadge");
    const navWrongBadge = document.getElementById("navWrongBadge");
    if (navDueBadge) {
        navDueBadge.textContent = dueChars.length > 99 ? "99+" : dueChars.length;
        navDueBadge.classList.toggle("hidden", dueChars.length === 0);
    }
    if (navWrongBadge) {
        navWrongBadge.textContent = wrongChars.length > 99 ? "99+" : wrongChars.length;
        navWrongBadge.classList.toggle("hidden", wrongChars.length === 0);
    }

    if (els.ebbinghausBanner) {
        const unpracticedCount = HANZI_DATA.filter(item => (getCharStats(stats, item.char).practiced || 0) === 0).length;
        if (dueChars.length > 0) {
            if (els.ebBannerTitle) {
                els.ebBannerTitle.textContent = unpracticedCount > 0
                    ? `🌱 有 ${unpracticedCount} 个新加字 + ${dueChars.length} 个待复习`
                    : `⏰ 今日待复习：${dueChars.length} 个汉字`;
            }
            if (els.ebBannerDesc) {
                els.ebBannerDesc.textContent = unpracticedCount > 0
                    ? `优先出新加字与错字，再复习到期汉字，巩固效率最高！`
                    : `每天练一练待复习的字和错字，记得越来越牢！`;
            }
            if (els.quickDueBtn) {
                els.quickDueBtn.classList.remove("hidden");
                els.quickDueBtn.textContent = `⚡ 立即复习 (${dueChars.length})`;
            }
        } else {
            if (els.ebBannerTitle) els.ebBannerTitle.textContent = `🎉 今日巩固已全部完成！`;
            if (els.ebBannerDesc) els.ebBannerDesc.textContent = `全部 ${HANZI_DATA.length} 个已学汉字均已巩固到位，棒棒哒！`;
            if (els.quickDueBtn) {
                els.quickDueBtn.classList.add("hidden");
            }
        }
    }

    if (els.wrongTabCountBadge) {
        els.wrongTabCountBadge.textContent = wrongChars.length;
    }

    if (els.wrongbookListSetup) {
        els.wrongbookListSetup.innerHTML = "";

        if (wrongChars.length === 0) {
            if (els.wrongbookSetup) els.wrongbookSetup.classList.add("hidden");
            if (els.wrongbookEmptyState) els.wrongbookEmptyState.classList.remove("hidden");
            if (els.wrongbookActions) els.wrongbookActions.classList.add("hidden");
            if (els.clearWrongBookBtn) els.clearWrongBookBtn.classList.add("hidden");
        } else {
            if (els.wrongbookSetup) els.wrongbookSetup.classList.remove("hidden");
            if (els.wrongbookEmptyState) els.wrongbookEmptyState.classList.add("hidden");
            if (els.wrongbookActions) els.wrongbookActions.classList.remove("hidden");
            if (els.clearWrongBookBtn) els.clearWrongBookBtn.classList.remove("hidden");

            wrongChars.forEach(item => {
                const chip = document.createElement("div");
                chip.className = "wrong-item";
                const charStats = getCharStats(stats, item.char);
                const wrongRate = charStats.practiced
                    ? Math.round((charStats.wrong / charStats.practiced) * 100)
                    : 0;

                const charSpan = document.createElement("span");
                charSpan.className = "wrong-char-click";
                charSpan.title = `点击发音 🔊 | 累计错误 ${charStats.wrong} 次，错误率 ${wrongRate}%`;
                charSpan.innerHTML = `<span>${item.char}</span> <span style="font-size: 0.72rem; font-family: ui-sans-serif, system-ui; opacity: 0.75; font-weight: normal;">Lv.${charStats.level || 0}</span>`;
                charSpan.addEventListener("click", () => {
                    speakSingleCharacter(item.char);
                });

                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "wrong-remove-btn";
                removeBtn.title = `将“${item.char}”移出错字本`;
                removeBtn.setAttribute("aria-label", `移出“${item.char}”`);
                removeBtn.innerHTML = "&times;";
                removeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeFromWrongBook(item.char);
                });

                chip.appendChild(charSpan);
                chip.appendChild(removeBtn);
                els.wrongbookListSetup.appendChild(chip);
            });
        }
    }

    buildCategoryOptions();
    renderHanziWall(stats);
}

function buildCategoryOptions() {
    const stats = loadStats();
    const dueChars = getDueCharacters(stats);
    const newWeakChars = getNewAndWeakCharacters(stats);
    const wrongChars = getWrongCharacters(stats);

    const prevValue = els.categorySelect ? els.categorySelect.value : "";

    const options = [
        {
            value: "due",
            label: `⏰ 今日待复习（${dueChars.length}个）${dueChars.length > 0 ? " [新字优先]" : " [已完成]"}`
        },
        {
            value: "new_weak",
            label: `🌱 最新加入与薄弱字（${newWeakChars.length}个）[重点巩固]`
        },
        {
            value: "wrong",
            label: `📕 错字本专项（${wrongChars.length}个）`
        },
        {
            value: "all",
            label: `🌐 全部已学汉字（${HANZI_DATA.length}个）`
        }
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
    } else if (newWeakChars.length > 0) {
        els.categorySelect.value = "new_weak";
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
    const stats = loadStats();

    let pool;

    if (selectedCategory === "due") {
        pool = getDueCharacters(stats);
        if (pool.length === 0) {
            if (window.kidToast) {
                window.kidToast("🎉 今日待复习汉字已全部完成！已为您切换至全部已学汉字巩固", "success");
            }
            pool = [...HANZI_DATA];
        }
    } else if (selectedCategory === "new_weak") {
        pool = getNewAndWeakCharacters(stats);
        if (pool.length === 0) {
            pool = [...HANZI_DATA];
        }
    } else if (selectedCategory === "wrong") {
        pool = getWrongCharacters(stats);
        if (pool.length === 0) {
            if (window.kidToast) {
                window.kidToast("错字本还是空的，太棒了！已为您切换至今日待复习 👏", "success");
            }
            pool = getDueCharacters(stats);
            if (pool.length === 0) pool = [...HANZI_DATA];
        }
    } else {
        pool = HANZI_DATA;
    }

    return shuffle(prioritizeForReview(pool, stats)); // 不分轮：练完所选范围的全部字，随时可退出
}

// 优先级：1. 从未练过的新字(越晚加入越靠前) 2. 错字本/Lv.0 3. 今日到期(低级优先) 4. 练习次数少的近期字
function prioritizeForReview(items, stats) {
    const now = Date.now();
    const getPriorityTier = (item, cs) => {
        if ((cs.practiced || 0) === 0) return 0;
        if (cs.inWrongBook || (cs.level || 0) === 0) return 1;
        if ((cs.nextReviewDate || 0) <= now) return 2;
        if (isRecentAddition(item.char) && (cs.practiced || 0) < 3) return 3;
        return 4;
    };

    return shuffle(items)
        .map(item => ({
            item,
            cs: getCharStats(stats, item.char),
            idx: HANZI_INDEX_MAP.get(item.char) ?? 0
        }))
        .sort((a, b) => {
            const tierA = getPriorityTier(a.item, a.cs);
            const tierB = getPriorityTier(b.item, b.cs);
            if (tierA !== tierB) return tierA - tierB;

            // 同样是新加入未练的字，后加入的优先出现
            if (tierA === 0) return b.idx - a.idx;

            const levelDiff = (a.cs.level || 0) - (b.cs.level || 0);
            if (levelDiff !== 0) return levelDiff;

            const practicedDiff = (a.cs.practiced || 0) - (b.cs.practiced || 0);
            if (practicedDiff !== 0) return practicedDiff;

            return (a.cs.nextReviewDate || 0) - (b.cs.nextReviewDate || 0);
        })
        .map(entry => entry.item);
}

// 挖空词组提示：将 "天空的天" 变成 "天空的【 ？ 】"，避免泄露天机同时明确同音字词意
function getMaskedHint(item) {
    if (!item || !item.hint) return "";
    if (!item.char || !item.hint.includes(item.char)) return item.hint;
    return item.hint.split(item.char).join("【 ？ 】");
}

function startSession(customItems = null) {
    const items = customItems || createSession();
    if (!items || items.length === 0) return;

    state.isWrongPractice = Boolean(customItems) || (els.categorySelect && els.categorySelect.value === "wrong");

    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    if (state.questionUnlockTimer) {
        clearTimeout(state.questionUnlockTimer);
        state.questionUnlockTimer = null;
    }
    state.reviewLocked = false;

    loadDictationPreferences();
    state.mode = "dictation";
    state.session = shuffle(items);
    state.currentIndex = 0;
    state.answers = [];
    state.speechRate = Number(els.speechRate.value);
    state.speechMode = els.speechMode.value;

    updateDictationWriteModeUI();
    updateIpadOutlineButtonsUI();
    showScreen("dictation");
    renderQuestion();

    setTimeout(() => speakCurrent(), 350);
}

function updateDictationWriteModeUI() {
    const isIpad = state.dictationWriteMode === "ipad";
    els.dictationModeIpadBtn?.classList.toggle("active", isIpad);
    els.dictationModePaperBtn?.classList.toggle("active", !isIpad);
    els.dictationModeIpadBtn?.setAttribute("aria-pressed", String(isIpad));
    els.dictationModePaperBtn?.setAttribute("aria-pressed", String(!isIpad));
}

function updateIpadOutlineButtonsUI() {
    const show = Boolean(state.ipadShowOutline);
    els.ipadOutlineHideBtn?.classList.toggle("active", !show);
    els.ipadOutlineShowBtn?.classList.toggle("active", show);
    els.ipadOutlineHideBtn?.setAttribute("aria-pressed", String(!show));
    els.ipadOutlineShowBtn?.setAttribute("aria-pressed", String(show));
}

function setDictationWriteMode(mode) {
    if (mode !== "ipad" && mode !== "paper") return;
    if (state.dictationWriteMode === mode) return;
    state.dictationWriteMode = mode;
    saveDictationPreferences();
    updateDictationWriteModeUI();
    renderQuestion();
}

function setIpadOutlineMode(showOutline) {
    state.ipadShowOutline = Boolean(showOutline);
    saveDictationPreferences();
    updateIpadOutlineButtonsUI();

    const writer = state.ipadStrokeWriter;
    if (!writer) return;
    if (state.ipadShowOutline) {
        writer.showOutline?.();
    } else {
        writer.hideOutline?.();
    }
}

function clearIpadStrokeWriter() {
    state.ipadStrokeRenderToken += 1;
    state.ipadStrokeWriter?.cancelQuiz?.();
    state.ipadStrokeWriter?.pauseAnimation?.();
    state.ipadStrokeWriter = null;
    if (els.dictationStrokeWriter) els.dictationStrokeWriter.replaceChildren();
    if (els.dictationStrokeStatus) {
        els.dictationStrokeStatus.textContent = "正在准备田字格……";
        els.dictationStrokeStatus.classList.remove("hidden");
    }
}

function clearAnswerStroke() {
    state.answerStrokeRenderToken += 1;
    state.answerStrokeWriter?.pauseAnimation?.();
    state.answerStrokeWriter = null;
    if (els.answerStrokeWriter) els.answerStrokeWriter.replaceChildren();
    if (els.replayAnswerStrokeBtn) els.replayAnswerStrokeBtn.disabled = true;
    if (els.answerStrokeStatus) {
        els.answerStrokeStatus.textContent = "正在准备笔画演示……";
        els.answerStrokeStatus.classList.remove("hidden");
    }
}

function setDictationStrokeFeedback(text, type = "") {
    if (!els.dictationStrokeFeedback) return;
    els.dictationStrokeFeedback.textContent = text;
    els.dictationStrokeFeedback.className = `stroke-feedback ${type}`;
}

function renderQuestion() {
    const item = state.session[state.currentIndex];
    if (!item) return;

    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    state.reviewLocked = false;

    clearIpadStrokeWriter();
    clearAnswerStroke();

    els.speakBtn?.closest(".listen-area")?.classList.remove("hidden");
    if (els.currentNumber) els.currentNumber.textContent = state.currentIndex + 1;
    if (els.totalNumber) els.totalNumber.textContent = state.session.length;
    if (els.dictationStageLabel) els.dictationStageLabel.textContent = "听写";
    if (els.progressBar) {
        els.progressBar.style.width = `${((state.currentIndex + 1) / state.session.length) * 100}%`;
    }
    if (els.questionPinyin) els.questionPinyin.textContent = PINYIN_MAP[item.char] || "";
    if (els.questionMaskedHint) els.questionMaskedHint.textContent = getMaskedHint(item);

    updateLevelBadge(els.dictationLevelBadge, item.char);

    if (state.dictationWriteMode === "ipad") {
        renderIpadWritingQuestion(item);
    } else {
        renderPaperWritingQuestion(item);
    }
}

function renderIpadWritingQuestion(item) {
    els.ipadWritingPanel?.classList.remove("hidden");
    els.paperWritingPanel?.classList.add("hidden");

    els.ipadPreCompleteBar?.classList.remove("hidden");
    els.ipadAssistActionBar?.classList.add("hidden");
    els.ipadCompleteBar?.classList.add("hidden");

    state.ipadCurrentStrokeNum = 0;
    state.ipadCurrentMistakes = 0;
    state.ipadClickedHint = false;
    state.ipadGaveUp = false;
    state.ipadQuizCompleted = false;

    updateIpadOutlineButtonsUI();
    startDictationIpadQuiz(item);
}

function startDictationIpadQuiz(item) {
    clearIpadStrokeWriter();
    state.ipadCurrentStrokeNum = 0;
    state.ipadCurrentMistakes = 0;
    state.ipadQuizCompleted = false;
    state.ipadGaveUp = false;

    els.ipadPreCompleteBar?.classList.remove("hidden");
    els.ipadAssistActionBar?.classList.add("hidden");
    els.ipadCompleteBar?.classList.add("hidden");

    setDictationStrokeFeedback(
        state.ipadShowOutline
            ? "✏️ 描红模式：跟着灰色字底，一笔一划写出来"
            : "🔒 默写模式：听读音，在空白田字格里写出这个字"
    );

    if (typeof HanziWriter === "undefined") {
        if (els.dictationStrokeStatus) {
            els.dictationStrokeStatus.textContent = "笔画组件加载失败，请切换为“纸上写”模式或刷新页面。";
        }
        return;
    }

    const renderToken = ++state.ipadStrokeRenderToken;
    const gridRect = els.dictationStrokeGrid?.getBoundingClientRect();
    const size = Math.max(220, Math.round(gridRect?.width || 300));
    const isDark = document.documentElement.classList.contains("dark");

    state.ipadStrokeWriter = HanziWriter.create(els.dictationStrokeWriter, item.char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.09),
        showOutline: state.ipadShowOutline,
        showCharacter: false,
        strokeColor: isDark ? "#60a5fa" : "#20242c",
        outlineColor: isDark ? "#475569" : "#d7dbe3",
        drawingColor: isDark ? "#f8fafc" : "#1e293b",
        drawingWidth: Math.max(14, Math.round(size / 18)),
        highlightColor: "#f59e0b",
        strokeAnimationSpeed: 0.7,
        delayBetweenStrokes: 550,
        delayBetweenLoops: 1800,
        onLoadCharDataSuccess: () => {
            if (renderToken !== state.ipadStrokeRenderToken) return;
            els.dictationStrokeStatus?.classList.add("hidden");
            beginHanziQuizSession(item, renderToken);
        },
        onLoadCharDataError: () => {
            if (renderToken !== state.ipadStrokeRenderToken) return;
            if (els.dictationStrokeStatus) {
                els.dictationStrokeStatus.textContent = `暂时无法加载“${item.char}”的笔画数据，可切换上方“纸上写”模式继续。`;
            }
        }
    });
}

function beginHanziQuizSession(item, renderToken) {
    const writer = state.ipadStrokeWriter;
    if (!writer) return;
    writer.quiz({
        leniency: 1.35,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onCorrectStroke: data => {
            if (renderToken !== state.ipadStrokeRenderToken) return;
            state.ipadCurrentStrokeNum = data.strokeNum + 1;
            const strokeTotal = data.strokeNum + 1 + data.strokesRemaining;
            setDictationStrokeFeedback(`✅ 第 ${data.strokeNum + 1} / ${strokeTotal} 笔写对啦 👍`, "good");
        },
        onMistake: data => {
            if (renderToken !== state.ipadStrokeRenderToken) return;
            state.ipadCurrentMistakes += 1;
            const tip = data.mistakesOnStroke >= 2
                ? "💡 看看闪烁的提示笔画，照着写～"
                : "笔顺或位置不对哦，再试一次～";
            setDictationStrokeFeedback(tip, "oops");
        },
        onComplete: data => {
            if (renderToken !== state.ipadStrokeRenderToken) return;
            state.ipadQuizCompleted = true;
            state.ipadCurrentMistakes = data.totalMistakes;

            const stats = loadStats();
            const cs = getCharStats(stats, item.char);
            const pinyin = PINYIN_MAP[item.char] || "";

            els.ipadPreCompleteBar?.classList.add("hidden");
            els.ipadAssistActionBar?.classList.add("hidden");
            els.ipadCompleteBar?.classList.remove("hidden");

            if (els.ipadCompleteInfo) {
                const mistakeCount = data.totalMistakes || 0;
                let note = "";
                if (!state.ipadShowOutline && !state.ipadClickedHint && mistakeCount === 0) {
                    note = `🌟 盲写全对，一笔都没错！`;
                } else if (mistakeCount <= 2) {
                    note = `👍 写完啦！${mistakeCount > 0 ? `（小提示 ${mistakeCount} 次）` : ""}`;
                } else {
                    note = `💪 终于写出来啦（错了 ${mistakeCount} 次，建议点“记错重练”巩固）`;
                }
                els.ipadCompleteInfo.textContent = `${item.char} [${pinyin}] · ${item.hint} — ${note}`;
            }

            setDictationStrokeFeedback(`🎉 “${item.char}”写好啦！`, "done");
            playSuccessSound();
            lockVerdictButtons(450);

            setTimeout(() => {
                if (renderToken === state.ipadStrokeRenderToken && !els.dictationScreen.classList.contains("hidden")) {
                    speakText(getCharSpeechText(item.char), {rate: state.speechRate});
                }
            }, 350);
        }
    });
}

function hintIpadStroke() {
    const writer = state.ipadStrokeWriter;
    if (!writer || state.ipadQuizCompleted || state.ipadGaveUp) return;
    state.ipadClickedHint = true;
    writer.highlightStroke?.(state.ipadCurrentStrokeNum);
    setDictationStrokeFeedback("💡 看看田字格里闪烁的这一笔，照着写～", "oops");
}

function giveUpAndShowStroke() {
    const writer = state.ipadStrokeWriter;
    const item = state.session[state.currentIndex];
    if (!item) return;

    state.ipadGaveUp = true;
    state.ipadClickedHint = true;

    els.ipadPreCompleteBar?.classList.add("hidden");
    els.ipadCompleteBar?.classList.add("hidden");
    els.ipadAssistActionBar?.classList.remove("hidden");

    if (writer) {
        writer.cancelQuiz?.();
        writer.showOutline?.();
        writer.loopCharacterAnimation?.();
    }
    setDictationStrokeFeedback(`👀 仔细看“${item.char}”的正确笔顺，看完可以自己重写一遍`, "oops");
    speakCurrent();
}

function retryIpadQuiz() {
    const item = state.session[state.currentIndex];
    if (!item) return;
    startDictationIpadQuiz(item);
}

function renderPaperWritingQuestion(item) {
    els.ipadWritingPanel?.classList.add("hidden");
    els.paperWritingPanel?.classList.remove("hidden");

    els.paperPromptBox?.classList.remove("hidden");
    els.answerPanel?.classList.add("hidden");
    if (els.showAnswerBtn) {
        els.showAnswerBtn.disabled = true;
        if (state.questionUnlockTimer) {
            clearTimeout(state.questionUnlockTimer);
        }
        state.questionUnlockTimer = setTimeout(() => {
            if (els.showAnswerBtn) els.showAnswerBtn.disabled = false;
            state.questionUnlockTimer = null;
        }, 350);
    }
    if (els.answerHint) els.answerHint.textContent = "";
}

function submitPaperWriting() {
    if (els.showAnswerBtn?.disabled) return;
    if (els.showAnswerBtn) els.showAnswerBtn.disabled = true;
    renderReview();
}

function renderAnswerStroke(char) {
    clearAnswerStroke();

    if (typeof HanziWriter === "undefined") {
        if (els.answerStrokeStatus) {
            els.answerStrokeStatus.textContent = "笔画组件加载失败，请检查网络后刷新页面。";
        }
        return;
    }

    const renderToken = ++state.answerStrokeRenderToken;
    const rect = els.answerStrokeWriter?.getBoundingClientRect();
    const size = Math.max(180, Math.round(rect?.width || 210));

    const isDark = document.documentElement.classList.contains("dark");
    state.answerStrokeWriter = HanziWriter.create(els.answerStrokeWriter, char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.08),
        showOutline: true,
        showCharacter: false,
        strokeColor: isDark ? "#60a5fa" : "#1e293b",
        outlineColor: isDark ? "#475569" : "#d7dbe3",
        strokeAnimationSpeed: 0.75,
        delayBetweenStrokes: 420,
        delayBetweenLoops: 1800,
        onLoadCharDataSuccess: () => {
            if (renderToken !== state.answerStrokeRenderToken) return;
            els.answerStrokeStatus?.classList.add("hidden");
            if (els.replayAnswerStrokeBtn) els.replayAnswerStrokeBtn.disabled = false;
            state.answerStrokeWriter.loopCharacterAnimation();
        },
        onLoadCharDataError: () => {
            if (renderToken !== state.answerStrokeRenderToken) return;
            if (els.answerStrokeStatus) {
                els.answerStrokeStatus.textContent = `暂时无法加载“${char}”的笔画数据。`;
            }
        }
    });
}

function replayAnswerStroke() {
    if (!state.answerStrokeWriter) return;
    state.answerStrokeWriter.cancelQuiz?.();
    state.answerStrokeWriter.loopCharacterAnimation();
}

function renderReview() {
    stopAllSpeech();
    const item = state.session[state.currentIndex];
    if (!item) return;
    if (els.dictationStageLabel) els.dictationStageLabel.textContent = "核对";
    if (els.currentNumber) els.currentNumber.textContent = state.currentIndex + 1;
    if (els.totalNumber) els.totalNumber.textContent = state.session.length;
    if (els.progressBar) {
        els.progressBar.style.width = `${((state.currentIndex + 1) / state.session.length) * 100}%`;
    }
    const pinyin = PINYIN_MAP[item.char] || "";
    if (els.answerHint) els.answerHint.textContent = `${item.char} [${pinyin}] · ${item.hint}`;

    els.paperPromptBox?.classList.add("hidden");
    els.answerPanel?.classList.remove("hidden");

    lockVerdictButtons(600);
    renderAnswerStroke(item.char);
}

function lockVerdictButtons(duration = 600) {
    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    state.reviewLocked = true;
    [els.wrongBtn, els.correctBtn, els.ipadMarkWrongBtn, els.ipadNextBtn, els.ipadAssistWrongNextBtn].forEach(btn => {
        if (btn) btn.disabled = true;
    });

    state.reviewUnlockTimer = setTimeout(() => {
        state.reviewLocked = false;
        [els.wrongBtn, els.correctBtn, els.ipadMarkWrongBtn, els.ipadNextBtn, els.ipadAssistWrongNextBtn].forEach(btn => {
            if (btn) btn.disabled = false;
        });
        state.reviewUnlockTimer = null;
    }, duration);
}

function recordAnswer(isCorrect) {
    if (state.reviewLocked) return;
    state.reviewLocked = true;
    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    [els.wrongBtn, els.correctBtn, els.ipadMarkWrongBtn, els.ipadNextBtn, els.ipadAssistWrongNextBtn].forEach(btn => {
        if (btn) btn.disabled = true;
    });

    const item = state.session[state.currentIndex];
    if (!item) return;

    state.answers.push({
        item,
        isCorrect,
        mode: state.dictationWriteMode
    });

    updateStatsForAnswer(item, isCorrect);

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

const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

let cachedChineseVoice;

function getChineseVoice() {
    if (cachedChineseVoice) return cachedChineseVoice;
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (voices.length === 0) return null;

    const scoreVoice = voice => {
        const lang = (voice.lang || "").replace("_", "-");
        const name = voice.name || "";
        if (/HK|yue|Cantonese|粤/i.test(lang + name)) return -1;
        let score;
        if (/^(zh-CN|zh-Hans|cmn)/i.test(lang)) score = 100;
        else if (/^zh-(TW|Hant)/i.test(lang)) score = 40;
        else if (/^zh/i.test(lang)) score = 60;
        else return -1;
        if (voice.localService === true) score += 40;
        if (/Siri/i.test(name)) score += 35;
        if (/Xiaoxiao|Xiaoyi|晓晓|晓伊|Natural|Neural/i.test(name)) score += 25;
        if (/Tingting|Ting-Ting|婷婷|Huihui|Yaoyao|Kangkang|慧慧|瑶瑶|康康|Lili|Meijia/i.test(name)) score += 20;
        if (/Google/i.test(name) && !voice.localService) score -= 50;
        return score;
    };

    const ranked = voices
        .map(voice => ({voice, score: scoreVoice(voice)}))
        .filter(entry => entry.score >= 0)
        .sort((a, b) => b.score - a.score);
    cachedChineseVoice = ranked.length > 0 ? ranked[0].voice : null;
    return cachedChineseVoice;
}

function getSpeechRate() {
    return Number(els.speechRate?.value) || state.speechRate || 0.78;
}

function getSharedTTSAudio() {
    if (!state.sharedTTSAudio && typeof Audio !== "undefined") {
        const audio = new Audio();
        audio.preload = "auto";
        audio.setAttribute("playsinline", "");
        audio.setAttribute("webkit-playsinline", "");
        state.sharedTTSAudio = audio;
    }
    return state.sharedTTSAudio;
}

function clearSpeechTimers() {
    if (state.speakDelayTimer) {
        clearTimeout(state.speakDelayTimer);
        state.speakDelayTimer = null;
    }
    if (state.speechWatchdogTimer) {
        clearTimeout(state.speechWatchdogTimer);
        state.speechWatchdogTimer = null;
    }
}

function stopAllSpeech() {
    state.speechToken += 1;
    clearSpeechTimers();
    if (state.sharedTTSAudio) {
        try {
            state.sharedTTSAudio.pause();
            state.sharedTTSAudio.currentTime = 0;
        } catch (_) {}
    }
    try {
        window.speechSynthesis?.cancel?.();
    } catch (_) {}
    state.currentUtterance = null;
    if (typeof window !== "undefined") {
        window._hanziActiveUtterance = null;
    }
}

function unlockAudioAndTTS() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (synth && !state.ttsUnlocked) {
        try {
            if (synth.paused) synth.resume();
            if (!synth.speaking && !synth.pending && state.speechToken === 0 && typeof SpeechSynthesisUtterance !== "undefined") {
                const dummy = new SpeechSynthesisUtterance("");
                dummy.volume = 0;
                synth.speak(dummy);
            }
            state.ttsUnlocked = true;
        } catch (_) {}
        getChineseVoice();
    }
    if (!state.audioUnlocked) {
        try {
            const audio = getSharedTTSAudio();
            if (audio && audio.paused && state.speechToken === 0) {
                audio.src = SILENT_WAV;
                const p = audio.play();
                if (p && typeof p.then === "function") {
                    p.then(() => {
                        if (audio.src === SILENT_WAV) {
                            audio.pause();
                            audio.currentTime = 0;
                        }
                        state.audioUnlocked = true;
                    }).catch(() => {});
                }
            }
        } catch (_) {}
    }
}

function playOnlineChineseTTS(text, {rate, onstart, onend, token} = {}) {
    if (!text || token !== state.speechToken) return;
    const audio = getSharedTTSAudio();
    if (!audio) {
        if (token === state.speechToken) onend?.();
        return;
    }

    const encoded = encodeURIComponent(text);
    const urls = [
        `https://dict.youdao.com/dictvoice?audio=${encoded}&le=zh`,
        `https://fanyi.baidu.com/gettts?lan=zh&text=${encoded}&spd=4&source=web`
    ];
    let urlIdx = 0;
    let started = false;
    let finished = false;
    let stallTimer = null;

    const cleanup = () => {
        if (stallTimer) {
            clearTimeout(stallTimer);
            stallTimer = null;
        }
        audio.onplaying = null;
        audio.onended = null;
        audio.onerror = null;
    };

    const finish = () => {
        if (finished) return;
        finished = true;
        cleanup();
        if (token === state.speechToken) onend?.();
    };

    const tryNext = () => {
        if (finished || token !== state.speechToken) {
            cleanup();
            return;
        }
        if (urlIdx >= urls.length) {
            finish();
            return;
        }
        const src = urls[urlIdx++];
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
            if (!started && !finished && token === state.speechToken) {
                tryNext();
            }
        }, 1800);

        audio.onplaying = () => {
            if (token !== state.speechToken) {
                try { audio.pause(); } catch (_) {}
                cleanup();
                return;
            }
            if (!started) {
                started = true;
                if (stallTimer) {
                    clearTimeout(stallTimer);
                    stallTimer = null;
                }
                onstart?.();
            }
        };
        audio.onended = finish;
        audio.onerror = () => {
            if (token !== state.speechToken) {
                cleanup();
                return;
            }
            tryNext();
        };

        try {
            audio.pause();
            audio.src = src;
            audio.playbackRate = Math.max(0.65, Math.min(1.5, Number(rate) || getSpeechRate()));
            audio.currentTime = 0;
            const p = audio.play();
            if (p && typeof p.catch === "function") {
                p.catch(err => {
                    if (err && err.name === "AbortError") return;
                    tryNext();
                });
            }
        } catch (_) {
            tryNext();
        }
    };

    tryNext();
}

function speakText(text, {rate, onstart, onend, interrupt = true} = {}) {
    if (!text) return null;

    const token = ++state.speechToken;
    clearSpeechTimers();
    state.ttsUnlocked = true;

    if (state.sharedTTSAudio) {
        try {
            state.sharedTTSAudio.pause();
            state.sharedTTSAudio.currentTime = 0;
        } catch (_) {}
    }

    const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
        playOnlineChineseTTS(text, {rate, onstart, onend, token});
        return null;
    }

    if (synth.paused) {
        try { synth.resume(); } catch (_) {}
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate || getSpeechRate();
    utterance.pitch = 1.05;
    utterance.volume = 1;
    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;

    let started = false;
    let settled = false;

    utterance.onstart = () => {
        if (token !== state.speechToken) return;
        started = true;
        if (state.speechWatchdogTimer) {
            clearTimeout(state.speechWatchdogTimer);
            state.speechWatchdogTimer = null;
        }
        onstart?.();
    };

    utterance.onend = () => {
        if (token !== state.speechToken || settled) return;
        settled = true;
        if (state.speechWatchdogTimer) {
            clearTimeout(state.speechWatchdogTimer);
            state.speechWatchdogTimer = null;
        }
        if (state.currentUtterance === utterance) state.currentUtterance = null;
        if (typeof window !== "undefined" && window._hanziActiveUtterance === utterance) {
            window._hanziActiveUtterance = null;
        }
        onend?.();
    };

    utterance.onerror = event => {
        if (token !== state.speechToken || settled) return;
        const errCode = event?.error;
        if (errCode === "canceled" || errCode === "interrupted") return;
        settled = true;
        if (state.speechWatchdogTimer) {
            clearTimeout(state.speechWatchdogTimer);
            state.speechWatchdogTimer = null;
        }
        console.warn("本地语音播放失败，切换在线语音：", errCode);
        playOnlineChineseTTS(text, {rate, onstart, onend, token});
    };

    state.currentUtterance = utterance;
    if (typeof window !== "undefined") {
        window._hanziActiveUtterance = utterance;
    }

    const doSpeak = () => {
        if (token !== state.speechToken) return;
        state.speechWatchdogTimer = setTimeout(() => {
            state.speechWatchdogTimer = null;
            if (!started && !settled && token === state.speechToken) {
                settled = true;
                try { synth.cancel(); } catch (_) {}
                playOnlineChineseTTS(text, {rate, onstart, onend, token});
            }
        }, 900);

        try {
            synth.speak(utterance);
        } catch (err) {
            if (!settled && token === state.speechToken) {
                settled = true;
                clearSpeechTimers();
                console.warn("语音调用异常，切换在线语音：", err);
                playOnlineChineseTTS(text, {rate, onstart, onend, token});
            }
        }
    };

    if (interrupt && (synth.speaking || synth.pending)) {
        try { synth.cancel(); } catch (_) {}
        state.speakDelayTimer = setTimeout(() => {
            state.speakDelayTimer = null;
            doSpeak();
        }, 35);
    } else {
        doSpeak();
    }

    return utterance;
}

const SPEECH_HINT_TAIL_MAP = {
    "发": "珐",
    "干": "淦",
    "兴": "杏",
    "什": "神",
    "都": "兜",
    "只": "之",
    "几": "己",
    "闷": "焖",
    "膀": "绑",
    "教": "叫",
    "校": "笑",
    "片": "骗",
    "担": "丹",
    "长": "常",
    "角": "脚",
    "哪": "“哪”",
    "觉": "叫",
    "累": "泪",
    "间": "尖",
    "乐": "勒",
    "空": "崆",
    "中": "钟",
    "分": "芬",
    "号": "浩",
    "和": "河",
    "没": "煤"
};

function getSpeechHintText(item) {
    if (!item || !item.hint) return "";
    const suffix = `的${item.char}`;
    if (item.hint.endsWith(suffix)) {
        const mappedTail = SPEECH_HINT_TAIL_MAP[item.char];
        if (mappedTail) {
            return `${item.hint.slice(0, -item.char.length)}${mappedTail}`;
        }
    }
    return item.hint;
}

function findItem(char) {
    return HANZI_DATA.find(item => item.char === char) || null;
}

function getCharSpeechText(char) {
    return SPEECH_HINT_TAIL_MAP[char] || char;
}

function getItemSpeechText(item, mode = state.speechMode) {
    const lead = getCharSpeechText(item.char);
    if (mode === "char") return lead;
    if (mode === "twice") return `${lead}。${lead}。`;
    return `${lead}。${getSpeechHintText(item)}。`;
}

function speakCurrent() {
    const item = state.session[state.currentIndex];
    if (!item) return;
    if (!("speechSynthesis" in window) && typeof Audio === "undefined") {
        alertSpeechNotSupported();
        return;
    }
    speakText(getItemSpeechText(item), {rate: state.speechRate});
}

// 听音选字干扰项：全部从孩子已学字库 HANZI_DATA 中抽取（优先错字本及近期新字），真正检验辨字能力
function getChoiceOptions(item) {
    const targetPinyin = PINYIN_MAP[item.char] || "";
    const stats = loadStats();

    let candidates = HANZI_DATA.filter(c =>
        c.char !== item.char && (!targetPinyin || PINYIN_MAP[c.char] !== targetPinyin)
    );
    if (candidates.length < 4) {
        candidates = HANZI_DATA.filter(c => c.char !== item.char);
    }

    const focusPool = shuffle(
        candidates.filter(c => {
            const cs = getCharStats(stats, c.char);
            return cs.inWrongBook || isRecentAddition(c.char) || (cs.practiced || 0) < 2;
        })
    );
    const otherPool = shuffle(
        candidates.filter(c => !focusPool.some(r => r.char === c.char))
    );

    const distractors = [];
    for (const c of focusPool) {
        if (distractors.length >= 2) break;
        distractors.push(c);
    }
    for (const c of [...otherPool, ...focusPool]) {
        if (distractors.length >= 4) break;
        if (!distractors.some(d => d.char === c.char)) {
            distractors.push(c);
        }
    }

    return shuffle([item, ...distractors]);
}

function startChoice(customItems = null) {
    const items = customItems || createSession();
    if (!items || items.length === 0) return;

    state.isWrongPractice = Boolean(customItems) || (els.categorySelect && els.categorySelect.value === "wrong");

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
    if (els.choiceFeedback) {
        els.choiceFeedback.classList.add("hidden");
        els.choiceFeedback.classList.remove("flex");
    }
    const choiceHint = document.getElementById("choiceHint");
    if (choiceHint) choiceHint.classList.remove("hidden");
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
    if (!item) return;
    speakText(getItemSpeechText(item, "hint"), {rate: state.speechRate});
}

let sharedAudioContext = null;

function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
        sharedAudioContext = new AudioContextClass();
    }
    sharedAudioContext.resume?.();
    return sharedAudioContext;
}

function playSuccessSound() {
    try {
        const context = getAudioContext();
        if (!context) return;
        const start = context.currentTime + 0.01;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const at = start + i * 0.09;
            oscillator.type = "triangle";
            oscillator.frequency.setValueAtTime(freq, at);
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start(at);
            oscillator.stop(at + 0.3);
        });
    } catch (error) {
        console.warn("提示音播放失败：", error);
    }
}

function playErrorSound() {
    try {
        const context = getAudioContext();
        if (!context) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + 0.01;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(330, startAt);
        oscillator.frequency.setValueAtTime(247, startAt + 0.14);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.4, startAt + 0.015);
        gain.gain.setValueAtTime(0.4, startAt + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.31);
    } catch (error) {
        console.warn("提示音播放失败：", error);
    }
}

function speakOptionCharacter(option, button) {
    if (!option || !option.char) return;

    const char = option.char;
    const item = state.choiceSession[state.choiceIndex];
    const text = item && char === item.char && item.hint
        ? getItemSpeechText(item)
        : getCharSpeechText(char);
    speakText(text, {rate: state.speechRate});

    if (button) {
        button.classList.remove("choice-speaking");
        void button.offsetWidth;
        button.classList.add("choice-speaking");
        setTimeout(() => {
            button.classList.remove("choice-speaking");
        }, 500);
    }
}

function chooseCharacter(option, button) {
    if (state.choiceLocked) {
        speakOptionCharacter(option, button);
        return;
    }
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
        const choiceIndex = state.choiceIndex;
        setTimeout(() => {
            if (state.choiceIndex === choiceIndex && !state.choiceLocked) speakChoiceCurrent();
        }, 650);
        return;
    }

    state.choiceLocked = true;
    button.classList.add("correct-choice");
    els.choiceOptions?.querySelectorAll("button").forEach(node => {
        node.disabled = false;
        node.setAttribute("title", "点击听汉字读音");
    });
    const choiceHint = document.getElementById("choiceHint");
    if (choiceHint) choiceHint.classList.add("hidden");
    if (els.choiceFeedback) {
        els.choiceFeedback.classList.remove("hidden");
        els.choiceFeedback.classList.add("flex");
    }
    const isFirstTryCorrect = !state.choiceHadMistake;
    state.choiceAnswers.push({item, isCorrect: isFirstTryCorrect});
    updateStatsForAnswer(item, isFirstTryCorrect);

    playSuccessSound();
    const choiceIndex = state.choiceIndex;
    setTimeout(() => {
        if (state.choiceIndex === choiceIndex && !els.choiceScreen.classList.contains("hidden")) {
            speakText(getCharSpeechText(item.char), {rate: state.speechRate});
        }
    }, 450);
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
    stopAllSpeech();
    const correctCount = state.choiceAnswers.filter(answer => answer.isCorrect).length;
    const total = state.choiceAnswers.length;
    const percentage = total ? Math.round(correctCount / total * 100) : 0;
    const wrongAnswers = state.choiceAnswers.filter(answer => !answer.isCorrect);
    els.scoreText.textContent = `${percentage}%`;
    els.scoreRing.style.background =
        `conic-gradient(var(--primary) ${percentage}%, var(--ring-empty, #e7ebf3) ${percentage}%)`;
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
        chip.addEventListener("click", () => speakSingleCharacter(answer.item.char));
        els.resultList.appendChild(chip);
    });
    const uniqueWrong = getUniqueItems(wrongAnswers.map(a => a.item));
    els.practiceWrongBtn.disabled = uniqueWrong.length === 0;
    els.practiceWrongBtn.textContent = uniqueWrong.length
        ? `再练本次易错字（${uniqueWrong.length}个）`
        : "本次全部一次选对";

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

    if (percentage === 100 && total > 0) {
        setTimeout(() => {
            window.showApiapiaPerfectReward && window.showApiapiaPerfectReward({
                moduleName: "汉字听音选字",
                detail: `本次 ${total} 题全部一次选对！`
            });
        }, 350);
    }
}

function finishSession() {
    stopAllSpeech();
    clearIpadStrokeWriter();
    clearAnswerStroke();
    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    if (state.questionUnlockTimer) {
        clearTimeout(state.questionUnlockTimer);
        state.questionUnlockTimer = null;
    }
    state.reviewLocked = false;

    const correctCount = state.answers.filter(answer => answer.isCorrect).length;
    const total = state.answers.length;
    const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const wrongAnswers = state.answers.filter(answer => !answer.isCorrect);

    state.mode = "dictation";
    els.scoreText.textContent = `${percentage}%`;
    els.scoreRing.style.background =
        `conic-gradient(var(--primary) ${percentage}%, var(--ring-empty, #e7ebf3) ${percentage}%)`;

    let message;
    if (percentage === 100) {
        message = `太棒了！今天 ${total} 个字全部过关！`;
    } else if (percentage >= 80) {
        message = `表现很好！写对了 ${correctCount} 个，再巩固一下错字就更棒了。`;
    } else if (percentage >= 60) {
        message = `已经掌握 ${correctCount} 个。慢慢来，错字多写几次就会记住。`;
    } else {
        message = `今天完成了 ${total} 个字的听写练习。点下面错字可再听读音，不着急。`;
    }

    els.summaryMessage.textContent = message;
    els.resultList.innerHTML = "";
    els.resultList.classList.add("dictation-results");

    const stats = loadStats();
    state.answers.forEach(answer => {
        const card = document.createElement("div");
        card.className = `dictation-result ${answer.isCorrect ? "correct" : "wrong"} cursor-pointer`;
        card.title = "点击再听一次读音 🔊";
        card.addEventListener("click", () => speakSingleCharacter(answer.item.char));

        const topRow = document.createElement("div");
        topRow.className = "flex items-center justify-between gap-3 mb-2";

        const leftInfo = document.createElement("div");
        leftInfo.className = "flex items-center space-x-3 min-w-0";

        const charBox = document.createElement("div");
        charBox.className = "w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-4xl font-black text-slate-900 hanzi-font flex-shrink-0 card-subtle";
        charBox.textContent = answer.item.char;

        const textMeta = document.createElement("div");
        textMeta.className = "text-left min-w-0";
        const pinyin = PINYIN_MAP[answer.item.char] || "";
        textMeta.innerHTML = `<div class="text-base font-black text-indigo-600">${pinyin}</div><div class="text-xs font-bold text-slate-500 truncate">${answer.item.hint}</div>`;

        leftInfo.append(charBox, textMeta);

        const speakTag = document.createElement("span");
        speakTag.className = "text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold flex-shrink-0";
        speakTag.textContent = "🔊 听音";

        topRow.append(leftInfo, speakTag);

        const verdict = document.createElement("div");
        verdict.className = "result-verdict";
        const cs = getCharStats(stats, answer.item.char);
        const reviewText = cs.nextReviewDate ? formatDateDisplay(cs.nextReviewDate) : "待定";
        verdict.innerHTML = `<span>${answer.isCorrect ? "✅ 写对过关" : "❌ 需重练巩固"}</span> <div><span class="level-badge ${cs.level >= 3 ? "level-mastered" : (cs.nextReviewDate <= Date.now() ? "level-due" : "")}">Lv.${cs.level}</span><span class="verdict-review-time" style="font-size: 0.8rem; margin-left: 6px;">下次: ${reviewText}</span></div>`;

        card.append(topRow, verdict);
        els.resultList.appendChild(card);
    });

    const uniqueWrong = getUniqueItems(wrongAnswers.map(a => a.item));
    els.practiceWrongBtn.disabled = uniqueWrong.length === 0;
    els.practiceWrongBtn.textContent =
        uniqueWrong.length === 0
            ? "本次没有错字"
            : `再练本次错字（${uniqueWrong.length}个）`;

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

    if (percentage === 100 && total > 0) {
        setTimeout(() => {
            window.showApiapiaPerfectReward && window.showApiapiaPerfectReward({
                moduleName: "汉字听写与笔顺",
                detail: `本次 ${total} 个字全部过关！`
            });
        }, 350);
    }
}

function showScreen(name) {
    if (name !== "story" && typeof stopStoryReading === "function") {
        stopStoryReading();
    }
    if (typeof clearStoryCharHighlights === "function") {
        clearStoryCharHighlights();
    }
    els.setupScreen?.classList.toggle("hidden", name !== "setup");
    els.dictationScreen?.classList.toggle("hidden", name !== "dictation");
    els.choiceScreen?.classList.toggle("hidden", name !== "choice");
    els.storyScreen?.classList.toggle("hidden", name !== "story");
    els.summaryScreen?.classList.toggle("hidden", name !== "summary");

    const bottomNav = document.getElementById("hanziBottomNav");
    if (bottomNav) {
        bottomNav.classList.toggle("hidden", name !== "setup");
    }
    if (name === "summary" && els.resultList) {
        els.resultList.scrollTop = 0;
    }
    window.scrollTo({top: 0, behavior: "smooth"});
}

/* ================== 故事阅读巩固（支持筛段、跳段、点字加入错字本） ================== */

function clearStoryCharHighlights() {
    if (state.storyCharHighlightTimer) {
        clearTimeout(state.storyCharHighlightTimer);
        state.storyCharHighlightTimer = null;
    }
    state.storySpeakingCharIndex = -1;
    if (els.storyText) {
        els.storyText.querySelectorAll(".story-ruby.story-char-speaking, .story-char.story-char-speaking").forEach(el => {
            el.classList.remove("story-char-speaking");
        });
    }
}

function speakStoryCharacter(char, index) {
    if (!char) return;
    const isHanzi = /[\u4e00-\u9fa5]/.test(char) || Boolean(PINYIN_MAP[char]);
    if (!isHanzi) return;

    showStoryCharDetail(char);
    stopStoryReading();
    clearStoryCharHighlights();

    if (typeof index === "number" && index >= 0) {
        state.storySpeakingCharIndex = index;
        const rubyEl = els.storyText?.querySelector(`.story-ruby[data-index="${index}"]`);
        if (rubyEl) rubyEl.classList.add("story-char-speaking");
    }

    state.storyCharHighlightTimer = setTimeout(() => {
        clearStoryCharHighlights();
    }, 1800);

    speakText(getCharSpeechText(char), {
        interrupt: true,
        onend: clearStoryCharHighlights
    });
}

function showStoryCharDetail(char) {
    if (!char) return;
    state.storyDetailChar = char;
    const item = findItem(char);
    const pinyin = PINYIN_MAP[char] || "";
    const stats = loadStats();
    const cs = getCharStats(stats, char);

    els.storyDetailPlaceholder?.classList.add("hidden");
    els.storyDetailContent?.classList.remove("hidden");

    if (els.storyDetailChar) els.storyDetailChar.textContent = char;
    if (els.storyDetailPinyin) els.storyDetailPinyin.textContent = pinyin;
    if (els.storyDetailHint) els.storyDetailHint.textContent = item ? item.hint : "故事常用字";
    updateStoryDetailWrongBtn(cs.inWrongBook);
}

function updateStoryDetailWrongBtn(inWrongBook) {
    const btn = els.storyDetailWrongToggleBtn;
    if (!btn) return;
    if (inWrongBook) {
        btn.textContent = "✅ 已在错字本";
        btn.className = "px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-black border border-emerald-200";
    } else {
        btn.textContent = "📕 加入错字本";
        btn.className = "px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black border border-rose-200";
    }
}

function toggleStoryDetailWrongBook() {
    const char = state.storyDetailChar;
    if (!char) return;
    const stats = loadStats();
    const cs = getCharStats(stats, char);
    const nextState = !cs.inWrongBook;
    setCharWrongBookState(char, nextState);
    updateStoryDetailWrongBtn(nextState);

    els.storyText?.querySelectorAll(`.story-ruby[data-char="${char}"]`).forEach(el => {
        el.classList.toggle("story-ruby-wrong", nextState);
    });

    if (window.kidToast) {
        window.kidToast(
            nextState ? `已将“${char}”加入错字本 📕` : `已将“${char}”移出错字本 👍`,
            nextState ? "info" : "success"
        );
    }
}

function getStoryParagraphIndicesForFilter(filter) {
    if (typeof STORY_SENTENCES === "undefined" || !Array.isArray(STORY_SENTENCES)) return [];
    const allIndices = STORY_SENTENCES.map((_, idx) => idx);
    if (filter === "all") return allIndices;

    const stats = loadStats();
    if (filter === "wrong") {
        const wrongSet = new Set(getWrongCharacters(stats).map(w => w.char));
        if (wrongSet.size === 0) return [];
        return allIndices.filter(idx => Array.from(STORY_SENTENCES[idx]).some(c => wrongSet.has(c)));
    }
    if (filter === "new") {
        const newSet = new Set(
            HANZI_DATA.filter(item => {
                const cs = getCharStats(stats, item.char);
                return (cs.practiced || 0) === 0 || isRecentAddition(item.char);
            }).map(item => item.char)
        );
        if (newSet.size === 0) return [];
        return allIndices.filter(idx => Array.from(STORY_SENTENCES[idx]).some(c => newSet.has(c)));
    }
    return allIndices;
}

function updateStoryFilterButtonsUI() {
    els.storyFilterAllBtn?.classList.toggle("active", state.storyFilter === "all");
    els.storyFilterWrongBtn?.classList.toggle("active", state.storyFilter === "wrong");
    els.storyFilterNewBtn?.classList.toggle("active", state.storyFilter === "new");
}

function populateStoryJumpSelect() {
    if (!els.storyJumpSelect) return;
    els.storyJumpSelect.innerHTML = "";
    state.storyFilteredIndices.forEach((actualIdx, pos) => {
        const opt = document.createElement("option");
        opt.value = String(pos);
        const raw = STORY_SENTENCES[actualIdx] || "";
        const preview = raw.slice(0, 12) + (raw.length > 12 ? "…" : "");
        opt.textContent = `第 ${actualIdx + 1} 段 · ${preview}`;
        els.storyJumpSelect.appendChild(opt);
    });
    els.storyJumpSelect.value = String(state.storyFilteredPos);
}

function setStoryFilter(filter, preferredActualIndex = null) {
    let indices = getStoryParagraphIndicesForFilter(filter);
    let actualFilter = filter;

    if (indices.length === 0 && filter !== "all") {
        if (window.kidToast) {
            window.kidToast(
                filter === "wrong" ? "错字本目前为空，已为您显示全部段落 🎉" : "暂无匹配的新字段落，已为您显示全部段落 🎉",
                "info"
            );
        }
        actualFilter = "all";
        indices = getStoryParagraphIndicesForFilter("all");
    }

    state.storyFilter = actualFilter;
    state.storyFilteredIndices = indices;
    updateStoryFilterButtonsUI();

    let pos = 0;
    if (preferredActualIndex !== null) {
        const foundPos = indices.indexOf(preferredActualIndex);
        if (foundPos >= 0) pos = foundPos;
    }
    renderStoryParagraphByPos(pos);
}

function splitStoryIntoChunks(text) {
    const chunks = [];
    const chars = Array.from(text);
    let start = 0;
    chars.forEach((char, idx) => {
        if (/[，。！？；：、,.!?;]/.test(char) || idx === chars.length - 1) {
            let end = idx + 1;
            while (end < chars.length && /[”’」』）)]/.test(chars[end])) end += 1;
            const piece = chars.slice(start, end).join("");
            if (/[一-龥]/.test(piece)) chunks.push({text: piece, start, end});
            start = end;
        }
    });
    return chunks;
}

function highlightStoryRange(start, end) {
    els.storyText?.querySelectorAll(".story-ruby.story-reading").forEach(el => {
        el.classList.remove("story-reading");
    });
    if (start === undefined) return;
    els.storyText?.querySelectorAll(".story-ruby").forEach(el => {
        const idx = Number(el.dataset.index);
        if (idx >= start && idx < end) el.classList.add("story-reading");
    });
}

function renderStoryParagraphByPos(pos) {
    if (typeof STORY_SENTENCES === "undefined" || !Array.isArray(STORY_SENTENCES) || STORY_SENTENCES.length === 0) {
        return;
    }
    if (!state.storyFilteredIndices || state.storyFilteredIndices.length === 0) {
        state.storyFilteredIndices = STORY_SENTENCES.map((_, i) => i);
    }
    if (pos < 0) pos = 0;
    if (pos >= state.storyFilteredIndices.length) pos = state.storyFilteredIndices.length - 1;

    state.storyFilteredPos = pos;
    const index = state.storyFilteredIndices[pos];
    state.storyIndex = index;

    if (state.storyFilter === "all") {
        try {
            localStorage.setItem(STORY_PROGRESS_KEY, String(index));
        } catch (_) {}
    }

    stopAllSpeech();
    stopStoryReading();
    clearStoryCharHighlights();
    state.currentStory = STORY_SENTENCES[index];

    const stats = loadStats();
    const wrongCharSet = new Set(getWrongCharacters(stats).map(w => w.char));

    if (els.storyText) {
        els.storyText.innerHTML = "";
        els.storyText.classList.toggle("show-pinyin", Boolean(state.showStoryPinyin));
        const chars = Array.from(state.currentStory);
        const NO_BREAK_BEFORE = new Set(["，", "。", "！", "？", "、", "；", "：", "”", "’", "）", "》", "】", "…", "—", ",", ".", "!", "?", ";", ":", ")", "]", "}"]);
        const NO_BREAK_AFTER = new Set(["“", "‘", "（", "《", "【", "(", "[", "{"]);
        chars.forEach((char, idx) => {
            const isHanzi = /[\u4e00-\u9fa5]/.test(char) || Boolean(PINYIN_MAP[char]);
            if (isHanzi) {
                const ruby = document.createElement("ruby");
                ruby.className = "story-ruby";
                if (wrongCharSet.has(char)) {
                    ruby.classList.add("story-ruby-wrong");
                }
                ruby.dataset.index = String(idx);
                ruby.dataset.char = char;
                ruby.setAttribute("role", "button");
                ruby.setAttribute("tabindex", "0");

                const span = document.createElement("span");
                span.className = "story-char";
                span.textContent = char;
                ruby.appendChild(span);

                const pinyin = PINYIN_MAP[char] || "";
                const rt = document.createElement("rt");
                rt.className = "story-rt";
                rt.textContent = pinyin;
                ruby.appendChild(rt);

                ruby.title = pinyin ? `${char} [${pinyin}] 点击查看词组并听发音` : `${char} 点击发音`;
                els.storyText.appendChild(ruby);
            } else {
                const punct = document.createElement("span");
                punct.className = "story-punct";
                punct.textContent = char;
                els.storyText.appendChild(punct);
            }

            if (idx < chars.length - 1) {
                const nextChar = chars[idx + 1];
                if (!NO_BREAK_AFTER.has(char) && !NO_BREAK_BEFORE.has(nextChar)) {
                    els.storyText.appendChild(document.createElement("wbr"));
                }
            }
        });
    }

    if (els.storyPinyinBtn) {
        els.storyPinyinBtn.textContent = state.showStoryPinyin ? "隐藏拼音" : "显示拼音";
    }

    if (els.storyCurrentNumber) els.storyCurrentNumber.textContent = pos + 1;
    if (els.storyTotalNumber) els.storyTotalNumber.textContent = state.storyFilteredIndices.length;

    if (els.storyFilterBadge) {
        if (state.storyFilter === "all") {
            els.storyFilterBadge.classList.add("hidden");
        } else {
            els.storyFilterBadge.classList.remove("hidden");
            els.storyFilterBadge.textContent = `原第 ${index + 1} 段`;
        }
    }

    populateStoryJumpSelect();

    if (els.storyPrevBtn) {
        const isFirst = (pos === 0);
        els.storyPrevBtn.disabled = isFirst;
        els.storyPrevBtn.classList.toggle("opacity-50", isFirst);
        els.storyPrevBtn.classList.toggle("cursor-not-allowed", isFirst);
    }
    if (els.storyNextBtn) {
        const isLast = (pos === state.storyFilteredIndices.length - 1);
        els.storyNextBtn.textContent = isLast ? "🎉 回到第一段" : "下一段 →";
    }
}

function nextStoryParagraph() {
    if (state.storyFilteredPos >= state.storyFilteredIndices.length - 1) {
        renderStoryParagraphByPos(0);
    } else {
        renderStoryParagraphByPos(state.storyFilteredPos + 1);
    }
}

function prevStoryParagraph() {
    if (state.storyFilteredPos > 0) {
        renderStoryParagraphByPos(state.storyFilteredPos - 1);
    }
}

function startStory() {
    let savedIndex = 0;
    try {
        savedIndex = parseInt(localStorage.getItem(STORY_PROGRESS_KEY) || "0", 10);
    } catch (_) {}
    if (isNaN(savedIndex) || savedIndex < 0 || (typeof STORY_SENTENCES !== "undefined" && savedIndex >= STORY_SENTENCES.length)) {
        savedIndex = 0;
    }
    setStoryFilter("all", savedIndex);
    showScreen("story");
}

function toggleStoryPinyin() {
    state.showStoryPinyin = !state.showStoryPinyin;
    els.storyText?.classList.toggle("show-pinyin", state.showStoryPinyin);
    if (els.storyPinyinBtn) {
        els.storyPinyinBtn.textContent = state.showStoryPinyin ? "隐藏拼音" : "显示拼音";
    }
}

function speakStory() {
    if (!("speechSynthesis" in window) && typeof Audio === "undefined") {
        alertSpeechNotSupported();
        return;
    }

    stopStoryReading();
    clearStoryCharHighlights();

    const chunks = splitStoryIntoChunks(state.currentStory);
    const readToken = ++state.storyReadToken;
    const speakChunk = index => {
        if (readToken !== state.storyReadToken) return;
        if (index >= chunks.length) {
            highlightStoryRange();
            return;
        }
        const chunk = chunks[index];
        highlightStoryRange(chunk.start, chunk.end);
        speakText(chunk.text, {
            interrupt: index === 0,
            onend: () => speakChunk(index + 1)
        });
    };
    speakChunk(0);
}

function stopStoryReading() {
    state.storyReadToken += 1;
    highlightStoryRange();
}

/* ================== 已学汉字累计墙 ================== */

function getWallStatus(cs) {
    if (cs.inWrongBook) return "wrong";
    if ((cs.practiced || 0) === 0) return "new";
    if ((cs.level || 0) >= 3) return "mastered";
    return "learning";
}

function setWallFilter(filter) {
    state.wallFilter = filter;
    const mapping = [
        [els.wallFilterAll, "all"],
        [els.wallFilterNew, "new"],
        [els.wallFilterWrong, "wrong"],
        [els.wallFilterLearning, "learning"],
        [els.wallFilterMastered, "mastered"]
    ];
    mapping.forEach(([btn, key]) => btn?.classList.toggle("active", key === filter));
    renderHanziWall(loadStats());
}

function inspectWallChar(char, {speak = false} = {}) {
    state.wallSelectedChar = char;
    const item = findItem(char);
    if (!item || !els.wallCharInspector) return;

    const stats = loadStats();
    const cs = getCharStats(stats, char);
    const pinyin = PINYIN_MAP[char] || "";
    const rate = cs.practiced > 0 ? Math.round((cs.correct / cs.practiced) * 100) : 0;

    if (els.wallInspectorChar) els.wallInspectorChar.textContent = char;
    if (els.wallInspectorPinyin) els.wallInspectorPinyin.textContent = pinyin;
    if (els.wallInspectorHint) els.wallInspectorHint.textContent = item.hint;
    if (els.wallInspectorMeta) {
        els.wallInspectorMeta.textContent = cs.practiced > 0
            ? `Lv.${cs.level || 0} · 练习 ${cs.practiced} 次 · 正确率 ${rate}% · ${formatDateDisplay(cs.nextReviewDate)}`
            : `新加入待练习 · Lv.${cs.level || 1}`;
    }

    if (els.wallInspectorWrongBtn) {
        if (cs.inWrongBook) {
            els.wallInspectorWrongBtn.textContent = "✅ 移出错字";
            els.wallInspectorWrongBtn.className = "px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-black border border-emerald-200";
        } else {
            els.wallInspectorWrongBtn.textContent = "📕 加入错字";
            els.wallInspectorWrongBtn.className = "px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black border border-rose-200";
        }
    }

    els.wallCharInspector.classList.remove("hidden");
    els.hanziWallGrid?.querySelectorAll(".hanzi-wall-cell").forEach(cell => {
        cell.classList.toggle("selected", cell.dataset.char === char);
    });

    if (speak) speakSingleCharacter(char);
}

function renderHanziWall(stats = loadStats()) {
    if (!els.hanziWallGrid || typeof HANZI_DATA === "undefined") return;
    if (els.wallTotalCount) els.wallTotalCount.textContent = HANZI_DATA.length;

    const filteredItems = HANZI_DATA.filter(item => {
        if (state.wallFilter === "all") return true;
        return getWallStatus(getCharStats(stats, item.char)) === state.wallFilter;
    });

    els.hanziWallGrid.innerHTML = "";
    if (filteredItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "col-span-full py-6 text-center text-xs sm:text-sm text-slate-400 font-bold";
        empty.textContent = "当前筛选下暂无汉字 🎉";
        els.hanziWallGrid.appendChild(empty);
        return;
    }

    filteredItems.forEach(item => {
        const cs = getCharStats(stats, item.char);
        const status = getWallStatus(cs);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.dataset.char = item.char;
        cell.className = `hanzi-wall-cell status-${status}${state.wallSelectedChar === item.char ? " selected" : ""}`;
        cell.textContent = item.char;
        cell.title = `${item.char} [${PINYIN_MAP[item.char] || ""}] · ${item.hint} (Lv.${cs.level || 0})`;

        if (status === "new" || status === "wrong" || status === "mastered") {
            const dot = document.createElement("span");
            dot.className = "wall-dot";
            cell.appendChild(dot);
        }

        cell.addEventListener("click", () => inspectWallChar(item.char, {speak: true}));
        els.hanziWallGrid.appendChild(cell);
    });

    if (state.wallSelectedChar && !els.wallCharInspector?.classList.contains("hidden")) {
        inspectWallChar(state.wallSelectedChar, {speak: false});
    }
}

/* ================== 退出与重置 ================== */

async function quitSession() {
    const confirmed = await window.kidConfirmExitPractice({
        title: "退出听写？",
        message: "确定要退出听写吗？已经判定过的题目会保留记录。",
        confirmText: "确定退出",
        cancelText: "继续练习"
    });
    if (!confirmed) return;

    stopAllSpeech();
    clearIpadStrokeWriter();
    clearAnswerStroke();
    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    if (state.questionUnlockTimer) {
        clearTimeout(state.questionUnlockTimer);
        state.questionUnlockTimer = null;
    }
    state.reviewLocked = false;
    showScreen("setup");
    refreshHomeStats();
}

async function quitChoice() {
    const confirmed = await window.kidConfirmExitPractice({
        title: "退出选字游戏？",
        message: "确定要退出选字游戏吗？",
        confirmText: "确定退出",
        cancelText: "继续练习"
    });
    if (!confirmed) return;
    stopAllSpeech();
    showScreen("setup");
    refreshHomeStats();
}

async function resetAllData() {
    const confirmed = await window.kidConfirm({
        title: "清空全部学习记录？",
        message: "确定要清空全部学习记录吗？错字本和累计成绩都会被删除，此操作不能恢复。",
        icon: "🗑️",
        type: "danger",
        confirmText: "确定清空",
        cancelText: "取消"
    });

    if (!confirmed) return;

    const freshStats = getDefaultStats();
    freshStats.resetAt = Date.now();
    saveStats(freshStats);
    refreshHomeStats();
    window.kidToast("学习记录已经清空啦！", "success");
}

/* ================== 事件绑定 ================== */

els.startBtn?.addEventListener("click", () => startSession());
els.choiceStartBtn?.addEventListener("click", () => startChoice());
els.storyStartBtn?.addEventListener("click", startStory);

els.dictationModeIpadBtn?.addEventListener("click", () => setDictationWriteMode("ipad"));
els.dictationModePaperBtn?.addEventListener("click", () => setDictationWriteMode("paper"));
els.ipadOutlineHideBtn?.addEventListener("click", () => setIpadOutlineMode(false));
els.ipadOutlineShowBtn?.addEventListener("click", () => setIpadOutlineMode(true));
els.ipadHintStrokeBtn?.addEventListener("click", hintIpadStroke);
els.ipadResetStrokeBtn?.addEventListener("click", retryIpadQuiz);
els.ipadGiveUpBtn?.addEventListener("click", giveUpAndShowStroke);
els.ipadRetryQuizBtn?.addEventListener("click", retryIpadQuiz);
els.ipadAssistWrongNextBtn?.addEventListener("click", () => recordAnswer(false));
els.ipadMarkWrongBtn?.addEventListener("click", () => recordAnswer(false));
els.ipadNextBtn?.addEventListener("click", () => recordAnswer(true));

els.speakBtn?.addEventListener("click", speakCurrent);
els.showAnswerBtn?.addEventListener("click", submitPaperWriting);
els.replayAnswerStrokeBtn?.addEventListener("click", replayAnswerStroke);
els.correctBtn?.addEventListener("click", () => recordAnswer(true));
els.wrongBtn?.addEventListener("click", () => recordAnswer(false));
els.quitBtn?.addEventListener("click", quitSession);

els.choiceSpeakBtn?.addEventListener("click", speakChoiceCurrent);
els.choiceFeedback?.addEventListener("click", nextChoiceQuestion);
els.quitChoiceBtn?.addEventListener("click", quitChoice);

els.storyFilterAllBtn?.addEventListener("click", () => setStoryFilter("all", state.storyIndex));
els.storyFilterWrongBtn?.addEventListener("click", () => setStoryFilter("wrong", state.storyIndex));
els.storyFilterNewBtn?.addEventListener("click", () => setStoryFilter("new", state.storyIndex));
els.storyJumpSelect?.addEventListener("change", event => {
    const pos = parseInt(event.target.value, 10);
    if (!isNaN(pos)) renderStoryParagraphByPos(pos);
});
els.storyDetailSpeakBtn?.addEventListener("click", () => {
    if (state.storyDetailChar) speakSingleCharacter(state.storyDetailChar);
});
els.storyDetailWrongToggleBtn?.addEventListener("click", toggleStoryDetailWrongBook);

els.storyPinyinBtn?.addEventListener("click", toggleStoryPinyin);
els.storySpeakBtn?.addEventListener("click", speakStory);
els.storyPrevBtn?.addEventListener("click", prevStoryParagraph);
els.storyNextBtn?.addEventListener("click", nextStoryParagraph);
els.quitStoryBtn?.addEventListener("click", () => {
    stopAllSpeech();
    stopStoryReading();
    clearStoryCharHighlights();
    showScreen("setup");
    refreshHomeStats();
});

els.storyText?.addEventListener("click", event => {
    const rubyEl = event.target.closest(".story-ruby");
    if (!rubyEl) return;
    const char = rubyEl.dataset.char;
    const idx = parseInt(rubyEl.dataset.index, 10);
    speakStoryCharacter(char, idx);
});

els.storyText?.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        const rubyEl = event.target.closest(".story-ruby");
        if (rubyEl) {
            event.preventDefault();
            const char = rubyEl.dataset.char;
            const idx = parseInt(rubyEl.dataset.index, 10);
            speakStoryCharacter(char, idx);
        }
    }
});

els.wallFilterAll?.addEventListener("click", () => setWallFilter("all"));
els.wallFilterNew?.addEventListener("click", () => setWallFilter("new"));
els.wallFilterWrong?.addEventListener("click", () => setWallFilter("wrong"));
els.wallFilterLearning?.addEventListener("click", () => setWallFilter("learning"));
els.wallFilterMastered?.addEventListener("click", () => setWallFilter("mastered"));
els.wallInspectorSpeakBtn?.addEventListener("click", () => {
    if (state.wallSelectedChar) speakSingleCharacter(state.wallSelectedChar);
});
els.wallInspectorWrongBtn?.addEventListener("click", () => {
    if (!state.wallSelectedChar) return;
    const stats = loadStats();
    const cs = getCharStats(stats, state.wallSelectedChar);
    const nextState = !cs.inWrongBook;
    setCharWrongBookState(state.wallSelectedChar, nextState);
    if (window.kidToast) {
        window.kidToast(
            nextState ? `已将“${state.wallSelectedChar}”加入错字本 📕` : `已将“${state.wallSelectedChar}”移出错字本 👍`,
            nextState ? "info" : "success"
        );
    }
});
els.wallInspectorCloseBtn?.addEventListener("click", () => {
    state.wallSelectedChar = "";
    els.wallCharInspector?.classList.add("hidden");
    els.hanziWallGrid?.querySelectorAll(".hanzi-wall-cell.selected").forEach(cell => cell.classList.remove("selected"));
});

els.backHomeBtn?.addEventListener("click", () => {
    stopAllSpeech();
    showScreen("setup");
    refreshHomeStats();
});

els.practiceWrongBtn?.addEventListener("click", () => {
    if (state.mode === "choice") {
        const wrongItems = getUniqueItems(state.choiceAnswers
            .filter(answer => !answer.isCorrect)
            .map(answer => answer.item));
        if (wrongItems.length > 0) startChoice(wrongItems);
        return;
    }

    const wrongItems = getUniqueItems(state.answers
        .filter(answer => !answer.isCorrect)
        .map(answer => answer.item));
    if (wrongItems.length > 0) startSession(wrongItems);
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
        if (state.mode === "choice") {
            startChoice();
        } else {
            startSession();
        }
    });
}

els.resetDataBtn?.addEventListener("click", resetAllData);

els.openSettingsBtn?.addEventListener("click", openSettingsModal);
els.closeSettingsBtn?.addEventListener("click", closeSettingsModal);
els.confirmSettingsBtn?.addEventListener("click", closeSettingsModal);
els.modalBackdrop?.addEventListener("click", closeSettingsModal);
els.speechMode?.addEventListener("change", saveSpeechSettings);
els.speechRate?.addEventListener("change", saveSpeechSettings);
els.testSpeechBtn?.addEventListener("click", previewSpeech);

els.openSyncBtn?.addEventListener("click", openSyncModal);
els.closeSyncBtn?.addEventListener("click", closeSyncModal);
els.confirmSyncBtn?.addEventListener("click", closeSyncModal);
els.syncModalBackdrop?.addEventListener("click", closeSyncModal);
els.pushSyncBtn?.addEventListener("click", () => pushToCloud(false));
els.pullSyncBtn?.addEventListener("click", () => pullFromCloud(false));
els.syncKeyInput?.addEventListener("change", saveSyncConfigFromUI);
els.autoSyncCheckbox?.addEventListener("change", saveSyncConfigFromUI);

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

    const dictationActive = !els.dictationScreen.classList.contains("hidden");
    const choiceActive = !els.choiceScreen.classList.contains("hidden");
    const storyActive = !els.storyScreen.classList.contains("hidden");

    if (!dictationActive && !choiceActive && !storyActive) return;

    if (event.code === "Space") {
        event.preventDefault();
        if (dictationActive) speakCurrent();
        else if (choiceActive) speakChoiceCurrent();
        else if (storyActive) speakStory();
    }

    if (dictationActive) {
        if (state.dictationWriteMode === "paper") {
            if (event.key === "Enter" && !els.paperPromptBox.classList.contains("hidden") && !els.showAnswerBtn.disabled) {
                submitPaperWriting();
            }
            if (!els.answerPanel.classList.contains("hidden") && !state.reviewLocked) {
                if (event.key === "ArrowLeft") recordAnswer(false);
                if (event.key === "ArrowRight") recordAnswer(true);
            }
        } else {
            if (event.key === "Enter" && state.ipadQuizCompleted && !state.reviewLocked) {
                recordAnswer(true);
            }
            if (!els.ipadCompleteBar.classList.contains("hidden") && !state.reviewLocked) {
                if (event.key === "ArrowLeft") recordAnswer(false);
                if (event.key === "ArrowRight") recordAnswer(true);
            }
        }
    }

    if (choiceActive) {
        const optionButtons = els.choiceOptions?.querySelectorAll("button.choice-option");
        if (event.key >= "1" && event.key <= "5" && optionButtons) {
            const idx = parseInt(event.key, 10) - 1;
            if (optionButtons[idx] && !optionButtons[idx].disabled) {
                optionButtons[idx].click();
            }
        } else if (event.key === "Enter" && els.choiceFeedback && !els.choiceFeedback.classList.contains("hidden")) {
            nextChoiceQuestion();
        }
    }

    if (storyActive) {
        if (event.key === "ArrowLeft") prevStoryParagraph();
        if (event.key === "ArrowRight") nextStoryParagraph();
    }
});

if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    const refreshVoices = () => {
        cachedChineseVoice = undefined;
        getChineseVoice();
    };
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
    setTimeout(refreshVoices, 250);
    setTimeout(refreshVoices, 800);
    setTimeout(refreshVoices, 1600);
}

if (typeof window !== "undefined") {
    window.addEventListener("touchstart", unlockAudioAndTTS, {once: true, capture: true, passive: true});
    window.addEventListener("touchend", unlockAudioAndTTS, {once: true, capture: true, passive: true});
    window.addEventListener("click", unlockAudioAndTTS, {once: true, capture: true, passive: true});
}

loadDictationPreferences();
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
        btn.className = `flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation relative ${isActive ? "text-indigo-600 font-black" : "text-slate-400 hover:text-slate-600 font-bold"}`;
        const icon = btn.querySelector(".text-xl, .text-2xl");
        if (icon) icon.className = `text-xl sm:text-2xl transition-transform ${isActive ? "scale-110" : "opacity-75"}`;
        const indicator = btn.querySelector(".nav-indicator");
        if (indicator) indicator.className = `nav-indicator w-6 h-1 rounded-full mt-0.5 ${isActive ? "bg-indigo-600" : "bg-transparent"}`;
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
        window.kidToast("错字本目前为空，太棒啦！🎉", "success");
        return;
    }
    startSession(wrongChars);
});

document.getElementById("practiceWrongChoiceBtn")?.addEventListener("click", () => {
    const stats = loadStats();
    const wrongChars = getWrongCharacters(stats);
    if (wrongChars.length === 0) {
        window.kidToast("错字本目前为空，太棒啦！🎉", "success");
        return;
    }
    startChoice(wrongChars);
});

document.getElementById("clearWrongBookBtn")?.addEventListener("click", () => {
    clearWrongBook();
});

document.getElementById("emptyStateGoPracticeBtn")?.addEventListener("click", () => {
    switchHomeTab("practice");
});

window.addEventListener("apiapia-theme-changed", () => {
    if (!els.dictationScreen.classList.contains("hidden") && state.session && state.session[state.currentIndex]) {
        const currentItem = state.session[state.currentIndex];
        if (state.dictationWriteMode === "ipad" && !state.ipadQuizCompleted) {
            startDictationIpadQuiz(currentItem);
        }
        if (state.dictationWriteMode === "paper" && els.answerPanel && !els.answerPanel.classList.contains("hidden")) {
            renderAnswerStroke(currentItem.char);
        }
    }
});
