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

app.use(function logger(ctx, next) {
  log(ctx.headers, ctx.method, ctx.query, ctx.request.body)
  return next()
})

function log(...args) {
  /* eslint-disable */
  if (process.env.NODE_ENV != 'test') console.log(...args)
  /* eslint-enable */
}

app.id = 'ww073d566727158bca'
app.token = '4c9184f37cff01bcdc32dc486ec36961'
app.aesKey = 'trjsFvOlHtVtIu5fZn390NzJUuMlK7iegzEz5D842gk'

app.use(
  Receiver.koa({ id: app.id, token: app.token, aes_key: app.aesKey }, function(msg) {
    log(msg)
    if (msg.MsgType == 'text') {
      return msg.Content
    }
    return ''
  })
)

module.exports = app

if (!module.parent) {
  app.listen(3000, '0.0.0.0')
}
