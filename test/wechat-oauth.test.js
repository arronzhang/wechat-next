const WechatOauth = require('../index').WechatOauth
const mock = require('./wechat.mock')

describe('wechat oauth', () => {
  let api
  beforeEach(() => {
    api = new WechatOauth({
      appid: mock.appid,
      secret: mock.secret
    })
    mock(api.$req)
  })

  test('get access token', () => {
    return expect(
      api.getAccessToken(mock.authCode).then(token => token.data)
    ).resolves.toHaveProperty('openid', mock.openid)
  })

  test('get user info', () => {
    return expect(
      api.getAccessToken(mock.authCode).then(token => api.getUserInfo(token.data.openid))
    ).resolves.toHaveProperty('openid', mock.openid)
  })

  test('invalid openid', () => {
    return expect(api.getAccessToken(mock.authCode).then(() => api.getUserInfo())).rejects.toThrow()
  })

  test('get authorize url', () => {
    expect(
      api.getAuthorizeURL({
        appid: '1',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=1&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_base&state=state#wechat_redirect'
    )
  })

  test('get qr authorize url', () => {
    expect(
      api.getQRAuthorizeURL({
        appid: '1',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.weixin.qq.com/connect/qrconnect?appid=1&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_login&state=state'
    )
  })
})
