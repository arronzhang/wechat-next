const WeworkProvider = require('../lib/wework-provider')
const mock = require('./wework.mock')

describe('wework provider', () => {
  let api
  beforeEach(() => {
    api = new WeworkProvider({
      corpid: mock.corpid,
      provider_secret: mock.corpsecret
    })
    mock(api.$req)
  })

  test('get user info', () => {
    return expect(api.getUserInfo('t')).resolves.toHaveProperty('user_info')
  })

  test('get authorize url', () => {
    expect(
      api.getAuthorizeURL({
        corpid: '1',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=1&redirect_uri=%2Fcallback&state=state&usertype=admin'
    )
  })
})
