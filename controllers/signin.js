// signin.js 用来处理请求

let index = 0

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
  },
	'GET /chatroom/signin': async (ctx, next) => {
		let names = '甲乙丙丁戊己庚辛壬癸';
		let name = names[index % 10];
		ctx.render('signin-room.html', {
			name: `路人${name}`
		});
	},

	'POST /chatroom/signin': async (ctx, next) => {
		index ++;
		let name = ctx.request.body.name || '路人甲';
		let user = {
			id: index,
			name: name,
			image: index % 10
		};
		let value = Buffer.from(JSON.stringify(user)).toString('base64');
		console.log(`Set cookie value: ${value}`);
		ctx.cookies.set('name', value);
		ctx.response.redirect('/chatroom');
	},

	'GET /chatroom/signout': async (ctx, next) => {
		ctx.cookies.set('name', '');
		ctx.response.redirect('/chatroom/signin');
	}
}
