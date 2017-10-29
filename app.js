// native modules
const url = require('url')
const Cookies = require('cookies')

// third-part modules
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const ws = require('ws')

// user-defined modules
const controller = require('./controller')
const templating = require('./templating')
const rest = require('./rest');

// instantiation
const app = new Koa()

const WebSocketServer = ws.Server

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

// parse user from cookie:
app.use(async (ctx, next) => {
	ctx.state.user = parseUser(ctx.cookies.get('name') || '');
	await next();
});

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

// bind .rest() for ctx:
app.use(rest.restify());

// middleware: add controllers: 处理URL路由
app.use(controller())

let server = app.listen(3000)

/**
 * for chat room
 */

function parseUser(obj) {
	if (!obj) {
		return;
	}

	console.log('try parse: ' + obj);

	let s = '';
	if (typeof obj === 'string') {
		s = obj;
	} else if (obj.headers) {
		let cookies = new Cookies(obj, null);
		s = cookies.get('name');
	}
	if (s) {
		try {
			let user = JSON.parse(Buffer.from(s, 'base64').toString());

			console.log(`User: ${user.name}, ID: ${user.id}`);

			return user;
		} catch (e) {
			// ignore
		}
	}
}

function createWebSocketServer(server, onConnection, onMessage, onClose, onError) {
	let wss = new WebSocketServer({
		server: server
	});
	wss.broadcast = function broadcast(data) {
		wss.clients.forEach(function each(client) {
			client.send(data);
		});
	};
	onConnection = onConnection || function () {
		console.log('[WebSocket] connected.');
	};
	onMessage = onMessage || function (msg) {
		console.log('[WebSocket] message received: ' + msg);
	};
	onClose = onClose || function (code, message) {
		console.log(`[WebSocket] closed: ${code} - ${message}`);
	};
	onError = onError || function (err) {
		console.log('[WebSocket] error: ' + err);
	};
	wss.on('connection', function (ws) {
		let location = url.parse(ws.upgradeReq.url, true);

		console.log('[WebSocketServer] connection: ' + location.href);

		ws.on('message', onMessage);
		ws.on('close', onClose);
		ws.on('error', onError);
		if (location.pathname !== '/ws/chat') {
			// close ws:
			ws.close(4000, 'Invalid URL');
		}
		// check user:
		let user = parseUser(ws.upgradeReq);
		if (!user) {
			ws.close(4001, 'Invalid user');
		}
		ws.user = user;
		ws.wss = wss;
		onConnection.apply(ws);
	});
	console.log('WebSocketServer was attached.');
	return wss;
}

let messageIndex = 0;

function createMessage(type, user, data) {
	messageIndex++;
	return JSON.stringify({
		id: messageIndex,
		type: type,
		user: user,
		data: data
	});
}

function onConnect() {
	let user = this.user;
	let msg = createMessage('join', user, `${user.name} joined.`);
	this.wss.broadcast(msg);
	// build user list:
	let users = this.wss.clients.map(function (client) {
		return client.user;
	});
	this.send(createMessage('list', user, users));
}

function onMessage(message) {
	console.log(message);
	if (message && message.trim()) {
		let msg = createMessage('chat', this.user, message.trim());
		this.wss.broadcast(msg);
	}
}

function onClose() {
	let user = this.user;
	let msg = createMessage('left', user, `${user.name} is left.`);
	this.wss.broadcast(msg);
}

app.wss = createWebSocketServer(server, onConnect, onMessage, onClose);

console.log('app started at port 3000...')
