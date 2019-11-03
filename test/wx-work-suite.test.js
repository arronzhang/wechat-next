const WxWorkSuite = require('../lib/wx-work-suite')
const mock = require('./wx-work.mock')

describe('wx work suite', () => {
  let api
  beforeEach(() => {
    api = new WxWorkSuite({
      suite_id: mock.appId,
      suite_secret: mock.appSecret,
      suite_ticket: mock.appTicket
    })
    mock(api.$req)
  })

  test('get token', () => {
    return expect(api.getAccessToken().then(t => t.data)).resolves.toHaveProperty('access_token')
  })

  test('get authorize url', () => {
    expect(
      api.getAuthorizeURL({
        suite_id: '1',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=1&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_userinfo&state=state#wechat_redirect'
    )
    expect(api.getAuthorizeURL()).toBe(
      `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${mock.appId}&redirect_uri=&response_type=code&scope=snsapi_userinfo&state=state#wechat_redirect`
    )
  })

  test('get install url', () => {
    expect(
      api.getInstallURL({
        suite_id: '1',
        pre_auth_code: '1',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.work.weixin.qq.com/3rdapp/install?suite_id=1&pre_auth_code=1&redirect_uri=%2Fcallback&state=state'
    )
    expect(api.getInstallURL()).toBe(
      `https://open.work.weixin.qq.com/3rdapp/install?suite_id=${mock.appId}&pre_auth_code=&redirect_uri=&state=state`
    )
  })
})
