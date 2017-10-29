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