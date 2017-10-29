# node 建站 - koa2 + nunjucks 初长成

- MVC - koa2 + nunjucks：实现后端数据、模板页面和控制器的分离
- REST API
- MVVM - vue：关注 Model 的变化，让 MVVM 框架去自动更新 DOM 的状态，从而把开发者从操作 DOM 的繁琐步骤中解脱出来
- chatroom - ws

## 环境
### 后台
- node.js@8.6.0 <-- 后台
- koa@2.3.0 <-- 基于 Node.js 平台的 web 开发框架，封装了 node.js http 模块
- koa-router@7.1.0 <-- 负责处理 URL 映射，可以处理 get、delete、head 等请求
- koa-bodyparser@4.2.0 <-- 负责解析 request 的 body 内容，post 请求把需要发送的表单或 JSON 作为 request 的 body 发送，但无论是 Node.js 提供的原始 request 对象，还是koa提供的 request 对象，都不提供解析 request 的 body 的功能
- nunjucks@3.0.1 <-- 模版引擎
- mime@2.0.3 <-- A comprehensive, compact MIME type module
- mz@2.7. <-- mz 提供的 API 和 Node.js 的 fs 模块完全相同，但 fs 模块使用回调，而 mz 封装了 fs 对应的函数，并改为 Promise。这样，我们就可以非常简单的用 await 调用 mz 的函数，而不需要任何回调
- ws@1.1.1 <-- Simple to use, blazing fast and thoroughly tested websocket client and server for Node.js

### 前台
- bootstrap@3.3.7
- jquery@3.2.1
- vue@2.5.2

## 目录结构
```text
web/
|
+- controllers/ <-- 控制器：Controller
|  |
|  +- api.js <-- REST API - 操作 JSON 数据：GET /api/products、POST /api/products、DELETE /api/products/:id
|  |
|  +- index.js <-- 处理首页（nunjucks 模版拼接及数据替换）：网站首页 - GET /、REST API 首页 - GET /rest-vue、聊天室首页 - GET /chatroom
|  |
|  +- signin.js <-- 处理登陆相关请求：网站登陆 - POST /signin、聊天室GET登陆 ：GET /chatroom/signin、聊天室POST登陆 - POST /chatroom/signin、退出聊天室 - GET /chatroom/signout
|
+- views/ <-- Nunjucks 模板，和 MVC-Vue 的视图
|  |
|  +- base.html <-- 
|  |
|  +- base-rest-vue.html <-- 
|  |
|  +- base-ws.html <-- 
|  |
|  +- index.html <-- 网站首页
|  |
|  +- index-rest-vue.html <-- REST API 首页
|  |
|  +- room.html <-- 聊天室首页
|  |
|  +- signin-failed.html <-- 网站登陆失败页
|  |
|  +- signin-ok.html <-- 网站登陆成功页
|  |
|  +- signin-room.html <-- 聊天室登陆页
|
+- static/ <-- 静态资源文件
|  |
|  +- css/ <- 存放自定义 css 等
|  |
|  +- fonts/ <- 存放字体文件
|  |
|  +- js/ <- 存放自定义 js 等
|  |
|  +- img/ <- 
|  |
|  +- audio/ <- 
|  |
|  +- video/ <- 
|  |
|  +- bower-components/ bower 安装的第三方前端依赖
|
+- app.js <--  koa 入口文件
|
+- products.js <-- 模拟数据库，处理 MVC-Vue 的 Product 信息
|
+- controller.js <-- middleware：扫描注册 controllers 和创建 router，处理 URL 映射
|
+- rest.js <-- middleware：提供 REST API 支持，为 ctx 对象添加 .rest() 功能
|
+- static-files.js <-- middleware：提供静态文件支持
|
+- templating.js <-- middleware：提供 Nunjucks 支持
|
+- package.json <-- 项目描述文件
|
+- node_modules/ <-- npm 安装的第三方后端依赖
|
+- README.md
```
  
## Usage
- 从 GitHub clone 该项目到本地
- 执行 `npm install` 命令，安装后台所需依赖
- 执行 `bower install` 命令，安装前台所需依赖
- 执行 `node app.js`，启动项目
- 打开浏览器，输入 `http://localhost:3000` 即可看到效果
  






