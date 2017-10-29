// middleware: static-file.js 处理以 /static/ 开头的 URL
// 我们把所有静态资源文件全部放入 /static 目录，目的就是能统一处理静态文件

// native modules
const path = require('path')

// third-part modules
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
