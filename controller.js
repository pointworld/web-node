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









