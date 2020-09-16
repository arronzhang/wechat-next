const WechatOauth = require('../index').WechatOauth
const mock = require('./wechat.mock')

describe('wechat oauth', () => {
  let api
  beforeEach(() => {
    api = new WechatOauth({
      appid: mock.appId,
      secret: mock.appSecret,
    })
    mock(api.$req)
  })

  test('get access token', () => {
    return expect(
      api.getAccessToken(mock.authCode).then((token) => token.data)
    ).resolves.toHaveProperty('openid', mock.openid)
  })

  test('get user info', () => {
    return expect(
      api.getAccessToken(mock.authCode).then((token) => api.getUserInfo(token.data.openid))
    ).resolves.toHaveProperty('openid', mock.openid)
  })

  test('invalid openid', () => {
    return expect(api.getAccessToken(mock.authCode).then(() => api.getUserInfo())).rejects.toThrow()
  })

  test('get authorize url', () => {
    expect(
      api.getAuthorizeURL({
        appid: '1',
        redirect_uri: '/callback',
      })
    ).toBe(
      'https://open.weixin.qq.com/connect/oauth2/authorize?appid=1&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_base&state=state#wechat_redirect'
    )
  })

  test('get qr authorize url', () => {
    expect(
      api.getQRAuthorizeURL({
        appid: '1',
        redirect_uri: '/callback',
      })
    ).toBe(
      'https://open.weixin.qq.com/connect/qrconnect?appid=1&redirect_uri=%2Fcallback&response_type=code&scope=snsapi_login&state=state'
    )
  })

  test('js code to session', () => {
    return expect(api.code2Session(mock.authCode)).resolves.toHaveProperty('openid', mock.openid)
  })
  test('decrypt data', () => {
    var appId = 'wx4f4bc4dec97d474b'
    var sessionKey = 'tiihtNczf5v6AKRyjwEUhQ=='
    var encryptedData =
      'CiyLU1Aw2KjvrjMdj8YKliAjtP4gsMZM' +
      'QmRzooG2xrDcvSnxIMXFufNstNGTyaGS' +
      '9uT5geRa0W4oTOb1WT7fJlAC+oNPdbB+' +
      '3hVbJSRgv+4lGOETKUQz6OYStslQ142d' +
      'NCuabNPGBzlooOmB231qMM85d2/fV6Ch' +
      'evvXvQP8Hkue1poOFtnEtpyxVLW1zAo6' +
      '/1Xx1COxFvrc2d7UL/lmHInNlxuacJXw' +
      'u0fjpXfz/YqYzBIBzD6WUfTIF9GRHpOn' +
      '/Hz7saL8xz+W//FRAUid1OksQaQx4CMs' +
      '8LOddcQhULW4ucetDf96JcR3g0gfRK4P' +
      'C7E/r7Z6xNrXd2UIeorGj5Ef7b1pJAYB' +
      '6Y5anaHqZ9J6nKEBvB4DnNLIVWSgARns' +
      '/8wR2SiRS7MNACwTyrGvt9ts8p12PKFd' +
      'lqYTopNHR1Vf7XjfhQlVsAJdNiKdYmYV' +
      'oKlaRv85IfVunYzO0IKXsyl7JCUjCpoG' +
      '20f0a04COwfneQAGGwd5oa+T8yO5hzuy' +
      'Db/XcxxmK01EpqOyuxINew=='
    var iv = 'r7BXXKkLb8qrSNn05n0qiA=='

    expect(new WechatOauth().decryptData(encryptedData, sessionKey, iv, appId)).toHaveProperty(
      'watermark'
    )
    expect(
      new WechatOauth({ appid: appId }).decryptData(encryptedData, sessionKey, iv)
    ).toHaveProperty('watermark')
    expect(
      new WechatOauth({ appid: appId }).decryptData({
        data: encryptedData,
        session_key: sessionKey,
        iv: iv,
      })
    ).toHaveProperty('watermark')

    expect(function () {
      new WechatOauth().decryptData('abc' + encryptedData, sessionKey, iv, appId)
    }).toThrow()
  })
})
