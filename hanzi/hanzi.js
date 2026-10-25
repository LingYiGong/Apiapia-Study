"use strict";

const STORAGE_KEY = "hanziDictationStatsV1";
const STROKE_PROGRESS_KEY = "hanziStrokeProgressV1";
const STROKE_ORDER_KEY = "hanziStrokeOrderV1";
const SPEECH_SETTINGS_KEY = "hanziSpeechSettingsV1";
const SYNC_KEY_STORAGE = "hanziSyncKeyV1";
const AUTO_SYNC_STORAGE = "hanziAutoSyncV1";
const LAST_SYNC_TIME_KEY = "hanziLastSyncTimeV1";
const STORY_PROGRESS_KEY = "hanziStoryProgressV2";

let debounceSyncTimer = null;

const state = {
    mode: "dictation",
    isWrongPractice: false,
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
    storyIndex: 0,
    showStoryPinyin: false,
    storySpeakingCharIndex: -1,
    storyCharHighlightTimer: null,
    storyReadToken: 0,
    currentUtterance: null,
    strokeSession: [],
    strokeIndex: 0,
    strokeWriter: null,
    strokeRenderToken: 0,
    strokeMode: "watch",
    strokeStartToken: 0,
    reviewLocked: false,
    reviewUnlockTimer: null,
    questionUnlockTimer: null,
    recognitionLocked: false,
    recognitionUnlockTimer: null
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
    wrongbookEmptyState: document.getElementById("wrongbookEmptyState"),
    wrongbookActions: document.getElementById("wrongbookActions"),
    wrongTabCountBadge: document.getElementById("wrongTabCountBadge"),
    clearWrongBookBtn: document.getElementById("clearWrongBookBtn"),
    emptyStateGoPracticeBtn: document.getElementById("emptyStateGoPracticeBtn"),
    practiceWrongRecognitionBtn: document.getElementById("practiceWrongRecognitionBtn"),
    practiceWrongChoiceBtn: document.getElementById("practiceWrongChoiceBtn"),

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
    storyCurrentNumber: document.getElementById("storyCurrentNumber"),
    storyTotalNumber: document.getElementById("storyTotalNumber"),
    storyText: document.getElementById("storyText"),
    storyPinyin: document.getElementById("storyPinyin"),
    storyPinyinBtn: document.getElementById("storyPinyinBtn"),
    storySpeakBtn: document.getElementById("storySpeakBtn"),
    storyPrevBtn: document.getElementById("storyPrevBtn"),
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
    strokeWatchBtn: document.getElementById("strokeWatchBtn"),
    strokeQuizBtn: document.getElementById("strokeQuizBtn"),
    strokeFeedback: document.getElementById("strokeFeedback"),
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

function isDueForReview(charStats) {
    return (Number(charStats.nextReviewDate) || 0) <= Date.now();
}

// 生成“答对/答错后会怎样”的提示文字
function getReviewPredictText(charStats, correctVerb, wrongVerb) {
    const level = Number(charStats.level) || 0;
    const correctPart = isDueForReview(charStats)
        ? `✅ ${correctVerb}升至 Lv.${level + 1}（${getNextReviewDays(level + 1)}复习）`
        : `✅ ${correctVerb}保持 Lv.${level}（还没到复习时间，算加练）`;
    return `${correctPart} · ❌ ${wrongVerb}重置为 Lv.0 并本轮追加重练`;
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
        if (!silent) {
            if (window.kidAlert) {
                window.kidAlert({
                    title: "同步提示",
                    message: "请先输入专属同步密钥 (Sync Key)！",
                    icon: "💡",
                    type: "warning"
                });
            } else {
                alert("请先输入专属同步密钥 (Sync Key)！");
            }
        }
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

        // 推送前先与云端合并，避免另一台设备上较新的进度被旧数据覆盖
        let stats = loadStats();
        try {
            const cloudRes = await fetch("/api/hanzi/sync", {headers: {"X-Sync-Key": key}});
            const cloudJson = await cloudRes.json();
            const cloudStats = cloudJson?.success && cloudJson.data?.stats;
            if (cloudStats && typeof cloudStats === "object") {
                stats = mergeStats(stats, cloudStats);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
                refreshHomeStats();
            }
        } catch (error) {
            console.warn("推送前读取云端数据失败，将直接推送本地数据：", error);
        }

        const res = await fetch("/api/hanzi/sync", {
            method: "POST",
            headers: {"Content-Type": "application/json", "X-Sync-Key": key},
            body: JSON.stringify({
                stats,
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
            if (!silent) {
                if (window.kidToast) {
                    window.kidToast("☁️ 已成功推送到云端备份！", "success");
                } else {
                    alert("☁️ 已成功将本地学习数据推送到云端备份！");
                }
            }
        } else {
            setSyncStatus("error", json.message || "同步失败");
            if (!silent) {
                if (window.kidAlert) {
                    window.kidAlert({
                        title: "推送失败",
                        message: "推送云端失败：" + (json.message || json.error || "未知错误"),
                        icon: "⚠️",
                        type: "warning"
                    });
                } else {
                    alert("推送云端失败：" + (json.message || json.error || "未知错误"));
                }
            }
        }
    } catch (err) {
        setSyncStatus("error", "网络或接口异常");
        if (!silent) {
            if (window.kidAlert) {
                window.kidAlert({
                    title: "网络异常",
                    message: "推送失败，请检查网络连接或 Cloudflare 部署状态：" + err.message,
                    icon: "⚠️",
                    type: "danger"
                });
            } else {
                alert("推送失败，请检查网络连接或 Cloudflare 部署状态：" + err.message);
            }
        }
    }
}

function getRecordTime(record) {
    if (!record) return 0;
    return Number(record.updatedAt) || Date.parse(record.lastPracticed || "") || 0;
}

// 按字合并本地与云端记录：每个字取最近一次更新的那份，避免多设备之间互相覆盖丢失进度。
// resetAt 之前的记录视为已被“清空全部记录”删除。
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
    const key = (els.syncKeyInput ? els.syncKeyInput.value.trim() : "") || (localStorage.getItem(SYNC_KEY_STORAGE) || "").trim();
    if (!key) {
        if (!silent) {
            if (window.kidAlert) {
                window.kidAlert({
                    title: "同步提示",
                    message: "请先输入专属同步密钥 (Sync Key)！",
                    icon: "💡",
                    type: "warning"
                });
            } else {
                alert("请先输入专属同步密钥 (Sync Key)！");
            }
        }
        return;
    }

    if (!silent && window.kidConfirm) {
        const ok = await window.kidConfirm({
            title: "拉取云端进度？",
            message: "从云端拉取将覆盖本地当前的汉字学习记录与错字本，确定要拉取吗？",
            icon: "⬇️",
            type: "warning",
            confirmText: "确定拉取",
            cancelText: "取消"
        });
        if (!ok) return;
    }

    setSyncStatus("syncing", "正在拉取...");
    try {
        const res = await fetch("/api/hanzi/sync", {headers: {"X-Sync-Key": key}});
        const json = await res.json();

        if (json.success && json.data) {
            const cloudData = json.data;
            if (cloudData.stats && typeof cloudData.stats === "object") {
                const merged = mergeStats(loadStats(), cloudData.stats);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                // 本地有比云端更新的记录时，把合并结果推回云端
                if (!statsEqual(merged, cloudData.stats)) triggerAutoSync();
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
                if (window.kidToast) {
                    window.kidToast(`☁️ 已拉取云端数据（练习 ${total} 次，错字本 ${wrong} 个）`, "success");
                } else {
                    alert(`☁️ 已成功拉取云端数据！（累计练习 ${total} 次，错字本 ${wrong} 个）`);
                }
            }
        } else if (json.success && !json.data) {
            setSyncStatus("success", "云端暂无数据");
            if (!silent) {
                if (window.kidAlert) {
                    window.kidAlert({
                        title: "云端暂无数据",
                        message: "该密钥在云端尚无记录，您可以先点击【推送到云端】进行初次备份！",
                        icon: "💡",
                        type: "info"
                    });
                } else {
                    alert("该密钥在云端尚无记录，您可以先点击【推送到云端】进行初次备份！");
                }
            }
        } else {
            setSyncStatus("error", json.message || "拉取失败");
            if (!silent) {
                if (window.kidAlert) {
                    window.kidAlert({
                        title: "拉取失败",
                        message: "拉取失败：" + (json.message || json.error || "未知错误"),
                        icon: "⚠️",
                        type: "warning"
                    });
                } else {
                    alert("拉取失败：" + (json.message || json.error || "未知错误"));
                }
            }
        }
    } catch (err) {
        setSyncStatus("error", "网络或接口异常");
        if (!silent) {
            if (window.kidAlert) {
                window.kidAlert({
                    title: "网络异常",
                    message: "拉取失败，请检查网络连接或 Cloudflare 部署状态：" + err.message,
                    icon: "⚠️",
                    type: "danger"
                });
            } else {
                alert("拉取失败，请检查网络连接或 Cloudflare 部署状态：" + err.message);
            }
        }
    }
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
    if (!("speechSynthesis" in window)) {
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
        // 只有到了复习时间再答对才升级；提前加练答对不改变排期，避免一天内连刷升到高等级后很久不复习
        if (isDueForReview(charStats)) {
            newLevel = oldLevel + 1;
            charStats.level = newLevel;
            charStats.nextReviewDate = calculateNextReview(newLevel);
        }
        // 关键修复：如果在错字本专项练习中攻克，或连续答对 streak>=2 或升级至 Lv.2+，自动移出错字本！
        if (state.isWrongPractice || charStats.streak >= 2 || newLevel >= 2) {
            charStats.inWrongBook = false;
        }
    } else {
        charStats.wrong += 1;
        charStats.streak = 0;
        newLevel = 0;
        charStats.level = 0;
        charStats.nextReviewDate = Date.now(); // 设为今日待复习
        charStats.inWrongBook = true;
    }

    stats.characters[item.char] = charStats;
    saveStats(stats);
    return { oldLevel, newLevel, nextReviewDate: charStats.nextReviewDate };
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

function speakSingleCharacter(char) {
    if (!char) return;
    speakText(getCharSpeechText(char));
}

function removeFromWrongBook(char) {
    const stats = loadStats();
    const charStats = getCharStats(stats, char);
    charStats.inWrongBook = false;
    charStats.updatedAt = Date.now();
    stats.characters[char] = charStats;
    saveStats(stats);
    refreshHomeStats();
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

    let ok = false;
    if (window.kidConfirm) {
        ok = await window.kidConfirm({
            title: "清空错字本？",
            message: `确定要清空全部 ${wrongChars.length} 个错字记录吗？清空后错字本将重置为空。`,
            icon: "🗑️",
            type: "danger",
            confirmText: "确定清空",
            cancelText: "取消"
        });
    } else {
        ok = window.confirm(`确定要清空全部 ${wrongChars.length} 个错字记录吗？`);
    }

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
            if (window.kidToast) {
                window.kidToast("🎉 今日艾宾浩斯待复习汉字已全部完成！已切换至全部汉字练习", "success");
            } else {
                alert("🎉 今日艾宾浩斯待复习汉字已全部完成！已为您切换至全部汉字练习。");
            }
            pool = [...HANZI_DATA];
        }
    } else if (selectedCategory === "wrong") {
        pool = getWrongCharacters(stats);
        if (pool.length === 0) {
            if (window.kidToast) {
                window.kidToast("错字本还是空的，太棒了！已为您切换至今日待复习 👏", "success");
            } else {
                alert("错字本还是空的，太棒了！已为您切换至今日待复习。");
            }
            pool = getDueCharacters(stats);
            if (pool.length === 0) pool = [...HANZI_DATA];
        }
    } else if (selectedCategory === "all") {
        pool = HANZI_DATA;
    } else {
        pool = HANZI_DATA.filter(item => item.category === selectedCategory);
    }

    const count = Math.min(requestedCount, pool.length);

    // 先挑到期的字（等级低、逾期久的优先），不足再补未到期的字；选出后打乱出题顺序
    return shuffle(prioritizeForReview(pool, stats).slice(0, count));
}

function prioritizeForReview(items, stats) {
    const now = Date.now();
    return shuffle(items)
        .map(item => ({item, cs: getCharStats(stats, item.char)}))
        .sort((a, b) => {
            const aDue = (a.cs.nextReviewDate || 0) <= now;
            const bDue = (b.cs.nextReviewDate || 0) <= now;
            if (aDue !== bDue) return aDue ? -1 : 1;
            if (!aDue) return 0;
            const levelDiff = (a.cs.level || 0) - (b.cs.level || 0);
            if (levelDiff !== 0) return levelDiff;
            return (a.cs.nextReviewDate || 0) - (b.cs.nextReviewDate || 0);
        })
        .map(entry => entry.item);
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

    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    state.reviewLocked = false;

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
    // 防误触：新题目切出时短暂禁用核对按钮350ms，防止上一题连击误触
    els.showAnswerBtn.disabled = true;
    if (state.questionUnlockTimer) {
        clearTimeout(state.questionUnlockTimer);
    }
    state.questionUnlockTimer = setTimeout(() => {
        els.showAnswerBtn.disabled = false;
        state.questionUnlockTimer = null;
    }, 350);

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
    const isDark = document.documentElement.classList.contains("dark");
    context.strokeStyle = isDark ? "#f8fafc" : "#1e293b";
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

let cachedChineseVoice;

// 优先选择自然、清晰的普通话女声；排除粤语(zh-HK)，避免小朋友听到非普通话读音
function getChineseVoice() {
    if (cachedChineseVoice !== undefined) return cachedChineseVoice;
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
        if (/Natural|Online|Neural/i.test(name)) score += 30;
        if (/Xiaoxiao|Xiaoyi|晓晓|晓伊/i.test(name)) score += 20;
        if (/Google/i.test(name)) score += 15;
        if (/Tingting|Ting-Ting|婷婷|Lili|Meijia/i.test(name)) score += 10;
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

// 统一朗读入口：所有模式都通过这里发音，保证语音、语速一致
function speakText(text, {rate, onstart, onend, interrupt = true} = {}) {
    if (!text || !("speechSynthesis" in window)) return null;
    if (interrupt) window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate || getSpeechRate();
    utterance.pitch = 1.05;
    utterance.volume = 1;
    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;
    if (onstart) utterance.onstart = onstart;
    utterance.onend = () => onend?.();
    utterance.onerror = event => {
        if (event.error !== "interrupted" && event.error !== "canceled") {
            console.warn("语音播放失败：", event.error);
        }
        onend?.();
    };
    // 保留引用，避免部分浏览器在播放中途回收对象导致 onend 不触发
    state.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return utterance;
}

function isPolyphone(char) {
    return typeof POLYPHONE_CHARS === "string" && POLYPHONE_CHARS.includes(char);
}

// 从“头发的发”这类提示中取出词语“头发”
function getHintWord(item) {
    if (!item || !item.hint) return "";
    const suffix = `的${item.char}`;
    const word = item.hint.endsWith(suffix) ? item.hint.slice(0, -suffix.length) : "";
    return word.includes(item.char) ? word : "";
}

function findItem(char) {
    return HANZI_DATA.find(item => item.char === char) || null;
}

// 单字发音：多音字/轻声字改读词语，避免语音引擎读错
function getCharSpeechText(char) {
    const item = findItem(char);
    if (item && isPolyphone(char)) {
        const word = getHintWord(item);
        if (word) return word;
    }
    return char;
}

// 按“朗读方式”设置生成题目读音
function getItemSpeechText(item, mode = state.speechMode) {
    const word = isPolyphone(item.char) ? getHintWord(item) : "";
    const lead = word || item.char;
    if (mode === "char") return lead;
    if (mode === "twice") return `${lead}。${lead}。`;
    return `${lead}。${item.hint}。`;
}

function speakCurrent() {
    const item = state.session[state.currentIndex];

    if (!item) return;
    if (!("speechSynthesis" in window)) {
        alertSpeechNotSupported();
        return;
    }
    speakText(getItemSpeechText(item), {rate: state.speechRate});
}

function lockVerdictButtons(duration = 650) {
    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    state.reviewLocked = true;
    if (els.wrongBtn) els.wrongBtn.disabled = true;
    if (els.correctBtn) els.correctBtn.disabled = true;

    state.reviewUnlockTimer = setTimeout(() => {
        state.reviewLocked = false;
        if (els.wrongBtn) els.wrongBtn.disabled = false;
        if (els.correctBtn) els.correctBtn.disabled = false;
        state.reviewUnlockTimer = null;
    }, duration);
}

function submitWriting() {
    if (els.showAnswerBtn.disabled) return;
    els.showAnswerBtn.disabled = true;
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

    const isDark = document.documentElement.classList.contains("dark");
    state.answerStrokeWriter = HanziWriter.create(els.answerStrokeWriter, char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.08),
        showOutline: true,
        showCharacter: false,
        strokeColor: isDark ? "#60a5fa" : "#1e293b",
        outlineColor: isDark ? "#475569" : "#d7dbe3",
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
    if (els.dictationEbPredictText) {
        els.dictationEbPredictText.textContent = getReviewPredictText(cs, "写对了将", "记错了");
    }

    els.answerPanel.classList.remove("hidden");
    els.showAnswerBtn.classList.add("hidden");
    els.writingArea.classList.add("hidden");
    els.speakBtn.closest(".listen-area").classList.add("hidden");

    // 防误触/防双击：展示核对答案面板时锁定对错按钮650ms，防止连击误点直接跳下一题
    lockVerdictButtons(650);

    renderAnswerStroke(item.char);
}

function recordAnswer(isCorrect) {
    if (state.reviewLocked) return;
    state.reviewLocked = true;
    if (state.reviewUnlockTimer) {
        clearTimeout(state.reviewUnlockTimer);
        state.reviewUnlockTimer = null;
    }
    if (els.wrongBtn) els.wrongBtn.disabled = true;
    if (els.correctBtn) els.correctBtn.disabled = true;

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


function lockRecognitionButtons(duration = 500) {
    if (state.recognitionUnlockTimer) {
        clearTimeout(state.recognitionUnlockTimer);
        state.recognitionUnlockTimer = null;
    }
    state.recognitionLocked = true;
    if (els.recognitionWrongBtn) els.recognitionWrongBtn.disabled = true;
    if (els.recognitionCorrectBtn) els.recognitionCorrectBtn.disabled = true;

    state.recognitionUnlockTimer = setTimeout(() => {
        state.recognitionLocked = false;
        if (els.recognitionWrongBtn) els.recognitionWrongBtn.disabled = false;
        if (els.recognitionCorrectBtn) els.recognitionCorrectBtn.disabled = false;
        state.recognitionUnlockTimer = null;
    }, duration);
}

function startRecognition(customItems = null) {
    const items = customItems || createSession();
    if (!items || items.length === 0) return;

    state.isWrongPractice = Boolean(customItems) || (els.categorySelect && els.categorySelect.value === "wrong");

    if (state.recognitionUnlockTimer) {
        clearTimeout(state.recognitionUnlockTimer);
        state.recognitionUnlockTimer = null;
    }
    state.recognitionLocked = false;

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

    if (state.recognitionUnlockTimer) {
        clearTimeout(state.recognitionUnlockTimer);
        state.recognitionUnlockTimer = null;
    }
    state.recognitionLocked = false;

    els.recognitionCurrentNumber.textContent = state.recognitionIndex + 1;
    els.recognitionTotalNumber.textContent = state.recognitionSession.length;
    els.recognitionProgressBar.style.width =
        `${((state.recognitionIndex + 1) / state.recognitionSession.length) * 100}%`;

    els.recognitionChar.textContent = item.char;
    els.recognitionTapTip.textContent = "读完了？点我听听对不对 🔊";
    els.recognitionPinyin.textContent = "";
    els.recognitionHint.textContent = "";

    updateLevelBadge(els.recognitionLevelBadge, item.char);

    const stats = loadStats();
    const cs = getCharStats(stats, item.char);
    if (els.recognitionEbPredictText) {
        els.recognitionEbPredictText.textContent = getReviewPredictText(cs, "读对了将", "没读出");
    }

    els.recognitionReveal.classList.add("hidden");
}

function speakRecognitionCurrent() {
    const item = state.recognitionSession[state.recognitionIndex];

    if (!item) return;
    if (!("speechSynthesis" in window)) {
        alertSpeechNotSupported();
        return;
    }

    speakText(getItemSpeechText(item), {rate: state.speechRate});

    els.recognitionPinyin.textContent = PINYIN_MAP[item.char] || "";
    els.recognitionHint.textContent = item.hint;
    els.recognitionTapTip.textContent = "🔊 再点可以重听";
    els.recognitionReveal.classList.remove("hidden");
    // 防误触：展开判定选项时锁定判定按钮500ms
    lockRecognitionButtons(500);
}

function recordRecognitionAnswer(isCorrect) {
    if (state.recognitionLocked) return;
    state.recognitionLocked = true;
    if (state.recognitionUnlockTimer) {
        clearTimeout(state.recognitionUnlockTimer);
        state.recognitionUnlockTimer = null;
    }
    if (els.recognitionWrongBtn) els.recognitionWrongBtn.disabled = true;
    if (els.recognitionCorrectBtn) els.recognitionCorrectBtn.disabled = true;

    const item = state.recognitionSession[state.recognitionIndex];

    state.recognitionAnswers.push({
        item,
        isCorrect
    });

    updateStatsForAnswer(item, isCorrect);
    if (isCorrect) playSuccessSound();

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
    if (state.recognitionUnlockTimer) {
        clearTimeout(state.recognitionUnlockTimer);
        state.recognitionUnlockTimer = null;
    }
    state.recognitionLocked = false;

    const correctCount =
        state.recognitionAnswers.filter(answer => answer.isCorrect).length;
    const total = state.recognitionAnswers.length;
    const percentage =
        total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const unfamiliarAnswers =
        state.recognitionAnswers.filter(answer => !answer.isCorrect);

    els.scoreText.textContent = `${percentage}%`;
    els.scoreRing.style.background =
        `conic-gradient(var(--primary) ${percentage}%, var(--ring-empty, #e7ebf3) ${percentage}%)`;

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

    const uniqueUnfamiliar = getUniqueItems(unfamiliarAnswers.map(a => a.item));
    els.practiceWrongBtn.disabled = uniqueUnfamiliar.length === 0;
    els.practiceWrongBtn.textContent =
        uniqueUnfamiliar.length === 0
            ? "本轮全部会读"
            : `再练不会的字（${uniqueUnfamiliar.length}个）`;

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
                moduleName: "汉字快速认读",
                detail: `本轮 ${total} 个汉字全部都会读！`
            });
        }, 350);
    }
}

// COMMON_HANZI 前段是 2500 个一级常用字，“蔼”起是 1000 个次常用字（如“糠”“蔗”），
// 对小朋友来说过于生僻，干扰项只从一级常用字里挑
function getDistractorPool() {
    if (typeof COMMON_HANZI !== "string" || COMMON_HANZI.length === 0) return "";
    const secondaryStart = COMMON_HANZI.indexOf("蔼");
    return secondaryStart > 0 ? COMMON_HANZI.slice(0, secondaryStart) : COMMON_HANZI;
}

// 获取常用汉字集合中的随机汉字（从3500常用字中挑选，排除已学汉字和指定排除字符）
function getRandomCommonHanzi(excludeSet) {
    const pool = getDistractorPool();

    if (pool.length > 0) {
        let attempts = 0;
        while (attempts < 200) {
            attempts++;
            const idx = Math.floor(Math.random() * pool.length);
            const char = pool[idx];
            if (!excludeSet.has(char)) {
                return char;
            }
        }
    }

    // 备用兜底策略（若字库未能正常加载，在标准 CJK 统一表意字区安全选取）
    const MIN_CODE = 0x4e00;
    const MAX_CODE = 0x9fa5;
    while (true) {
        const code = Math.floor(Math.random() * (MAX_CODE - MIN_CODE + 1)) + MIN_CODE;
        const char = String.fromCharCode(code);
        if (!excludeSet.has(char)) {
            return char;
        }
    }
}

function getChoiceOptions(item) {
    const excludeSet = new Set();
    // 排除目标汉字
    if (item && item.char) {
        excludeSet.add(item.char);
    }

    // 排除所有已学过的汉字 (HANZI_DATA 与历史学习记录中存在的所有字)
    if (typeof HANZI_DATA !== "undefined" && Array.isArray(HANZI_DATA)) {
        HANZI_DATA.forEach(candidate => {
            if (candidate && candidate.char) excludeSet.add(candidate.char);
        });
    }
    try {
        const stats = loadStats();
        if (stats && stats.characters) {
            Object.keys(stats.characters).forEach(c => excludeSet.add(c));
        }
    } catch (_) {}

    // 1 个正确目标字 + 4 个从常用汉字库中随机抽取的未学干扰汉字 (共 5 个选项，难度适中且符合儿童认知)
    const options = [item];
    while (options.length < 5) {
        const distractorChar = getRandomCommonHanzi(excludeSet);
        excludeSet.add(distractorChar);
        options.push({ char: distractorChar });
    }

    return shuffle(options);
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
    // 选字题必须带提示词，才能区分同音字（如“青”和“清”）
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

// 答对时的“叮咚”上行音，给小朋友即时的正向鼓励
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
        // 柔和的低音“嘟嘟”，提示选错但不吓到小朋友
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
    // 点到本题目标字时按设置带提示词朗读，其他干扰字只读字音
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
        // 选择正确后，再次点击选项中的汉字（包括其他干扰字或目标字），播放对应汉字的读音
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
        // 选错后自动再播一次正确读音，引导小朋友重新辨认
        const choiceIndex = state.choiceIndex;
        setTimeout(() => {
            if (state.choiceIndex === choiceIndex && !state.choiceLocked) speakChoiceCurrent();
        }, 650);
        return;
    }

    state.choiceLocked = true;
    button.classList.add("correct-choice");
    // 选对后，重新启用所有选项按钮，使点击其他任意汉字都能听到读音
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

    // 选对后先响“叮咚”，再读一遍这个字，让字形和读音在脑中连起来
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
    window.speechSynthesis?.cancel?.();
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
        els.resultList.appendChild(chip);
    });
    const uniqueWrong = getUniqueItems(wrongAnswers.map(a => a.item));
    els.practiceWrongBtn.disabled = uniqueWrong.length === 0;
    els.practiceWrongBtn.textContent = uniqueWrong.length
        ? `再练本轮易错字（${uniqueWrong.length}个）`
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

    if (percentage === 100 && total > 0) {
        setTimeout(() => {
            window.showApiapiaPerfectReward && window.showApiapiaPerfectReward({
                moduleName: "汉字听音选字",
                detail: `本轮 ${total} 题全部一次选对！`
            });
        }, 350);
    }
}

function finishSession() {
    window.speechSynthesis?.cancel?.();
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
            empty.className = "result-standard bg-slate-50/50";
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
        verdict.innerHTML = `<span>${answer.isCorrect ? "✅ 写对了" : "❌ 写错了"}</span> <span class="level-badge ${cs.level >= 3 ? "level-mastered" : (cs.nextReviewDate <= Date.now() ? "level-due" : "")}" style="margin-left: 8px;">Lv.${cs.level}</span><span class="verdict-review-time" style="font-size: 0.82rem; margin-left: 6px;">下次: ${reviewText}</span>`;
        card.append(comparison, verdict);
        els.resultList.appendChild(card);
    });

    const uniqueWrong = getUniqueItems(wrongAnswers.map(a => a.item));
    els.practiceWrongBtn.disabled = uniqueWrong.length === 0;
    els.practiceWrongBtn.textContent =
        uniqueWrong.length === 0
            ? "本轮没有错字"
            : `再练本轮错字（${uniqueWrong.length}个）`;

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
                moduleName: "汉字听写默写",
                detail: `本轮 ${total} 个字全部默写正确！`
            });
        }, 350);
    }
}

function showScreen(name) {
    if (typeof clearStoryCharHighlights === "function") {
        clearStoryCharHighlights();
    }
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
    if (name === "summary" && els.resultList) {
        els.resultList.scrollTop = 0;
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

function setStrokeMode(mode) {
    if (state.strokeMode === mode) return;
    state.strokeMode = mode;
    renderStrokeCharacter({silent: true});
}

function updateStrokeModeButtons() {
    const isQuiz = state.strokeMode === "quiz";
    els.strokeWatchBtn?.classList.toggle("active", !isQuiz);
    els.strokeQuizBtn?.classList.toggle("active", isQuiz);
    els.strokeWatchBtn?.setAttribute("aria-pressed", String(!isQuiz));
    els.strokeQuizBtn?.setAttribute("aria-pressed", String(isQuiz));
}

function setStrokeFeedback(text, type = "") {
    if (!els.strokeFeedback) return;
    els.strokeFeedback.textContent = text;
    els.strokeFeedback.className = `stroke-feedback ${type}`;
}

// “我来写”：小朋友用手指在田字格里按笔顺描写，写错两次后自动提示下一笔
function startStrokeQuiz(item, renderToken) {
    const writer = state.strokeWriter;
    if (!writer) return;
    let strokeTotal = 0;
    setStrokeFeedback("跟着灰色的字，一笔一笔写出来吧！", "");
    writer.quiz({
        leniency: 1.3,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onCorrectStroke: data => {
            if (renderToken !== state.strokeRenderToken) return;
            strokeTotal = data.strokeNum + 1 + data.strokesRemaining;
            setStrokeFeedback(`写对了！第 ${data.strokeNum + 1} / ${strokeTotal} 笔 👍`, "good");
        },
        onMistake: data => {
            if (renderToken !== state.strokeRenderToken) return;
            const tip = data.mistakesOnStroke >= 2 ? "看看闪烁的提示，照着写～" : "笔顺不对哦，再试一次～";
            setStrokeFeedback(tip, "oops");
        },
        onComplete: data => {
            if (renderToken !== state.strokeRenderToken) return;
            const perfect = data.totalMistakes === 0;
            setStrokeFeedback(
                perfect ? `太棒了！“${item.char}”一笔都没写错！🌟` : `写完啦！“${item.char}”写好了 🎉`,
                "done"
            );
            playSuccessSound();
            setTimeout(() => {
                if (renderToken === state.strokeRenderToken) speakStrokeCharacter(item.char);
            }, 500);
        }
    });
}

function renderStrokeCharacter({silent = false} = {}) {
    const item = state.strokeSession[state.strokeIndex];
    if (!item) return;

    const renderToken = ++state.strokeRenderToken;
    const isQuiz = state.strokeMode === "quiz";
    updateStrokeModeButtons();
    els.strokeGrid.classList.toggle("quiz-mode", isQuiz);
    setStrokeFeedback(isQuiz ? "" : "仔细看笔顺，跟着动画用手指在空中写一写。");
    state.strokeWriter?.cancelQuiz?.();
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
    if (!silent) speakStrokeCharacter(item.char);

    if (typeof HanziWriter === "undefined") {
        els.strokeStatus.textContent = "笔画组件加载失败，请检查网络后刷新页面。";
        return;
    }

    const size = Math.round(els.strokeGrid.getBoundingClientRect().width);
    const isDark = document.documentElement.classList.contains("dark");
    state.strokeWriter = HanziWriter.create(els.strokeWriter, item.char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.09),
        showOutline: true,
        showCharacter: false,
        strokeColor: isDark ? "#60a5fa" : "#20242c",
        outlineColor: isDark ? "#475569" : "#d7dbe3",
        drawingColor: isDark ? "#f8fafc" : "#1e293b",
        drawingWidth: Math.max(14, Math.round(size / 18)),
        highlightColor: "#f59e0b",
        strokeAnimationSpeed: 0.65,
        delayBetweenStrokes: 650,
        delayBetweenLoops: 1800,
        onLoadCharDataSuccess: () => {
            if (renderToken !== state.strokeRenderToken) return;
            els.strokeStatus.classList.add("hidden");
            if (isQuiz) {
                startStrokeQuiz(item, renderToken);
            } else {
                state.strokeWriter.loopCharacterAnimation();
            }
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
    if (!char) return;
    const item = findItem(char);
    speakText(item ? getItemSpeechText(item, "hint") : char);
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

async function quitStrokePractice() {
    if (window.kidConfirmExitPractice) {
        const confirmed = await window.kidConfirmExitPractice({
            title: "退出笔顺临摹？",
            message: "确定要退出本轮笔顺临摹练习吗？",
            confirmText: "确定退出",
            cancelText: "继续练习"
        });
        if (!confirmed) return;
    }
    state.strokeStartToken += 1;
    state.strokeRenderToken += 1;
    state.strokeWriter?.cancelQuiz?.();
    state.strokeWriter?.pauseAnimation?.();
    state.strokeWriter = null;
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
}

function clearStoryCharHighlights() {
    if (state.storyCharHighlightTimer) {
        clearTimeout(state.storyCharHighlightTimer);
        state.storyCharHighlightTimer = null;
    }
    state.storySpeakingCharIndex = -1;
    stopStoryReading();
    if (els.storyText) {
        els.storyText.querySelectorAll(".story-ruby.story-char-speaking, .story-char.story-char-speaking").forEach(el => {
            el.classList.remove("story-char-speaking");
        });
    }
}

function speakStoryCharacter(char, index) {
    if (!char || !("speechSynthesis" in window)) return;
    const isHanzi = /[\u4e00-\u9fa5]/.test(char) || Boolean(PINYIN_MAP[char]);
    if (!isHanzi) return;

    window.speechSynthesis.cancel();
    clearStoryCharHighlights();

    if (typeof index === "number" && index >= 0) {
        state.storySpeakingCharIndex = index;
        const rubyEl = els.storyText?.querySelector(`.story-ruby[data-index="${index}"]`);
        if (rubyEl) rubyEl.classList.add("story-char-speaking");
    }

    state.storyCharHighlightTimer = setTimeout(() => {
        clearStoryCharHighlights();
    }, 1500);

    speakText(getCharSpeechText(char), {
        interrupt: false,
        onend: clearStoryCharHighlights
    });
}

// 把一段故事按标点切成短句，逐句朗读并高亮，方便小朋友指读；
// 同时避免部分浏览器朗读长文本超过约15秒被截断
function splitStoryIntoChunks(text) {
    const chunks = [];
    const chars = Array.from(text);
    let start = 0;
    chars.forEach((char, idx) => {
        if (/[，。！？；：、,.!?;]/.test(char) || idx === chars.length - 1) {
            let end = idx + 1;
            // 把紧跟的右引号并入本句
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

function renderStoryParagraph(index) {
    if (typeof STORY_SENTENCES === "undefined" || !Array.isArray(STORY_SENTENCES) || STORY_SENTENCES.length === 0) {
        return;
    }
    if (index < 0) index = 0;
    if (index >= STORY_SENTENCES.length) index = STORY_SENTENCES.length - 1;
    state.storyIndex = index;
    try {
        localStorage.setItem(STORY_PROGRESS_KEY, String(index));
    } catch (_) {}

    window.speechSynthesis?.cancel?.();
    clearStoryCharHighlights();
    state.currentStory = STORY_SENTENCES[index];
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

                ruby.title = pinyin ? `${char} [${pinyin}] 点击发音` : `${char} 点击发音`;
                els.storyText.appendChild(ruby);
            } else {
                const punct = document.createElement("span");
                punct.className = "story-punct";
                punct.textContent = char;
                els.storyText.appendChild(punct);
            }

            // 在相邻字符之间插入零宽换行断点 <wbr>，彻底解决 iOS Safari 下连续 ruby 元素被当作不可分割长词导致无法换行溢出的问题
            if (idx < chars.length - 1) {
                const nextChar = chars[idx + 1];
                if (!NO_BREAK_AFTER.has(char) && !NO_BREAK_BEFORE.has(nextChar)) {
                    els.storyText.appendChild(document.createElement("wbr"));
                }
            }
        });
    }

    if (els.storyPinyin) {
        els.storyPinyin.innerHTML = "";
        els.storyPinyin.classList.add("hidden");
    }

    if (els.storyPinyinBtn) {
        els.storyPinyinBtn.textContent = state.showStoryPinyin ? "隐藏拼音" : "显示拼音";
    }

    if (els.storyCurrentNumber) els.storyCurrentNumber.textContent = index + 1;
    if (els.storyTotalNumber) els.storyTotalNumber.textContent = STORY_SENTENCES.length;

    if (els.storyPrevBtn) {
        const isFirst = (index === 0);
        els.storyPrevBtn.disabled = isFirst;
        els.storyPrevBtn.classList.toggle("opacity-50", isFirst);
        els.storyPrevBtn.classList.toggle("cursor-not-allowed", isFirst);
    }
    if (els.storyNextBtn) {
        const isLast = (index === STORY_SENTENCES.length - 1);
        els.storyNextBtn.textContent = isLast ? "🎉 重新开始" : "下一段 →";
    }
}

function nextStoryParagraph() {
    if (state.storyIndex >= STORY_SENTENCES.length - 1) {
        renderStoryParagraph(0);
    } else {
        renderStoryParagraph(state.storyIndex + 1);
    }
}

function prevStoryParagraph() {
    if (state.storyIndex > 0) {
        renderStoryParagraph(state.storyIndex - 1);
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
    renderStoryParagraph(savedIndex);
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
    if (!("speechSynthesis" in window)) {
        alertSpeechNotSupported();
        return;
    }

    window.speechSynthesis.cancel();
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
            interrupt: false,
            onend: () => speakChunk(index + 1)
        });
    };
    speakChunk(0);
}

function stopStoryReading() {
    state.storyReadToken += 1;
    highlightStoryRange();
}

async function quitSession() {
    if (window.kidConfirmExitPractice) {
        const confirmed = await window.kidConfirmExitPractice({
            title: "退出本轮听写？",
            message: "确定要退出本轮听写吗？已经判定过的题目会保留记录。",
            confirmText: "确定退出",
            cancelText: "继续练习"
        });
        if (!confirmed) return;
    } else {
        const confirmed = confirm("确定要退出本轮听写吗？已经判定过的题目会保留记录。");
        if (!confirmed) return;
    }

    window.speechSynthesis?.cancel?.();
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


async function quitRecognition() {
    if (window.kidConfirmExitPractice) {
        const confirmed = await window.kidConfirmExitPractice({
            title: "退出认读练习？",
            message: "确定要退出本轮认读练习吗？",
            confirmText: "确定退出",
            cancelText: "继续练习"
        });
        if (!confirmed) return;
    } else {
        const confirmed = confirm("确定要退出本轮认读练习吗？");
        if (!confirmed) return;
    }

    window.speechSynthesis?.cancel?.();
    if (state.recognitionUnlockTimer) {
        clearTimeout(state.recognitionUnlockTimer);
        state.recognitionUnlockTimer = null;
    }
    state.recognitionLocked = false;
    showScreen("setup");
    refreshHomeStats();
}

async function quitChoice() {
    if (window.kidConfirmExitPractice) {
        const confirmed = await window.kidConfirmExitPractice({
            title: "退出选字游戏？",
            message: "确定要退出本轮选字游戏吗？",
            confirmText: "确定退出",
            cancelText: "继续练习"
        });
        if (!confirmed) return;
    } else {
        if (!confirm("确定要退出本轮选字游戏吗？")) return;
    }
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
    refreshHomeStats();
}

async function resetAllData() {
    let confirmed = false;
    if (window.kidConfirm) {
        confirmed = await window.kidConfirm({
            title: "清空全部学习记录？",
            message: "确定要清空全部学习记录吗？错字本和累计成绩都会被删除，此操作不能恢复。",
            icon: "🗑️",
            type: "danger",
            confirmText: "确定清空",
            cancelText: "取消"
        });
    } else {
        confirmed = confirm(
            "确定要清空全部学习记录吗？错字本和累计成绩都会被删除，此操作不能恢复。"
        );
    }

    if (!confirmed) return;

    // 记录清空时间，云端同步合并时会丢弃这之前的旧记录
    const freshStats = getDefaultStats();
    freshStats.resetAt = Date.now();
    localStorage.removeItem(STROKE_PROGRESS_KEY);
    saveStats(freshStats);
    refreshHomeStats();
    if (window.kidToast) {
        window.kidToast("学习记录已经清空啦！", "success");
    } else {
        alert("学习记录已经清空。");
    }
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
els.storyPrevBtn?.addEventListener("click", prevStoryParagraph);
els.storyNextBtn?.addEventListener("click", nextStoryParagraph);
els.quitStoryBtn.addEventListener("click", () => {
    window.speechSynthesis?.cancel?.();
    clearStoryCharHighlights();
    showScreen("setup");
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
els.previousStrokeBtn.addEventListener("click", showPreviousStrokeCharacter);
els.strokeWatchBtn?.addEventListener("click", () => setStrokeMode("watch"));
els.strokeQuizBtn?.addEventListener("click", () => setStrokeMode("quiz"));
els.nextStrokeBtn.addEventListener("click", showNextStrokeCharacter);
els.quitStrokeBtn.addEventListener("click", quitStrokePractice);

els.backHomeBtn.addEventListener("click", () => {
    window.speechSynthesis?.cancel?.();
    showScreen("setup");
    refreshHomeStats();
});

els.practiceWrongBtn.addEventListener("click", () => {
    if (state.mode === "recognition") {
        const unfamiliarItems = getUniqueItems(state.recognitionAnswers
            .filter(answer => !answer.isCorrect)
            .map(answer => answer.item));

        if (unfamiliarItems.length > 0) {
            startRecognition(unfamiliarItems);
        }
        return;
    }

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
            !els.showAnswerBtn.classList.contains("hidden") &&
            !els.showAnswerBtn.disabled
        ) {
            submitWriting();
        }

        if (!els.answerPanel.classList.contains("hidden") && !state.reviewLocked) {
            if (event.key === "ArrowLeft") recordAnswer(false);
            if (event.key === "ArrowRight") recordAnswer(true);
        }
    }

    if (
        recognitionActive &&
        !els.recognitionReveal.classList.contains("hidden") &&
        !state.recognitionLocked
    ) {
        if (event.key === "ArrowLeft") recordRecognitionAnswer(false);
        if (event.key === "ArrowRight") recordRecognitionAnswer(true);
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

    if (strokeActive) {
        if (event.key === "ArrowLeft") showPreviousStrokeCharacter();
        if (event.key === "ArrowRight") showNextStrokeCharacter();
    }

    if (storyActive) {
        if (event.key === "ArrowLeft") prevStoryParagraph();
        if (event.key === "ArrowRight") nextStoryParagraph();
    }
});

if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        cachedChineseVoice = undefined;
        getChineseVoice();
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
        if (window.kidToast) {
            window.kidToast("错字本目前为空，太棒啦！🎉", "success");
        } else {
            alert("错字本目前为空，太棒啦！");
        }
        return;
    }
    startSession(wrongChars);
});

document.getElementById("practiceWrongRecognitionBtn")?.addEventListener("click", () => {
    const stats = loadStats();
    const wrongChars = getWrongCharacters(stats);
    if (wrongChars.length === 0) {
        if (window.kidToast) {
            window.kidToast("错字本目前为空，太棒啦！🎉", "success");
        } else {
            alert("错字本目前为空，太棒啦！");
        }
        return;
    }
    startRecognition(wrongChars);
});

document.getElementById("practiceWrongChoiceBtn")?.addEventListener("click", () => {
    const stats = loadStats();
    const wrongChars = getWrongCharacters(stats);
    if (wrongChars.length === 0) {
        if (window.kidToast) {
            window.kidToast("错字本目前为空，太棒啦！🎉", "success");
        } else {
            alert("错字本目前为空，太棒啦！");
        }
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

// 监听全局夜间护眼模式切换，即时刷新手写画笔与笔画演示色彩
window.addEventListener('apiapia-theme-changed', () => {
    if (typeof redrawWriting === "function" && els.writingCanvas) {
        redrawWriting();
    }
    if (state.strokeWriter && !els.strokeScreen.classList.contains("hidden")) {
        renderStrokeCharacter({silent: true});
    }
    // 答题面板展示时，即时刷新标准笔顺动画色彩与手写答卷对比图
    if (els.answerPanel && !els.answerPanel.classList.contains("hidden") && state.session && state.session[state.currentIndex]) {
        if (typeof renderAnswerStroke === "function") {
            renderAnswerStroke(state.session[state.currentIndex].char);
        }
        if (state.strokes.length > 0 && els.currentWritingPreview && !els.currentWritingPreview.classList.contains("hidden")) {
            captureWriting();
            els.currentWritingPreview.src = state.currentWriting;
        }
    }
});
