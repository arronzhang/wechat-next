const WxWorkProvider = require('../lib/wx-work-provider')
const mock = require('./wx-work.mock')

describe('wx work provider', () => {
  let api
  beforeEach(() => {
    api = new WxWorkProvider({
      corpid: mock.appId,
      provider_secret: mock.appSecret,
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
        redirect_uri: '/callback',
      })
    ).toBe(
      'https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=1&redirect_uri=%2Fcallback&state=state&usertype=admin'
    )
    expect(api.getAuthorizeURL()).toBe(
      `https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect?appid=${mock.appId}&redirect_uri=&state=state&usertype=admin`
    )
  })
})
