// index.js

module.exports = {
  'GET /': async (ctx, next) => {
    ctx.render('index.html', {
      title: 'Point'
    })
  },
  'GET /rest-vue': async (ctx, next) => {
    ctx.render('index-rest-vue.html', {
      title: 'Point'
    })
  },
	'GET /chatroom': async (ctx, next) => {
		let user = ctx.state.user;
		if (user) {
			ctx.render('room.html', {
				user: user
			});
		} else {
			ctx.response.redirect('/chatroom/signin');
		}
	}
}
