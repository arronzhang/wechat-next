const { Receiver } = require('../')
const koa = require('koa')
const app = new koa()
app.proxy = true

//app.use(require('koa-xml-body')())

app.use(
  require('koa-bodyparser')({
    enableTypes: ['text', 'json', 'form'],
    extendTypes: {
      text: ['text/xml']
    }
  })
)

//app.use(require('koa-body')()) // Conflict with `koa-xml-body`

app.use(function log(ctx, next) {
  /* eslint-disable */
  if (process.env.NODE_ENV != 'test')
    console.log(ctx.headers, ctx.method, ctx.query, ctx.request.body)
  /* eslint-enable */
  return next()
})

app.id = 'wx2169a1c982fe6157'
app.token = '4c9184f37cff01bcdc32dc486ec36961'
app.use(
  Receiver.koa({ id: app.id, token: app.token }, function() {
    return ''
  })
)

module.exports = app

if (!module.parent) {
  app.listen(3000, '0.0.0.0')
}
