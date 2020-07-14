import { AccessToken, ValidateError, WxWork, WechatOauth, Receiver } from '../../'
import { ok, equal } from 'assert'

let ac = new AccessToken({
  access_token: 'test',
  expires_in: 7200
})
equal(ac.accessToken, 'test')
ok(!ac.isExpired())

let err = new ValidateError('err')
equal(err.message, 'err')

WxWork.defines({
  test: ['get', 'test'],
  test1: ['get', 'test', ['auth']],
  test2: ['get', 'test', null, ['auth']]
})

let wxWork = new WxWork()
let url = wxWork.getAuthorizeURL({ corpid: 't' })
ok(url)

let oauth = new WechatOauth()
ok(oauth.getAuthorizeURL())
//oauth.decryptData('aa', 'aa', '');
//let user = wxWork.getUserInfo({code: '1111'});
let expressMiddleware = Receiver.express(null, (msg, req, cb) => {
  cb('')
})
ok(expressMiddleware)

let koaMiddleware = Receiver.koa(null, (msg, ctx) => {
  return ''
})

Receiver.koa(null, async (msg, ctx) => {
  return ''
})

ok(koaMiddleware)
