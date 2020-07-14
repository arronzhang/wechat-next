const { Receiver } = require('../')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.enable('trust proxy')

app.use(
  bodyParser.text({
    type: 'text/*'
  })
)

app.use(function log(req, res, next) {
  /* eslint-disable */
  if (process.env.NODE_ENV != 'test') console.log(req.headers, req.method, req.query, req.body)
  /* eslint-enable */
  return next()
})

//app.appid = 'wx2169a1c982fe6157'
app.appid = 'ww073d566727158bca'
app.token = '4c9184f37cff01bcdc32dc486ec36961'
app.aesKey = 'trjsFvOlHtVtIu5fZn390NzJUuMlK7iegzEz5D842gk'

app.all(
  '/',
  Receiver.express({ appid: app.appid, token: app.token, aes_key: app.aesKey }, function(
    msg,
    req,
    cb
  ) {
    if (msg.Content == 'error') {
      throw new Error('error')
    }
    if (msg.MsgType == 'text') {
      return cb(msg.Content)
    }
    cb('')
  })
)

module.exports = app

if (!module.parent) {
  app.listen(3000, '0.0.0.0')
}
