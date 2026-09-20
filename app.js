// 动态适配移动端浏览器（Safari / Chrome）地址栏展开/收起时的实际可视高度
(function() {
    function updateAppHeight() {
        var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--app-height', h + 'px');
    }
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateAppHeight);
    }
    updateAppHeight();
})();

// Vue 3 + Vant 4 业务逻辑
const { createApp, ref, computed } = Vue;

const app = createApp({
    setup() {
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

        // 三大学习模块配置数据 (儿童友好定制)
        const modules = ref([
            {
                id: 'japanese',
                title: '日语听力与假名',
                subtitle: '假名手写 · 听力优先 · SM-2 记忆',
                icon: '🎌',
                iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
                barClass: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
                bulletClass: 'bg-indigo-500',
                btnClass: 'kid-btn-primary',
                desc: '包含标准田字格平假名/片假名听写书写，1912个核心词汇与226句实用例句盲听测试，搭配艾宾浩斯复习曲线。',
                tags: [
                    { text: '假名田字格手写', color: '#6366f1' },
                    { text: '平片对照辨析', color: '#f59e0b' },
                    { text: '艾宾浩斯算法', color: '#10b981' },
                    { text: '纯听力盲测', color: '#8b5cf6' }
                ],
                highlights: [
                    '假名听写手写练习（田字格·平假名与片假名对照辨析）',
                    '纯听力盲测模式 & 单词发音释义解析',
                    '226 句日常高频对话听力理解与重点词汇'
                ],
                url: 'japanese/frontend/index.html',
                btnText: '进入日语小能手'
            },
            {
                id: 'hanzi',
                title: '汉字听写与笔顺',
                subtitle: '汉字启蒙 · 规范笔顺与语音听写',
                icon: '✍️',
                iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                barClass: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500',
                bulletClass: 'bg-emerald-500',
                btnClass: 'kid-btn-success',
                desc: '面向汉字启蒙与小学生标准听写辅助。包含人教版生字库、标准田字格手写板、生动笔顺动画临摹与看字认读卡。',
                tags: [
                    { text: '标准田字格', color: '#10b981' },
                    { text: '慢动作笔顺临摹', color: '#f59e0b' },
                    { text: '听音选字小游戏', color: '#ec4899' },
                    { text: '云端多端同步', color: '#8b5cf6' }
                ],
                highlights: [
                    '小学生标准田字格手写板，支持笔画撤销与重写',
                    '规范笔画笔顺动画临摹演示，慢动作演示每一笔',
                    '听音选字闯关、看字认读卡与趣味短文阅读'
                ],
                url: 'hanzi/hanzi.html',
                btnText: '进入汉字小能手'
            },
            {
                id: 'english',
                title: '英语单词记忆卡',
                subtitle: '核心动词 · 双面翻牌闪卡记忆',
                icon: '🔤',
                iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
                barClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500',
                bulletClass: 'bg-rose-500',
                btnClass: 'kid-btn-danger',
                desc: '极简高效的英语核心动词与高频生活词卡，双面翻牌互动，随时随地开启碎片化记忆与复习。',
                tags: [
                    { text: '核心高频动词', color: '#f43f5e' },
                    { text: '双面翻牌卡片', color: '#8b5cf6' },
                    { text: '掌握度标记', color: '#10b981' },
                    { text: '秒级即开即练', color: '#0284c7' }
                ],
                highlights: [
                    '经典闪卡交互，点击快速看释义与发音',
                    '“认识 / 不认识” 标记与记忆打卡',
                    '纯轻量静态设计，秒级即开即学'
                ],
                url: 'english/english.html',
                btnText: '进入英语词卡'
            }
        ]);

        // 模块跳转与记录
        const goToModule = (url, id) => {
            try {
                localStorage.setItem('study_hub_last_module', id);
                lastVisitedModule.value = id;
            } catch (e) {}
            window.location.href = url;
        };

        return {
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
