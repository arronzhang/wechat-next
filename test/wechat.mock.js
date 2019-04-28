const MockAdapter = require('axios-mock-adapter')

module.exports = mock

mock.expiresIn = 1.2
mock.appid = process.env.APP_ID || 'ww073d566727158bca'
mock.secret = process.env.APP_SECRET || 'test'
mock.accessToken = 'abcd'
mock.openid = 'test'
mock.authCode = 'code'
mock.menu = {
  button: [
    {
      type: 'click',
      name: 'Example',
      key: 'key'
    }
  ]
}

function mock(axios) {
  if (process.env.APP_SECRET) return

  const adapter = new MockAdapter(axios)
  let expiredAt = Date.now() + mock.expiresIn * 1000

  function invalidToken(config) {
    let errcode = 0
    let errmsg = 'ok'
    if (!config.params.access_token) {
      errcode = 41001
      errmsg = 'access_token missing'
    } else if (config.params.access_token != mock.accessToken) {
      errcode = 40014
      errmsg = 'invalid access_token'
    } else if (Date.now() > expiredAt) {
      errcode = 42001
      errmsg = 'access_token expired'
    }
    if (errcode)
      return [
        200,
        {
          errcode: errcode,
          errmsg: errmsg
        }
      ]
  }

  adapter.onGet('token').reply(function(config) {
    expiredAt = Date.now() + mock.expiresIn * 1000
    let errcode = 0
    let errmsg = 'ok'

    if (!config.params.secret) {
      errcode = 41004
      errmsg = 'secret missing'
    }

    if (config.params.appid != mock.appid) {
      errcode = 40013
      errmsg = 'invalid appid'
    }

    return [
      200,
      {
        errcode: errcode,
        errmsg: errmsg,
        access_token: mock.accessToken,
        expires_in: mock.expiresIn
      }
    ]
  })

  adapter.onGet('menu/get').reply(function(config) {
    let ret = invalidToken(config)
    if (ret) return ret
    return [
      200,
      {
        errcode: 0,
        errmsg: 'ok',
        menu: mock.menu
      }
    ]
  })

  adapter.onPost('menu/create').reply(function(config) {
    let ret = invalidToken(config)
    if (ret) return ret
    return [
      200,
      {
        errcode: 0,
        errmsg: 'ok'
      }
    ]
  })

  // sns
  adapter.onGet('oauth2/access_token').reply(function(config) {
    expiredAt = Date.now() + mock.expiresIn * 1000
    let errcode = 0
    let errmsg = 'ok'

    if (!config.params.secret) {
      errcode = 41004
      errmsg = 'secret missing'
    }

    if (config.params.appid != mock.appid) {
      errcode = 40013
      errmsg = 'invalid appid'
    }

    if (config.params.code != mock.authCode) {
      errcode = 40029
      errmsg = 'invalid code'
    }

    return [
      200,
      {
        errcode: errcode,
        errmsg: errmsg,
        access_token: mock.accessToken,
        openid: mock.openid,
        refresh_token: 'token',
        scope: 'snsapi_base',
        expires_in: mock.expiresIn
      }
    ]
  })

  adapter.onGet('userinfo').reply(function(config) {
    let errcode = 0
    let errmsg = 'ok'
    let ret = invalidToken(config)
    if (ret) return ret
    if (config.params.openid != mock.openid) {
      errcode = 40013
      errmsg = 'invalid openid'
    }
    return [
      200,
      {
        errcode: errcode,
        errmsg: errmsg,
        openid: mock.openid,
        ' nickname': 'name'
      }
    ]
  })
}
