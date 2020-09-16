const Wechat = require('../index').Wechat
const mock = require('./wechat.mock')

describe('wechat', () => {
  let api
  beforeEach(() => {
    api = new Wechat({
      appid: mock.appId,
      secret: mock.appSecret,
    })
    mock(api.$req)
  })

  test('create menu', () => {
    return expect(api.createMenu(mock.menu)).resolves.toHaveProperty('errmsg', 'ok')
  })

  test('get menu', () => {
    return expect(api.getMenu()).resolves.toHaveProperty('menu')
  })
})
