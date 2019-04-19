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

app.id = 'wx2169a1c982fe6157'
app.token = '4c9184f37cff01bcdc32dc486ec36961'

app.all(
  '/',
  Receiver.express({ id: app.id, token: app.token }, function(message, req, cb) {
    cb('')
  })
)

module.exports = app

if (!module.parent) {
  app.listen(3000, '0.0.0.0')
}
