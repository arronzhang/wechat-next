const Wework = require('../lib/wework.js')
const MockAdapter = require('axios-mock-adapter')

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
})

function mock(axios) {
  const mock = new MockAdapter(axios)
  mock.onGet('user/getuserinfo').reply(function(config) {
    let errcode = 0
    let errmsg = 'ok'

    if (!config.params.access_token) {
      errcode = 41001
      errmsg = 'access_token missing'
    } else if (config.params.access_token != 'abcd') {
      errcode = 40014
      errmsg = 'invalid access_token'
    }

    if (config.params.code != 't') {
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
        access_token: 'abcd',
        expires_in: 7200
      }
    ]
  })
}

describe('session token', () => {
  test('get access token with default params', () => {
    const api = new Wework({
      corpid: 't',
      corpsecret: 't'
    })
    mock(api.$req)
    return api.getAccessToken().then(res => {
      expect(res.accessToken).toBe('abcd')
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
        expect(res.accessToken).toBe('abcd')
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

describe('get with init access token', () => {
  let api
  beforeAll(() => {
    api = new Wework({
      corpid: 't',
      corpsecret: 't'
    })
    mock(api.$req)
    return api.getAccessToken()
  })

  test('get user info', () => {
    return api
      .getUserInfo({
        code: 't'
      })
      .then(data => {
        expect(data.UserId).toBe('arron')
      })
  })

  test('get with invalid code', () => {
    return expect(
      api.getUserInfo({
        code: 't1'
      })
    ).rejects.toThrow(/invalid/)
  })
})

describe('get without init access token', () => {
  let api
  beforeAll(() => {
    api = new Wework()
    mock(api.$req)
  })

  test('get user info', () => {
    return api
      .getUserInfo({
        access_token: 'abcd',
        code: 't'
      })
      .then(data => {
        expect(data.UserId).toBe('arron')
      })
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
        code: 't1'
      })
    ).rejects.toThrow(/invalid/)
  })
})
