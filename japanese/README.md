# 日语听力学习 (Japanese Study) - Cloudflare 部署与多端同步指南

本应用是一个基于艾宾浩斯记忆曲线的日语听力学习 Web 应用，已完美适配 **Cloudflare Pages + Cloudflare KV** 全栈托管架构。

无需购买独立云服务器，利用 Cloudflare 永久免费的边缘网络与分布式 KV 数据库，实现：
- 🌐 **全球极速访问**（自带免费 HTTPS 与自定义域名）；
- 📱 **手机 / 电脑无缝自动同步学习进度**；
- 💾 **无后端服务器运维成本**，支持离线使用与 PWA 添加到手机主屏幕。

---

## 📁 目录结构（前后端分离设计）

```text
japanese_study/
├── frontend/             # 前端项目目录（静态网页与客户端交互）
│   ├── index.html        # 单页应用 (Vue 3 + Tailwind CSS + SM-2算法 + 手机/iPad适配)
│   ├── vocab_data.js     # 日语单词题库 (1786词，含假名、汉字、释义)
│   └── sentence_data.js  # 日语常用句题库 (120句日常高频表达)
├── backend/              # 后端服务目录（Cloudflare Workers 边缘计算）
│   └── worker.js         # 云函数入口，处理静态托管与 /api/sync 进度同步接口
├── docs/                 # 资料与文档目录
│   ├── 第一册词汇.txt      # 原始词汇输入文本 (备用归档)
│   ├── 第二册词汇.txt      # 原始词汇输入文本 (备用归档)
│   └── mvp.md            # 产品需求与架构说明
├── wrangler.toml         # Cloudflare Workers 项目配置（指定前端目录与后端入口，绑定 KV）
├── package.json          # Node 依赖与脚本命令
└── README.md             # 项目使用与部署说明
```

---

## 🚀 部署方案

### 方式一：通过 Cloudflare Pages 控制台部署（最推荐，简单省心）

1. **将项目推送到你的 GitHub / GitLab 仓库**：
   ```bash
   git add .
   git commit -m "feat: support cloudflare pages and kv sync"
   git push
   ```

2. **登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)**：
   - 依次点击左侧菜单：**「Workers 和 Pages」** -> **「创建应用程序」** -> 选择 **「Pages」** 选项卡 -> **「连接到 Git」**。
   - 选择你的 `japanese_study` 代码仓库。

3. **构建与输出配置**：
   - 项目名称：`japanese-study`（或任意自定义名）
   - 生产分支：`main`（或 `master`）
   - **框架预设 (Framework preset)**：选择 `None` (无)
   - **构建命令 (Build command)**：留空（无需构建打包）
   - **构建输出目录 (Build output directory)**：填 `.`（即当前根目录）
   - 点击 **「保存并部署」**。部署完成后，你即可获得一个类似 `https://japanese-study-xxx.pages.dev` 的全球专属访问网址。

4. **创建并绑定免费的 KV 数据库（实现多端同步）**：
   - 在 Cloudflare 左侧菜单中点击 **「Workers 和 Pages」** -> **「KV」** -> 点击 **「创建命名空间」**。
   - 命名空间名称输入：`STUDY_KV`，点击添加。
   - 回到刚刚创建的 Pages 项目 -> 点击 **「设置 (Settings)」** -> **「函数 (Functions)」**。
   - 向下滚动找到 **「KV 命名空间绑定 (KV namespace bindings)」**，点击 **「添加绑定」**：
     - **变量名称 (Variable name)**：必须填写 `STUDY_KV`
     - **KV 命名空间 (KV namespace)**：选择刚刚创建的 `STUDY_KV`
   - 点击保存。重新触发一次部署（或提交一次代码），云端同步后端 API 便正式生效！

---

### 方式二：使用 Wrangler CLI 命令行部署

如果你习惯本地终端命令行：

```bash
# 1. 安装依赖并登录 Cloudflare 账号
npm install
npx wrangler login

# 2. 本地开发预览（支持本地模拟 KV）
npm run dev

# 3. 直接一键部署到 Cloudflare Pages
npm run deploy
```

---

## 📱 手机端使用与多端同步指南

1. **手机端访问**：
   - 在手机浏览器（iPhone Safari 或安卓 Chrome）中打开你的 Cloudflare 网址（如 `https://japanese-study.pages.dev`）。
   - **添加到主屏幕**：
     - iPhone Safari：点击底部的分享按钮 ➔ 选择 **「添加到主屏幕」**；
     - 安卓 Chrome：点击右上角菜单 ➔ 选择 **「安装应用」** 或 **「添加到主屏幕」**；
     - 添加后可像原生 App 一样全屏沉浸式刷题，无浏览器地址栏打扰！

2. **跨设备同步进度**：
   - 点击右上角的 **「☁️ 云同步」** 按钮；
   - 输入你专属的 **同步密钥 (Sync Key)**（如 `mypass888`，随意设置）；
   - 打开 **「自动实时同步」** 开关；
   - 在电脑和手机上输入**同一个密钥**，只要你刷完词或者打卡，系统就会自动通过 Cloudflare 边缘节点将最新进度无缝同步给所有设备！
