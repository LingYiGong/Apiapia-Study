# Study Hub · 语言与识字综合学习中心

> 基于 **Cloudflare 全栈架构 (Workers + KV + Assets)** 构建的多合一轻量化自学平台，包含日语、汉字、英语等多语言与学习技能模块。

无需自建服务器，依托 Cloudflare 全球边缘网络与分布式 KV 数据库，实现：
- 🌐 **全球极速访问**：免运维、自带免费 HTTPS 与自定义域名；
- 📱 **多端进度同步**：手机与电脑自动无缝云端同步；
- ⚡ **离线与沉浸体验**：支持添加到手机主屏幕（PWA/Web App），秒级即开即练。

---

## 📚 包含模块

### 1. 🎌 日语听力与词汇 (`/japanese`)
- **核心理念**：基于艾宾浩斯（SM-2）间隔重复算法与“听力优先”盲测模式设计；
- **词库规模**：1780+ 核心进阶词汇与 120 句日常高频对话表达；
- **云端同步**：通过 Cloudflare KV 永久保存学习进度与多端刷题记录。

### 2. ✍️ 汉字听写与笔顺 (`/hanzi`)
- **核心理念**：多感官汉字启蒙与日常听写练习；
- **功能特性**：语音朗读播报、动画笔画临摹演示、错字复习与认读闯关。

### 3. 🔤 英语单词记忆卡 (`/english`)
- **核心理念**：核心高频动词与生活常用词卡；
- **功能特性**：经典双面翻牌交互、认识/不认识掌握度标记、极简即开即学。

---

## 📁 目录结构

```text
study/
├── backend/
│   └── worker.js           # 🌟 统一公共后端（处理多模块 API 路由与全站静态资源托管）
├── index.html              # 🎓 学习中心总导航入口 (Study Hub 主页)
├── japanese/               # 日语学习模块
│   ├── frontend/
│   │   ├── index.html      # 单页应用 (Vue 3 + Tailwind CSS)
│   │   ├── vocab_data.js   # 词汇题库
│   │   └── sentence_data.js# 常用句题库
│   └── docs/               # 原始词汇归档与说明文档
├── hanzi/                  # 汉字听写模块
│   ├── hanzi.html
│   ├── hanzi.css
│   ├── hanzi.js
│   └── hanzi-data.js
├── english/                # 英语词卡模块
│   └── english.html
├── wrangler.toml           # 🚀 Cloudflare 部署与 KV 绑定配置
├── package.json            # 📦 项目脚本与依赖
├── .assetsignore           # 🛡️ 静态托管过滤规则
└── README.md               # 📖 项目总说明文档
```

---

## 🚀 部署方案

### 方式一：连接 GitHub 自动部署（推荐）

1. **将项目推送到你的 GitHub 仓库**：
   ```bash
   git add .
   git commit -m "feat: setup study hub"
   git push
   ```

2. **登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)**：
   - 导航至 **「Workers 和 Pages」** ➔ 选择你的项目或新建 Pages/Workers 项目关联该 GitHub 仓库；
   - **根目录 (Root directory)**：保持为默认的根目录 `/`；
   - **构建命令 (Build command)**：留空；
   - **输出目录 (Build output directory)**：填 `.`（根目录）。

3. **绑定 KV 数据库（用于日语等模块的云端同步）**：
   - 在左侧菜单 **「KV」** 中创建命名空间 `STUDY_KV`；
   - 在项目设置的 **「绑定 (Bindings)」** 中添加 KV 绑定：
     - **变量名称 (Variable name)**：`STUDY_KV`
     - **KV 命名空间**：选择绑定的 `STUDY_KV`。

---

### 方式二：使用 Wrangler 命令行一键部署

在项目根目录下执行：
```bash
# 1. 安装依赖并登录 Cloudflare
npm install
npx wrangler login

# 2. 本地开发预览（支持本地模拟 KV 与 API）
npm run dev

# 3. 直接部署到 Cloudflare
npm run deploy
```

---

## 📱 手机端使用与多端同步

1. **添加到手机主屏幕**：
   - **iPhone Safari**：点击底部「分享」按钮 ➔ 选择「添加到主屏幕」；
   - **安卓 Chrome**：点击右上角菜单 ➔ 选择「安装应用」或「添加到主屏幕」；
   - 添加后可像原生 App 一样全屏沉浸式刷题。

2. **跨设备同步进度**：
   - 进入日语模块，点击右上角 **「☁️ 云同步」**；
   - 设置你专属的 **同步密钥 (Sync Key)**（如 `mypass888`）；
   - 在各设备上输入相同密钥并开启实时同步，所有刷题进度自动云端对齐。

---

## 🔮 未来扩展计划

* [ ] 汉字模块接入后端 Worker，支持错题本云端备份；
* [ ] 英语模块支持按遗忘曲线自适应复习；
* [ ] 新增更多自学小工具板块。
