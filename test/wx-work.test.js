const WxWork = require('../lib/wx-work')
const AccessToken = require('../lib/access-token')
const mock = require('./wx-work.mock')

describe('common', () => {
  test('access token', () => {
    const api = new WxWork({ a: 1 })
    api.accessToken = new AccessToken({
      access_token: mock.accessToken,
      expires_in: 2,
      created_at: Date.now()
    })
    expect(api.accessToken).toBeInstanceOf(AccessToken)
    api.accessToken = { access_token: mock.accessToken, expires_in: 2, created_at: Date.now() }
    expect(api.accessToken).toBeInstanceOf(AccessToken)
  })
  test('get authorize url', () => {
    let api = new WxWork({
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
    api = new WxWork()
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

function delay(timeout) {
  return new Promise(ok => setTimeout(ok, timeout * 1000))
}

describe('session token', () => {
  test('get access token with default params', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return api.getAccessToken().then(res => {
      expect(res.accessToken).toBe(mock.accessToken)
      expect(res.isExpired()).toBeFalsy()
    })
  })

  test('get access token', () => {
    const api = new WxWork()
    mock(api.$req)
    return api
      .getAccessToken({
        corpid: mock.appId,
        corpsecret: mock.appSecret
      })
      .then(res => {
        expect(res.accessToken).toBe(mock.accessToken)
        expect(res.isExpired()).toBeFalsy()
      })
  })

  test('get access token with invalid params', () => {
    const api = new WxWork()
    mock(api.$req)
    return expect(
      api.getAccessToken({
        corpid: mock.appId + '___',
        corpsecret: mock.appSecret
      })
    ).rejects.toThrow(/invalid/)
  })
})

describe('get with initial access token', () => {
  let api
  beforeEach(() => {
    api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return api.getAccessToken()
  })

  test('get user info', () => {
    return expect(api.getUserInfo('t')).resolves.toHaveProperty('UserId', 'arron')
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
      delay(mock.expiresIn + 0.2).then(() => {
        return api.request('cgi-bin/user/getuserinfo', {
          params: { code: 't' }
        })
      })
    ).rejects.toThrow(/expired/)
  })

  test('auto refresh access token when expired', () => {
    return expect(
      delay(mock.expiresIn + 0.2).then(() => {
        return api.get('cgi-bin/user/getuserinfo', { code: 't' })
      })
    ).resolves.toHaveProperty('UserId')
  })
})

describe('get without initial access token', () => {
  let api
  beforeAll(() => {
    api = new WxWork()
    mock(api.$req)
  })

  test('get user info', () => {
    return expect(
      api.getUserInfo({
        access_token: mock.accessToken,
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
        access_token: mock.accessToken,
        code: 't1'
      })
    ).rejects.toThrow(/invalid/)
  })
})

describe('get/save access token api', () => {
  test('get access token', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)

    return expect(
      api
        .getUserInfo({
          code: 't'
        })
        .then(() => api.accessToken.data)
    ).resolves.toHaveProperty('access_token', mock.accessToken)
  })

  test('access token store api', () => {
    const api = new WxWork(
      {
        corpid: mock.appId,
        corpsecret: mock.appSecret
      },
      {
        getAccessToken(params) {
          expect(params.corpid).toBe(mock.appId)
          return null
        },
        saveAccessToken(token, params) {
          expect(token.access_token).toBe(mock.accessToken)
          expect(params.corpid).toBe(mock.appId)
        }
      }
    )
    mock(api.$req)
    expect.assertions(4)
    return expect(
      api.getUserInfo({
        code: 't'
      })
    ).resolves.toHaveProperty('UserId', 'arron')
  })

  test('getAccessToken will not call store api', () => {
    const api = new WxWork(
      {
        corpid: mock.appId,
        corpsecret: mock.appSecret
      },
      {
        getAccessToken(params) {
          expect(params.corpid).toBe(mock.appId)
          return null
        },
        saveAccessToken(token, params) {
          expect(token.access_token).toBe(mock.accessToken)
          expect(params.corpid).toBe(mock.appId)
        }
      }
    )
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
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    expect.assertions(2)
    return expect(
      api.getAccessToken().then(t => {
        const api = new WxWork(
          {},
          {
            getAccessToken(params) {
              expect(params.corpid).toBeUndefined()
              return t
            }
          }
        )
        mock(api.$req)

        return api.getUserInfo({
          code: 't'
        })
      })
    ).resolves.toHaveProperty('UserId', 'arron')
  })
})

describe('post', () => {
  test('post data', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return expect(
      api.createMenu('1000002', {
        button: [
          {
            type: 'click',
            name: '今日歌曲',
            key: 'V1001_TODAY_MUSIC'
          }
        ]
      })
    ).resolves.toHaveProperty('errmsg', 'ok')
  })
})

describe('media', () => {
  test('upload media', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return expect(
      api.uploadMedia('file', { media: __dirname + '/media.txt' })
    ).resolves.toHaveProperty('media_id')
  })

  test('data', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return expect(api.uploadMedia('file', __dirname + '/media.txt')).resolves.toHaveProperty(
      'media_id'
    )
  })

  test('upload error', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return expect(api.uploadMedia('file')).rejects.toThrow()
  })

  test('get media', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return expect(
      api.uploadMedia('file', { media: __dirname + '/media.txt' }).then(data => {
        return api.getMedia(data.media_id)
      })
    ).resolves.toBeInstanceOf(Buffer)
  })

  test('get error', () => {
    const api = new WxWork({
      corpid: mock.appId,
      corpsecret: mock.appSecret
    })
    mock(api.$req)
    return expect(api.getMedia('---')).rejects.toThrow()
  })
})
