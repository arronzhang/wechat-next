import { AccessToken, ValidateError, WxWork, WechatOauth, Receiver } from '../../'

let ac = new AccessToken({
  access_token: 'test',
  expires_in: 7200
})
ac.accessToken
ac.isExpired()

let err = new ValidateError('err')
err.message

WxWork.defines({
  test: ['get', 'test'],
  test1: ['get', 'test', ['auth']],
  test2: ['get', 'test', null, ['auth']]
})

let wxWork = new WxWork()
wxWork.getAuthorizeURL({ corpid: 't' })

let oauth = new WechatOauth()
oauth.getAuthorizeURL()
//oauth.decryptData('aa', 'aa', '');
//let user = wxWork.getUserInfo({code: '1111'});
Receiver.express(null, (msg, req, cb) => {
  cb('')
})

Receiver.koa(null, (msg, ctx) => {
  return ''
})

Receiver.koa(null, async (msg, ctx) => {
  return ''
})

