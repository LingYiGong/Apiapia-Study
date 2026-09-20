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

        // 三大学习模块配置数据
        const modules = ref([
            {
                id: 'japanese',
                title: '日语听力与词汇',
                subtitle: '听力优先 · SM-2 间隔重复',
                icon: '🎌',
                iconBg: 'bg-indigo-50 text-indigo-600',
                barClass: 'bg-gradient-to-r from-indigo-500 to-cyan-500',
                bulletClass: 'bg-indigo-500',
                btnType: 'primary',
                btnClass: '!bg-indigo-600 !border-indigo-600 shadow-indigo-100',
                desc: '基于艾宾浩斯（SM-2）间隔重复算法与“听力优先”理念设计，包含海量核心词库与实用例句。',
                tags: [
                    { text: '假名听写手写', color: '#ec4899' },
                    { text: '平片对照辨析', type: 'warning' },
                    { text: 'SM-2 算法', type: 'primary' },
                    { text: '听力盲测', color: '#0284c7' }
                ],
                highlights: [
                    '假名听写手写练习（田字格·平假名与片假名对照辨析）',
                    '纯听力盲测模式 & 假名释义解析',
                    '220+ 句日常高频对话与 IT 面试清单'
                ],
                url: 'japanese/frontend/index.html',
                btnText: '进入日语学习'
            },
            {
                id: 'hanzi',
                title: '汉字听写与笔顺',
                subtitle: '汉字启蒙 · 笔顺书写与语音听写',
                icon: '✍️',
                iconBg: 'bg-emerald-50 text-emerald-600',
                barClass: 'bg-gradient-to-r from-emerald-500 to-amber-500',
                bulletClass: 'bg-emerald-500',
                btnType: 'success',
                btnClass: '!bg-emerald-600 !border-emerald-600 shadow-emerald-100',
                desc: '面向汉字启蒙与日常听写的辅助小工具。包含自然、生活、动植物分类字库与趣味笔顺临摹。',
                tags: [
                    { text: '多维听写', type: 'success' },
                    { text: '笔顺临摹', color: '#d97706' },
                    { text: '错题记忆', type: 'success' },
                    { text: '云端多端同步', color: '#7c3aed' }
                ],
                highlights: [
                    '汉字+提示词语音朗读，语速可调',
                    '笔画临摹与书写动画演示',
                    '错字复习本与 Cloudflare 云端同步'
                ],
                url: 'hanzi/hanzi.html',
                btnText: '进入汉字听写'
            },
            {
                id: 'english',
                title: '英语单词记忆卡',
                subtitle: '核心动词 · 双面翻牌闪卡记忆',
                icon: '🔤',
                iconBg: 'bg-rose-50 text-rose-600',
                barClass: 'bg-gradient-to-r from-pink-500 to-purple-500',
                bulletClass: 'bg-rose-500',
                btnType: 'danger',
                btnClass: '!bg-rose-500 !border-rose-500 shadow-rose-100',
                desc: '极简高效的英语核心动词与高频生活词卡，双面翻牌互动，随时随地开启碎片化记忆与复习。',
                tags: [
                    { text: '核心高频动词', type: 'danger' },
                    { text: '双面翻牌', color: '#7c3aed' },
                    { text: '掌握度标记', type: 'danger' },
                    { text: '即开即练', color: '#0284c7' }
                ],
                highlights: [
                    '经典闪卡交互，点击快速看释义',
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
