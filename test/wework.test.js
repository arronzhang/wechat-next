const Wework = require('../lib/wework')
const AccessToken = require('../lib/access-token')
const MockAdapter = require('axios-mock-adapter')

const mockAccessToken = 'abcd'

describe('common', () => {
  test('fill params', () => {
    const api = new Wework()
    expect(api.fillParams({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
    expect(api.fillParams({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 })
    expect(api.fillParams({ a: 1, b: 2 }, ['a'], ['a', 'b'])).toEqual({ a: 1, b: 2 })
    expect(() => {
      api.fillParams({ a: 1, b: 2 }, ['c'])
    }).toThrow()
  })

  test('fill params with defaults', () => {
    const api = new Wework({ a: 1 })
    expect(api.fillParams({ b: 2 })).toEqual({ a: 1, b: 2 })
    expect(api.fillParams({ b: 2 }, ['a'])).toEqual({ a: 1 })
    expect(api.fillParams({ b: 2 }, ['a'], ['a', 'b'])).toEqual({ a: 1, b: 2 })
    expect(() => {
      api.fillParams({ b: 2 }, ['c'])
    }).toThrow()
  })
  test('access token', () => {
    const api = new Wework({ a: 1 })
    api.accessToken = new AccessToken({
      access_token: mockAccessToken,
      expires_in: 2,
      created_at: Date.now()
    })
    expect(api.accessToken).toBeInstanceOf(AccessToken)
    api.accessToken = { access_token: mockAccessToken, expires_in: 2, created_at: Date.now() }
    expect(api.accessToken).toBeInstanceOf(AccessToken)
  })
  test('get authorize url', () => {
    let api = new Wework({
      corpid: 'ww073d566727158bca',
      agentid: '1000002',
      redirect_uri: '/callback'
    })
    expect(api.getAuthorizeURL()).toBe(
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww073d566727158bca&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_base&state=state#wechat_redirect'
    )
    expect(api.getQRAuthorizeURL()).toBe(
      'https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=ww073d566727158bca&agentid=1000002&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_base&state=state'
    )
    api = new Wework()
    expect(
      api.getAuthorizeURL({
        appid: 'ww073d566727158bca',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww073d566727158bca&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_base&state=state#wechat_redirect'
    )
    expect(
      api.getQRAuthorizeURL({
        corpid: 'ww073d566727158bca',
        agentid: '1000002',
        redirect_uri: '/callback'
      })
    ).toBe(
      'https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=ww073d566727158bca&agentid=1000002&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_base&state=state'
    )
  })
})

const expiresIn = 3

function mock(axios) {
  const mock = new MockAdapter(axios)
  let expiredAt = Date.now() + expiresIn * 1000
  mock.onGet('user/getuserinfo').reply(function(config) {
    let errcode = 0
    let errmsg = 'ok'

    if (!config.params.access_token) {
      errcode = 41001
      errmsg = 'access_token missing'
    } else if (config.params.access_token != mockAccessToken) {
      errcode = 40014
      errmsg = 'invalid access_token'
    } else if (Date.now() > expiredAt) {
      errcode = 42001
      errmsg = 'access_token expired'
    } else if (config.params.code != 't') {
      errcode = 40013
      errmsg = 'invalid code'
    }

    return [
      200,
      {
        errcode: errcode,
        errmsg: errmsg,
        UserId: 'arron',
        DeviceId: ''
      }
    ]
  })
  mock.onGet('gettoken').reply(function(config) {
    expiredAt = Date.now() + expiresIn * 1000
    let errcode = 0
    let errmsg = 'ok'

    if (!config.params.corpsecret) {
      errcode = 41004
      errmsg = 'corpsecret missing'
    }

    if (config.params.corpid != 't') {
      errcode = 40013
      errmsg = 'invalid corpid'
    }

    return [
      200,
      {
        errcode: errcode,
        errmsg: errmsg,
        access_token: mockAccessToken,
        expires_in: expiresIn
      }
    ]
  })
}

function delay(timeout) {
  return new Promise(ok => setTimeout(ok, timeout * 1000))
}

describe('session token', () => {
  test('get access token with default params', () => {
    const api = new Wework({
      corpid: 't',
      corpsecret: 't'
    })
    mock(api.$req)
    return api.getAccessToken().then(res => {
      expect(res.accessToken).toBe(mockAccessToken)
      expect(res.isExpired()).toBeFalsy()
    })
  })

  test('get access token', () => {
    const api = new Wework()
    mock(api.$req)
    return api
      .getAccessToken({
        corpid: 't',
        corpsecret: 't'
      })
      .then(res => {
        expect(res.accessToken).toBe(mockAccessToken)
        expect(res.isExpired()).toBeFalsy()
      })
  })

  test('get access token with invalid params', () => {
    const api = new Wework()
    mock(api.$req)
    return expect(
      api.getAccessToken({
        corpid: 't1',
        corpsecret: 't'
      })
    ).rejects.toThrow(/invalid/)
  })
})

describe('get with initial access token', () => {
  let api
  beforeEach(() => {
    api = new Wework({
      corpid: 't',
      corpsecret: 't'
    })
    mock(api.$req)
    return api.getAccessToken()
  })

  test('get user info', () => {
    return expect(
      api.getUserInfo({
        code: 't'
      })
    ).resolves.toHaveProperty('UserId', 'arron')
  })

  test('get with invalid code', () => {
    return expect(
      api.getUserInfo({
        code: 't1'
      })
    ).rejects.toThrow(/invalid/)
  })

  test('get with access token expired', () => {
    return expect(
      delay(expiresIn + 0.2).then(() => {
        return api.request('user/getuserinfo', {
          params: { code: 't' }
        })
      })
    ).rejects.toThrow(/expired/)
  })

  test('auto refresh access token when expired', () => {
    return expect(
      delay(expiresIn + 0.2).then(() => {
        return api.authorizeRequest('user/getuserinfo', {
          params: { code: 't' }
        })
      })
    ).resolves.toHaveProperty('UserId')
  })
})

describe('get without initial access token', () => {
  let api
  beforeAll(() => {
    api = new Wework()
    mock(api.$req)
  })

  test('get user info', () => {
    return expect(
      api.getUserInfo({
        access_token: mockAccessToken,
        code: 't'
      })
    ).resolves.toHaveProperty('UserId', 'arron')
  })

  test('get with missing token', () => {
    return expect(
      api.getUserInfo({
        code: 't'
      })
    ).rejects.toThrow(/missing/)
  })

  test('get with invalid token', () => {
    return expect(
      api.getUserInfo({
        access_token: 'abc',
        code: 't'
      })
    ).rejects.toThrow(/invalid/)
  })

  test('get with invalid code', () => {
    return expect(
      api.getUserInfo({
        access_token: mockAccessToken,
        code: 't1'
      })
    ).rejects.toThrow(/invalid/)
  })
})

describe('get/save access token api', () => {
  test('get access token', () => {
    const api = new Wework({
      corpid: 't',
      corpsecret: 't'
    })
    mock(api.$req)

    return expect(
      api
        .getUserInfo({
          code: 't'
        })
        .then(() => api.accessToken.data)
    ).resolves.toHaveProperty('access_token', mockAccessToken)
  })

  test('access token store api', () => {
    const api = new Wework({
      corpid: 't',
      corpsecret: 't',
      getAccessToken(params) {
        expect(params.corpid).toBe('t')
        return null
      },
      saveAccessToken(token, params) {
        expect(token.access_token).toBe(mockAccessToken)
        expect(params.corpid).toBe('t')
      }
    })
    mock(api.$req)
    expect.assertions(4)
    return expect(
      api.getUserInfo({
        code: 't'
      })
    ).resolves.toHaveProperty('UserId', 'arron')
  })

  test('getAccessToken will not call store api', () => {
    const api = new Wework({
      corpid: 't',
      corpsecret: 't',
      getAccessToken(params) {
        expect(params.corpid).toBe('t')
        return null
      },
      saveAccessToken(token, params) {
        expect(token.access_token).toBe(mockAccessToken)
        expect(params.corpid).toBe('t')
      }
    })
    mock(api.$req)
    expect.assertions(1)
    return expect(
      api.getAccessToken().then(() =>
        api.getUserInfo({
          code: 't'
        })
      )
    ).resolves.toHaveProperty('UserId', 'arron')
  })

  test('save token api', () => {
    const api = new Wework({
      corpid: 't',
      corpsecret: 't'
    })
    mock(api.$req)
    expect.assertions(2)
    return expect(
      api.getAccessToken().then(t => {
        const api = new Wework({
          getAccessToken(params) {
            expect(params.corpid).toBeUndefined()
            return t
          }
        })
        mock(api.$req)

        return api.getUserInfo({
          code: 't'
        })
      })
    ).resolves.toHaveProperty('UserId', 'arron')
  })
})
