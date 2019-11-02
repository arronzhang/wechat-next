const { Receiver } = require('../')
const { writeFileSync } = require('fs')
const koa = require('koa')
const app = new koa()
app.proxy = true

app.use(
  require('koa-bodyparser')({
    enableTypes: ['text', 'json', 'form'],
    extendTypes: {
      text: ['text/xml']
    }
  })
)

app.use(function logger(ctx, next) {
  log(ctx.headers, ctx.method, ctx.query, ctx.request.body)
  return next()
})

function log(...args) {
  /* eslint-disable */
  if (process.env.NODE_ENV != 'test') console.log(...args)
  /* eslint-enable */
}

app.appid = process.env.APP_ID || 'ww073d566727158bca'
app.token = process.env.APP_TOKEN || '4c9184f37cff01bcdc32dc486ec36961'
app.aesKey = process.env.APP_AES_KEY || 'trjsFvOlHtVtIu5fZn390NzJUuMlK7iegzEz5D842gk'

app.use(
  Receiver.koa({ appid: app.appid, token: app.token, aes_key: app.aesKey }, function(msg) {
    log(msg)
    switch (msg.InfoType) {
      case 'suite_ticket': //save ticket
        writeFileSync(__dirname + '/ticket.txt', msg.SuiteTicket)
        break
    }
    return
  })
)

module.exports = app

if (!module.parent) {
  app.listen(3000, '0.0.0.0')
  log('App listen to 3000')
}
