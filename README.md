# 存货集市 · 私物出清与选购推送系统

这是一个基于 **React 19 + TypeScript + Tailwind CSS + Vite + Express** 构建的全栈 Web 应用。

---

## 免费上线部署指南（适合分享给买家）

如果您希望将这个网站部署到公网上，让任何人在电脑或手机上都能随时打开，推荐以下几种 **完全免费且最简单** 的托管平台：

### 方案 A：Netlify（最简单：网页直接拖拽上传，无需写代码）⭐⭐⭐⭐⭐
1. 确保在本地运行过一次 `npm run build`，会在项目根目录下生成 `dist/` 文件夹（当前已为您预先构建好）。
2. 打开 [Netlify 官网 (https://app.netlify.com)](https://app.netlify.com) 注册登录。
3. 在控制台找到 **"Drag and drop your site output folder here"**。
4. 将本项目的 **`dist`** 文件夹直接拖入浏览器网页中。
5. 几秒钟内即可生成全球可访问的免费公网网址（如 `https://your-store.netlify.app`）。

### 方案 B：Vercel（全球最流行，免费快速）⭐⭐⭐⭐⭐
1. 将项目文件夹上传至您的 [GitHub](https://github.com) 个人仓库。
2. 打开 [Vercel 官网 (https://vercel.com)](https://vercel.com)，点击 **"Add New Project"**。
3. 导入您的 GitHub 仓库，Framework 预设自动识别为 **Vite**，点击 **Deploy**。
4. 1 分钟后自动生成永久免费 HTTPS 域名（如 `https://your-store.vercel.app`）。

### 方案 C：Render（支持 Node.js 全栈后端）⭐⭐⭐⭐
1. 登录 [Render 官网 (https://render.com)](https://render.com)。
2. 创建 **"New Web Service"** 并关联 GitHub 仓库。
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. 即可免费运行完整的 Node.js + Express 全栈服务。

---

## 本地开发与运行方法

### 前置准备
- 电脑已安装 [Node.js](https://nodejs.org/)（推荐 LTS 版本，v18 或更高版本）。

### 启动步骤
1. 打开终端（Terminal / CMD）进入项目文件夹。
2. 安装依赖：`npm install`
3. 启动本地服务：`npm run dev`
4. 浏览器访问：`http://localhost:3000`

---

## 为什么直接双击 index.html 网页是一片空白？
`index.html` 依赖 React 和 TypeScript 模块系统。浏览器出于安全机制（`file://` 协议跨域限制），无法直接解析未编译的 `.tsx` 源码，必须通过打包工具（Vite）编译或部署在 HTTP 服务器上才能正常浏览。
