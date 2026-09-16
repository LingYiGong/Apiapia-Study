// 核心高频生活动词 100 词库
const words = [
    { english: "can", chinese: "能，可以" },
    { english: "will", chinese: "将，会" },
    { english: "should", chinese: "应该" },
    { english: "may", chinese: "可能，可以" },
    { english: "must", chinese: "必须" },
    { english: "would", chinese: "会，将会" },
    { english: "could", chinese: "可以，能够" },
    { english: "might", chinese: "可能" },
    { english: "shall", chinese: "将，要" },
    { english: "need", chinese: "需要" },

    { english: "want", chinese: "想要" },
    { english: "like", chinese: "喜欢" },
    { english: "know", chinese: "知道，认识" },
    { english: "think", chinese: "认为，想" },
    { english: "feel", chinese: "感觉" },
    { english: "see", chinese: "看见" },
    { english: "look", chinese: "看" },
    { english: "watch", chinese: "观看" },
    { english: "hear", chinese: "听见" },
    { english: "listen", chinese: "听" },

    { english: "say", chinese: "说" },
    { english: "tell", chinese: "告诉" },
    { english: "speak", chinese: "说话" },
    { english: "talk", chinese: "谈话" },
    { english: "ask", chinese: "问" },
    { english: "answer", chinese: "回答" },
    { english: "give", chinese: "给" },
    { english: "take", chinese: "拿，带" },
    { english: "get", chinese: "得到，获得" },
    { english: "make", chinese: "制作，使" },

    { english: "do", chinese: "做" },
    { english: "go", chinese: "去" },
    { english: "come", chinese: "来" },
    { english: "use", chinese: "使用" },
    { english: "find", chinese: "找到" },
    { english: "put", chinese: "放" },
    { english: "keep", chinese: "保持" },
    { english: "let", chinese: "让" },
    { english: "help", chinese: "帮助" },
    { english: "try", chinese: "尝试" },

    { english: "start", chinese: "开始" },
    { english: "begin", chinese: "开始" },
    { english: "stop", chinese: "停止" },
    { english: "move", chinese: "移动" },
    { english: "live", chinese: "生活，居住" },
    { english: "work", chinese: "工作" },
    { english: "play", chinese: "玩，播放" },
    { english: "run", chinese: "跑，运行" },
    { english: "walk", chinese: "走路" },
    { english: "eat", chinese: "吃" },

    { english: "drink", chinese: "喝" },
    { english: "buy", chinese: "买" },
    { english: "pay", chinese: "支付" },
    { english: "sell", chinese: "卖" },
    { english: "bring", chinese: "带来" },
    { english: "send", chinese: "发送" },
    { english: "show", chinese: "展示" },
    { english: "read", chinese: "阅读" },
    { english: "write", chinese: "写" },
    { english: "learn", chinese: "学习" },

    { english: "study", chinese: "学习，研究" },
    { english: "teach", chinese: "教" },
    { english: "remember", chinese: "记得" },
    { english: "forget", chinese: "忘记" },
    { english: "understand", chinese: "理解" },
    { english: "believe", chinese: "相信" },
    { english: "hope", chinese: "希望" },
    { english: "love", chinese: "爱" },
    { english: "hate", chinese: "讨厌" },
    { english: "open", chinese: "打开" },

    { english: "close", chinese: "关闭" },
    { english: "turn", chinese: "转动，转弯" },
    { english: "change", chinese: "改变" },
    { english: "stay", chinese: "停留" },
    { english: "leave", chinese: "离开" },
    { english: "return", chinese: "返回" },
    { english: "wait", chinese: "等待" },
    { english: "follow", chinese: "跟随" },
    { english: "call", chinese: "打电话，叫" },
    { english: "meet", chinese: "见面" },

    { english: "win", chinese: "赢" },
    { english: "lose", chinese: "输，失去" },
    { english: "happen", chinese: "发生" },
    { english: "seem", chinese: "似乎" },
    { english: "become", chinese: "成为" },
    { english: "hold", chinese: "拿着，举行" },
    { english: "carry", chinese: "携带" },
    { english: "build", chinese: "建造" },
    { english: "break", chinese: "打破，弄坏" },
    { english: "cut", chinese: "切，剪" },

    { english: "draw", chinese: "画" },
    { english: "drive", chinese: "驾驶" },
    { english: "ride", chinese: "骑乘" },
    { english: "stand", chinese: "站立" },
    { english: "sit", chinese: "坐" },
    { english: "sleep", chinese: "睡觉" },
    { english: "wake", chinese: "醒来" },
    { english: "belong", chinese: "属于" },
    { english: "continue", chinese: "继续" },
    { english: "finish", chinese: "完成" }
];

// 学习记录本地持久化
let progress = JSON.parse(localStorage.getItem("englishWordProgress")) || {};
let currentIndex = 0;
let flipped = false;
let currentFilter = "all";

// 界面元素缓存
let flipCardInner = null;
let cardNumberBadge = null;
let cardStatusBadge = null;
let progressNumber = null;
let cardProgressBar = null;
let wordFront = null;
let wordBack = null;
let meaningBack = null;
let wordList = null;
let listTitle = null;

// 初始化 DOM 引用
function initDOM() {
    flipCardInner = document.getElementById("flipCardInner");
    cardNumberBadge = document.getElementById("cardNumberBadge");
    cardStatusBadge = document.getElementById("cardStatusBadge");
    progressNumber = document.getElementById("progressNumber");
    cardProgressBar = document.getElementById("cardProgressBar");
    wordFront = document.getElementById("wordFront");
    wordBack = document.getElementById("wordBack");
    meaningBack = document.getElementById("meaningBack");
    wordList = document.getElementById("wordList");
    listTitle = document.getElementById("listTitle");
}

// 更新闪卡展示
function updateCard() {
    const current = words[currentIndex];
    if (!current) return;

    if (cardNumberBadge) cardNumberBadge.textContent = `Word #${currentIndex + 101}`;
    if (progressNumber) progressNumber.textContent = `${currentIndex + 1} / ${words.length}`;
    if (cardProgressBar) cardProgressBar.style.width = `${((currentIndex + 1) / words.length) * 100}%`;

    const status = progress[currentIndex];
    if (cardStatusBadge) {
        if (status === "known") {
            cardStatusBadge.textContent = "✓ 已掌握";
            cardStatusBadge.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800";
        } else if (status === "unknown") {
            cardStatusBadge.textContent = "✕ 需复习";
            cardStatusBadge.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800";
        } else {
            cardStatusBadge.textContent = "未判断";
            cardStatusBadge.className = "text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500";
        }
    }

    if (wordFront) wordFront.textContent = current.chinese;
    if (wordBack) wordBack.textContent = current.english;
    if (meaningBack) meaningBack.textContent = current.chinese;

    if (flipCardInner) {
        if (flipped) {
            flipCardInner.classList.add("is-flipped");
            speakWord();
        } else {
            flipCardInner.classList.remove("is-flipped");
        }
    }
}

// 翻转卡片
function toggleFlip() {
    flipped = !flipped;
    updateCard();
}

// 当前词语音朗读
function speakWord() {
    const current = words[currentIndex];
    if (!current || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(current.english);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
}

// 朗读指定文本
function speakText(text) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
}

// 上一个单词
function previousWord() {
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = words.length - 1;
    }
    flipped = false;
    updateCard();
}

// 下一个单词
function nextWord() {
    if (currentIndex < words.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    flipped = false;
    updateCard();
}

// 标记为认识
function markKnown() {
    progress[currentIndex] = "known";
    saveProgress();
    nextWord();
}

// 标记为不认识
function markUnknown() {
    progress[currentIndex] = "unknown";
    saveProgress();
    nextWord();
}

// 保存学习进度
function saveProgress() {
    try {
        localStorage.setItem("englishWordProgress", JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save englishWordProgress:", e);
    }
    updateStats();
    renderList();
}

// 更新统计看板
function updateStats() {
    let known = 0;
    let unknown = 0;
    for (let i = 0; i < words.length; i++) {
        if (progress[i] === "known") known++;
        if (progress[i] === "unknown") unknown++;
    }
    const total = words.length;
    const remaining = total - known - unknown;
    const percent = total > 0 ? Math.round((known / total) * 100) : 0;

    // 顶部 Header 数据更新
    const headTotal = document.getElementById("headTotal");
    const headKnown = document.getElementById("headKnown");
    const headUnknown = document.getElementById("headUnknown");
    const headRemaining = document.getElementById("headRemaining");
    if (headTotal) headTotal.textContent = total;
    if (headKnown) headKnown.textContent = known;
    if (headUnknown) headUnknown.textContent = unknown;
    if (headRemaining) headRemaining.textContent = remaining;

    // 统计面板更新
    const statTotalBox = document.getElementById("statTotalBox");
    const statKnownBox = document.getElementById("statKnownBox");
    const statUnknownBox = document.getElementById("statUnknownBox");
    const statRemainingBox = document.getElementById("statRemainingBox");
    if (statTotalBox) statTotalBox.textContent = total;
    if (statKnownBox) statKnownBox.textContent = known;
    if (statUnknownBox) statUnknownBox.textContent = unknown;
    if (statRemainingBox) statRemainingBox.textContent = remaining;

    // 列表筛选角标更新
    const filterKnownCount = document.getElementById("filterKnownCount");
    const filterUnknownCount = document.getElementById("filterUnknownCount");
    if (filterKnownCount) filterKnownCount.textContent = known;
    if (filterUnknownCount) filterUnknownCount.textContent = unknown;

    // 底部 Tab 徽标更新
    const navUnknownBadge = document.getElementById("navUnknownBadge");
    if (navUnknownBadge) {
        navUnknownBadge.textContent = unknown;
        navUnknownBadge.classList.toggle("hidden", unknown === 0);
    }

    // 掌握率圆环
    const scoreText = document.getElementById("scoreText");
    const scoreRing = document.getElementById("scoreRing");
    if (scoreText) scoreText.textContent = `${percent}%`;
    if (scoreRing) {
        scoreRing.style.background = `conic-gradient(#4f46e5 ${percent}%, #e5e7eb ${percent}%)`;
    }

    const statsSummaryMessage = document.getElementById("statsSummaryMessage");
    if (statsSummaryMessage) {
        if (percent === 100) {
            statsSummaryMessage.textContent = "太厉害了！已全部熟练掌握 100 个核心高频动词！";
        } else if (percent >= 60) {
            statsSummaryMessage.textContent = `已熟练掌握 ${known} 个动词，再巩固一下 ${unknown} 个需复习单词！`;
        } else {
            statsSummaryMessage.textContent = `当前已掌握 ${known} 个，保持翻牌复习节奏！`;
        }
    }
}

// 渲染词库列表
function renderList() {
    if (!wordList) return;
    wordList.innerHTML = "";

    let count = 0;
    words.forEach((item, index) => {
        const status = progress[index];
        if (currentFilter === "known" && status !== "known") return;
        if (currentFilter === "unknown" && status !== "unknown") return;

        count++;
        const itemEl = document.createElement("div");
        itemEl.className = "py-3 px-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer";
        itemEl.onclick = () => {
            currentIndex = index;
            flipped = false;
            switchTab("card");
            updateCard();
        };

        let tagHTML = "";
        if (status === "known") {
            tagHTML = `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">✓ 认识</span>`;
        } else if (status === "unknown") {
            tagHTML = `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">✕ 需复习</span>`;
        } else {
            tagHTML = `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-400">未学</span>`;
        }

        itemEl.innerHTML = `
            <div class="flex items-center space-x-3 min-w-0 pr-2">
                <span class="text-xs text-gray-400 font-mono w-7 flex-shrink-0">#${index + 101}</span>
                <div class="min-w-0">
                    <div class="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                        <span>${item.english}</span>
                        <button onclick="event.stopPropagation(); speakText('${item.english}')" class="text-gray-400 hover:text-indigo-600 text-xs p-1" title="朗读">
                            🔊
                        </button>
                    </div>
                    <div class="text-xs text-gray-500 truncate">${item.chinese}</div>
                </div>
            </div>
            <div class="flex-shrink-0 flex items-center space-x-2">
                ${tagHTML}
                <span class="text-gray-300 text-xs">→</span>
            </div>
        `;
        wordList.appendChild(itemEl);
    });

    if (count === 0) {
        wordList.innerHTML = `
            <div class="p-8 text-center text-gray-400 text-xs space-y-1">
                <div class="text-2xl mb-1">📭</div>
                <div>此分类下暂时没有单词</div>
            </div>
        `;
    }
}

// 切换列表筛选分类
function showList(type) {
    currentFilter = type;
    const btnAll = document.getElementById("tabBtnAll");
    const btnKnown = document.getElementById("tabBtnKnown");
    const btnUnknown = document.getElementById("tabBtnUnknown");

    const activeClass = "flex-1 py-1.5 text-xs font-bold rounded-xl transition-all text-white bg-indigo-600 shadow-sm";
    const inactiveClass = "flex-1 py-1.5 text-xs font-bold rounded-xl transition-all text-gray-600 hover:text-gray-900 bg-gray-50";

    if (btnAll) btnAll.className = type === "all" ? activeClass : inactiveClass;
    if (btnKnown) btnKnown.className = type === "known" ? activeClass : inactiveClass;
    if (btnUnknown) btnUnknown.className = type === "unknown" ? activeClass : inactiveClass;

    if (listTitle) {
        if (type === "all") listTitle.textContent = "全部核心动词 (100)";
        if (type === "known") listTitle.textContent = "已掌握的动词";
        if (type === "unknown") listTitle.textContent = "需复习的动词";
    }

    renderList();
}

// 切换底部 Tab 视图
function switchTab(tabName) {
    const tabCardView = document.getElementById("tabCardView");
    const tabListView = document.getElementById("tabListView");
    const tabStatsView = document.getElementById("tabStatsView");
    const navTabCard = document.getElementById("navTabCard");
    const navTabList = document.getElementById("navTabList");
    const navTabStats = document.getElementById("navTabStats");

    if (!tabCardView) return;

    tabCardView.classList.toggle("hidden", tabName !== "card");
    tabListView?.classList.toggle("hidden", tabName !== "list");
    tabStatsView?.classList.toggle("hidden", tabName !== "stats");

    const updateBtn = (btn, isActive) => {
        if (!btn) return;
        btn.className = `flex flex-col items-center justify-center py-1 transition-all active:scale-95 touch-manipulation relative ${isActive ? 'text-indigo-600 font-bold' : 'text-gray-400 hover:text-gray-600 font-medium'}`;
        const icon = btn.querySelector('.text-xl');
        if (icon) icon.className = `text-xl transition-transform ${isActive ? 'scale-110' : 'opacity-70'}`;
        const indicator = btn.querySelector('.nav-indicator');
        if (indicator) indicator.className = `nav-indicator w-5 h-0.5 rounded-full mt-0.5 ${isActive ? 'bg-indigo-600' : 'bg-transparent'}`;
    };

    updateBtn(navTabCard, tabName === "card");
    updateBtn(navTabList, tabName === "list");
    updateBtn(navTabStats, tabName === "stats");

    if (tabName === "list") {
        renderList();
    }
}

// 清除所有学习记录
function clearProgress() {
    if (!confirm("确定要清空英语单词的所有学习掌握记录吗？此操作不可恢复。")) {
        return;
    }
    progress = {};
    try {
        localStorage.removeItem("englishWordProgress");
    } catch (e) {
        console.error("Failed to clear englishWordProgress:", e);
    }
    updateStats();
    updateCard();
    renderList();
    alert("英语学习记录已清空！");
}

// 键盘快捷键监听
document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft") {
        previousWord();
    } else if (event.key === "ArrowRight") {
        nextWord();
    } else if (event.code === "Space") {
        event.preventDefault();
        toggleFlip();
    } else if (event.key === "1" || event.key === "ArrowDown") {
        markUnknown();
    } else if (event.key === "2" || event.key === "ArrowUp") {
        markKnown();
    }
});

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", function() {
    initDOM();
    updateCard();
    updateStats();
    renderList();
});
