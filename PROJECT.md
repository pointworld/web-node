## 项目搭建环境

### 后台
- node.js@8.6.0 <-- 后台
- koa@2.3.0 <-- 基于 Node.js 平台的 web 开发框架，封装了 node.js http 模块
- koa-router@^7.1.0 <-- 负责处理 URL 映射，可以处理 get、delete、head 等请求
- koa-bodyparser@^4.2.0 <-- 负责解析 request 的 body 内容，post 请求把需要发送的表单或 JSON 作为 request 的 body 发送，但无论是 Node.js 提供的原始 request 对象，还是koa提供的 request 对象，都不提供解析 request 的 body 的功能
- nunjucks@^3.0.1 <-- 模版引擎
- mime@^2.0.3
- mz@^2.7.0

### 前台
- bootstrap@3.3.7

## 项目搭建流程

- 创建一个目录 `view-koa` 作为工程目录并用 WebStorm 打开

- 创建 `package.json` 文件，输入如下代码

```json
{
  "name": "view-koa2",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "keywords": [
    "koa",
    "async",
    "MVC",
    "nunjucks"
  ],
  "author": "point",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/pointworld/web-node.git"
  },
  "dependencies": {
    "koa": "^2.3.0",
    "koa-bodyparser": "^4.2.0",
    "koa-router": "^7.2.1",
    "mime": "^2.0.3",
    "mz": "^2.7.0",
    "nunjucks": "^3.0.1"
  }
}
```

- 打开命令行工具并切换到当前目录，输入命令 `npm install`，会安装项目所需依赖

- 创建入口文件 `app.js`，输入以下代码

```js
// 导入第三方模块
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')

// 导入自定义模块
const controller = require('./controller')
const templating = require('./templating')

// 实例化
const app = new Koa()

// 常量 isProduction，它判断当前环境是否是 production 环境
// 如果是，就使用缓存，如果不是，就关闭缓存。
// 生产环境上必须配置环境变量 NODE_ENV = 'production'，而开发环境不需要配置
// 在开发环境下，关闭缓存后，我们修改 View，可以直接刷新浏览器看到效果，否则，每次修改都必须重启 Node 程序，会极大地降低开发效率。

// Node.js 在全局变量 process 中定义了一个环境变量 env.NODE_ENV
// 为什么要使用该环境变量？因为我们在开发的时候，环境变量应该设置为 'development'
// 而部署到服务器时，环境变量应该设置为 'production'
// 在编写代码的时候，要根据当前环境作不同的判断

// 实际上 NODE_ENV 可能是 undefined，所以判断的时候，不要用 NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// middleware: log request URL: 记录 URL 以及页面执行时间

app.use(async (ctx, next) => {
  console.log(`Process ${ctx.request.method} ${ctx.request.url}...`) // Process GET /...

  let
    start = new Date().getTime(),
    execTime

  await next()
  execTime = new Date().getTime() - start
  ctx.response.set('X_Response-Time', `${execTime}ms`)
})

// middleware: static file support: 处理静态文件

// 这里为什么需要作环境判断？
// 因为在生产环境下，静态文件是由部署在最前面的反向代理服务器（如 Nginx）处理的，Node 程序不需要处理静态文件
// 而在开发环境下，我们希望 koa 能顺带处理静态文件，否则，就必须手动配置一个反向代理服务器，这样会导致开发环境非常复杂
if (!isProduction) {
  let staticFiles = require('./static-files')
  app.use(staticFiles('/static/', __dirname + '/static'))
}

// middleware: parse request body: 解析 POST 请求

// 由于 middleware 的顺序很重要，这个 koa-bodyparser 必须在 router 之前被注册到 app 对象上
app.use(bodyParser())

// middleware: add nunjucks as view: 负责给 ctx 加上 render() 来使用 Nunjucks

app.use(templating('views',{
  noCache: !isProduction,
  watch: !isProduction
}))

// middleware: add controllers: 处理URL路由

app.use(controller())

app.listen(3001)

console.log('app started at port 3001...')
```

- 在项目根目录下创建 controller.js 文件并写入如下代码
```js
// middleware: controller.js: 扫描 controllers 目录和创建 router，处理 URL 映射

const fs = require('fs')

// add url-route in /controllers

function addMapping(router, mapping) {
  for (let url in mapping) {
    if (url.startsWith('GET ')) {
      // 如果 URL 类似 "GET xxx"
      let path = url.substring(4)
      router.get(path, mapping[url])

      console.log(`register URL mapping: GET ${path}`)
    } else if (url.startsWith('POST ')) {
      let path = url.substring(5)
      router.post(path, mapping[url])

      console.log(`Register URL mapping: POST ${path}`)
    } else if (url.startsWith('PUT ')) {
      let path = url.substring(4)
      router.put(path, mapping[url])

      console.log(`Register URL mapping: PUT ${path}`)
    } else if (url.startsWith('DELETE ')) {
      let path = url.substring(7)
      router.del(path, mapping[url])

      console.log(`Register URL mapping: DELETE ${path}`)
    }
    else {
      // 无效的 URL
      console.log(`Invalid URL: ${url}`)
    }
  }
}

function addControllers(router, dir) {
  // 用 readdirSync 列出文件
  // 这里可以用 sync 是因为启动时只运行一次，不存在性能问题
  fs
    .readdirSync(__dirname + '/' + dir)
    .filter(f => {
      return f.endsWith('.js')
    })
    // 处理每个 js 文件
    .forEach(f => {
      console.log(`Process controller: ${f}...`)

      let mapping = require(__dirname + '/' + dir + '/' + f)

      addMapping(router, mapping)
    })
}

module.exports = function (dir) {
  let
    controllers_dir = dir || 'controllers',
    router = require('koa-router')()

  addControllers(router, controllers_dir)

  // console.log(router.routes())
  return router.routes() // ???
}
```

- 在项目根目录下创建 templating.js 文件并写入如下代码

```js
// middleware: templating.js 作用是给 ctx 对象绑定一个 render(view, model) 的方法，这样，后面的 Controller 就可以调用这个方法来渲染模板了。

const nunjucks = require('nunjucks')

function createEnv(path, opts) {
  let
    autoescape = opts.autoescape === undefined ? true : opts.autoescape, // 设置Content-Type
    noCache = opts.noCache || false, // 是否缓存：开发环境关闭缓存，生产环境开启缓存
    watch = opts.watch || false, // 模板变化时重新加载。使用前请确保已安装可选依赖 chokidar
    throwOnUndefined = opts.throwOnUndefined || false, // 当输出为 null 或 undefined 会是否抛出异常
    // 变量 env 表示 Nunjucks 模板引擎对象
    // 它有一个 render(view, model) 方法，正好传入 view 和 model 两个参数，并返回字符串
    env = new nunjucks.Environment(
      // 创建一个文件系统加载器，从 views 目录读取模板
      new nunjucks.FileSystemLoader(path, {
        noCache: noCache,
        watch: watch
      }), {
        autoescape: autoescape,
        throwOnUndefined: throwOnUndefined
      }
    )

  if (opts.filters) {
    for (let f in opts.filters) {
      env.addFilter(f, opts.filters[f])
    }
  }

  return env
}

function templating(path, opts) {
  // 创建 Nunjucks 的 env 对象
  let env = createEnv(path, opts)

  return async (ctx, next) => {
    // 给 ctx 绑定 render 函数
    ctx.render = function (view, model) {
      // 把 render 后的内容赋值给 response.body
      // 注意到 ctx.render 内部渲染模板时，Model 对象并不是传入的 model 变量，而是：
      // Object.assign({}, ctx.state || {}, model || {})
      // 这个小技巧是为了扩展
      // 首先，model || {} 确保了即使传入 undefined，model 也会变为默认值{}。
      // Object.assign() 会把除第一个参数外的其他参数的所有属性复制到第一个参数中。
      // 第二个参数是 ctx.state || {}，这个目的是为了能把一些公共的变量放入 ctx.state 并传给 View
      ctx.response.body = env.render(view, Object.assign({}, ctx.state || {}, model || {}))
      // 设置 Content-Type
      ctx.response.type = 'text/html'
    }

    await next()
  }
}

module.exports = templating
```

- 在项目根目录下创建 static-files.js 文件并写入如下代码

```js
// middleware: static-file.js 处理以 /static/ 开头的 URL
// 我们把所有静态资源文件全部放入 /static 目录，目的就是能统一处理静态文件

const path = require('path')
const mime = require('mime')
// mz 提供的 API 和 Node.js 的 fs 模块完全相同，但 fs 模块使用回调，而 mz 封装了 fs 对应的函数，并改为 Promise。
// 这样，我们就可以非常简单的用 await 调用 mz 的函数，而不需要任何回调。
const fs = require('mz/fs')

// url: 类似 '/static/'
// dir：类似 __dirname + '/static'

// staticFiles 是一个普通函数，它接收两个参数：URL 前缀和一个目录，然后返回一个 async 函数。
// 这个 async 函数会判断当前的 URL 是否以指定前缀开头，如果是，就把 URL 的路径视为文件，并发送文件内容。
// 如果不是，这个 async 函数就不做任何事情，而是简单地调用 await next() 让下一个 middleware 去处理请求。
function staticFiles(url, dir) {
  return async (ctx, next) => {
    let rpath = ctx.request.path
    // 判断是否以指定的 URL 开头
    if (rpath.startsWith(url)) {
      // 获取文件完整路径
      let fp = path.join(dir, rpath.substring(url.length))
      // 判断文件是否存在
      if (await fs.exists(fp)) {
        // 查找文件的 mime ,lookup() renamed to getType()
        ctx.response.type = mime.getType(rpath)
        // 读取文件内容并赋值给 response.body
        ctx.response.body = await fs.readFile(fp)
      } else {
        // 文件不存在
        ctx.response.status = 404
      }
    } else {
      // 不是指定前缀的 URI，继续处理下一个 middleware
      await next()
    }
  }
}

module.exports = staticFiles
```

- 创建一个 controllers 文件夹，在该文件夹下分别创建 signin.js 和 index.js 文件，并写入如下代码
```js
// index.js 用来处理首页 /

module.exports = {
  'GET /': async (ctx, next) => {
    ctx.render('index.html', {
      title: 'Point'
    })
  }
}
```

```js
// signin.js 用来处理登录请求 /signin

module.exports = {
  'POST /signin': async (ctx, next) => {
    let
      // 由于登录请求是一个 POST，我们就用 ctx.request.body.<name> 拿到 POST 请求的数据，并给一个默认值。
      email = ctx.request.body.email || '',
      password = ctx.request.body.password || ''

    // 怎么判断正确的 Email 和 Password？目前我们在 signin.js 中是这么判断的：
    // if (email === 'admin@example.com' && password === '123') {}
    // 当然，真实的网站会根据用户输入的 Email 和 Password 去数据库查询并判断登录是否成功
    // 不过这需要涉及到 Node.js 环境如何操作数据库，我们后面再讨论。
    if (email === 'admin@example.com' && password === '123') {
      console.log('signin ok!')

      // 登录成功时我们用 signin-ok.html 渲染
      ctx.render('signin-ok.html', {
        title: 'Sign In Ok',
        name: 'Mr Node'
      })
    } else {
      console.log('signin failed!')

      // 登录失败时我们用 signin-failed.html 渲染
      ctx.render('signin-failed.html', {
        title: 'Sign In Failed'
      })
    }
  }
}
```

- 创建一个 views 文件夹，在该文件夹下分别创建 base.html、index.html、signin-failed.html、signin-ok.html 文件，并写入如下代码

```html
<!--base.html-->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1, user-scalable=no">
    <meta name="keywords" content="biology technology, information technology, point, one, break, human, earth, universe">
    <meta name="description" content="Entertain you with the liveliest and enlighten you with everything worth knowing. World's greatest wonder is the world itself. Know about things you never knew and think about life intelligently.">
    <title>{{ title }}</title>
    <!--<link rel="stylesheet" href="/static/css/bootstrap.css">-->
    <link rel="stylesheet" href="/static/lib/bootstrap/dist/css/bootstrap.css">
    <!--<script src="/static/js/jquery.js"></script>-->
    <script src="/static/lib/jquery/dist/jquery.js"></script>
    <!--<script src="/static/js/bootstrap.js"></script>-->
    <script src="/static/lib/bootstrap/dist/js/bootstrap.min.js"></script>
</head>

<body>
    <header id="header" class="navbar navbar-static-top">
        <div class="container">
            <div class="navbar-header">
                <a href="/" class="navbar-brand">Point</a>
            </div>
            <nav class="collapse navbar-collapse" id="bs-navbar">
                <ul class="nav navbar-nav">
                    <li><a target="_blank" href="#">.BT</a></li>
                    <li><a target="_blank" href="#">.IT</a></li>
                    <li><a target="_blank" href="#">.TECH</a></li>
                    <li><a target="_blank" href="#">.EDU</a></li>
                    <li><a target="_blank" href="#">.LIFE</a></li>
                </ul>
            </nav>
        </div>
    </header>
    <div id="important" style="color:#cdbfe3; background-color:#6f5499; padding:30px 0; margin:-20px 0 20px 0;">
        <div class="container">
            <h1 style="color:#fff; font-size:60px">Welcome to Point's World!</h1>
            <p style="font-size:24px; line-height:48px">Point One, Point Break.</p>
        </div>
    </div>
    {% block main %} {% endblock %}
    <footer style="background-color:#ddd; padding: 20px 0;">
        <div class="container">
            <p>
                <a target="_blank" href="#">Website</a> -
                <a target="_blank" href="#">GitHub</a> -
                <a target="_blank" href="#">Weibo</a>
            </p>
            <p>This ... is created by <a target="_blank" href="#">@point</a>.</p>
            <p>Code licensed <a target="_blank" href="#">Apache</a>.</p>
        </div>
    </footer>
</body>

</html>
```

```html
<!--index.html-->
{% extends "base.html" %}
{% block main %}
<div class="container">
  <div class="row">
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title"><span class="glyphicon glyphicon-user"></span> Please sign in</h3>
        </div>
        <div class="panel-body">
          <form action="/signin" method="post">
            <div class="form-group">
              <label>Email address</label>
              <input type="email" name="email" class="form-control" placeholder="Email">
              <p class="help-block">Use email: admin@example.com</p>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" class="form-control" placeholder="Password">
              <p class="help-block">Use password: 123</p>
            </div>
            <button type="submit" class="btn btn-primary">Sign In</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title"><span class="glyphicon glyphicon-hd-video"></span> Video training</h3>
        </div>
        <div class="panel-body">
          <video width="100%" controls="controls">
            <source src="https://github.com/michaelliao/learn-javascript/raw/master/video/vscode-nodejs.mp4">
          </video>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-md-12">
      <h1>Get more courses...</h1>
    </div>
  </div>
  <div class="row">
    <div class="col-md-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">JavaScript</h3>
        </div>
        <div class="panel-body">
          <p>full-stack JavaScript course</p>
          <p><a target="_blank"
                href="#">Read more</a>
          </p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Python</h3>
        </div>
        <div class="panel-body">
          <p>the latest Python course</p>
          <p><a target="_blank"
                href="#">Read more</a>
          </p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">git</h3>
        </div>
        <div class="panel-body">
          <p>A course about git version control</p>
          <p><a target="_blank"
                href="#">Read more</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
{% endblock %}
```

```html
<!--signin-failed.html-->
{% extends "base.html" %}
{% block main %}
<div class="container">
  <div class="row">
    <div class="col-md-12">
      <h1>Sign in failed!</h1>
      <div class="alert alert-danger"><strong>Sorry!</strong> Your email or password does not match! Please try again.
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title"><span class="glyphicon glyphicon-user"></span> Please sign in</h3>
        </div>
        <div class="panel-body">
          <form action="/signin" method="post">
            <div class="form-group">
              <label>Email address</label>
              <input type="email" name="email" class="form-control" placeholder="Email">
              <p class="help-block">Use email: admin@example.com</p>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" name="password" class="form-control" placeholder="Password">
              <p class="help-block">Use password: 123456</p>
            </div>
            <button type="submit" class="btn btn-primary">Sign In</button>
          </form>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title"><span class="glyphicon glyphicon-hd-video"></span> Video training</h3>
        </div>
        <div class="panel-body">
          <video width="100%" controls="controls">
            <source src="https://github.com/michaelliao/learn-javascript/raw/master/video/vscode-nodejs.mp4">
          </video>
        </div>
      </div>
    </div>
  </div>
</div>
{% endblock %}
```

```html
<!--signin-ok.html-->
{% extends "base.html" %}
{% block main %}
<div class="container">
  <div class="row">
    <div class="col-md-12">
      <h1>Sign in successfully!</h1>
      <div class="alert alert-success"><strong>Well done!</strong> You successfully signed in as {{ name }}!
      </div>
      <p><a href="/">Back to home</a></p>
    </div>
  </div>
</div>
{% endblock %}
```

- 创建一个 static 文件夹，在该文件夹下分别创建 css、js、fonts、lib 文件夹，用来存放所需的静态文件

- 命令行执行 `node app` 或 `npm start` 命令

- 打开浏览器，输入 `http://localhost:3001` 即可看到效果


