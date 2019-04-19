const { Receiver } = require('../')
const crypto = require('../lib/crypto')
const request = require('supertest')
const qs = require('querystring')

describe('parse', () => {
  let token = '4c9184f37cff01bcdc32dc486ec36961'
  test('validate get', () => {
    let query = {
      signature: 'b5c32d63ae3061aec855af7b638dcef72cb6f46a',
      echostr: '4810926405170593787',
      timestamp: '1555644411',
      nonce: '1395122694'
    }
    expect(Receiver.parse(token, null, query)).toHaveProperty('message', '4810926405170593787')
    expect(Receiver.parse('abc', null, query)).toBeFalsy()
  })

  test('validate post', () => {
    let query = {
      signature: '00d8395e2b7dfe793e50d37ff4bf6516ddc35a71',
      timestamp: '1555664951',
      nonce: '1391619866',
      openid: 'oP8vYt86psFCDN_YWUaZpPhOQDTk'
    }

    expect(Receiver.parse(token, null, query, undefined)).toBeFalsy()
    expect(Receiver.parse(token, null, query, 'xxxx')).toBeFalsy()
    expect(Receiver.parse(token, null, query, '<x></x>')).toBeFalsy()

    expect(
      Receiver.parse(
        token,
        null,
        query,
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      ).message
    ).toHaveProperty('ToUserName', 'gh_39993584375c')
  })
})

describe('stringify', () => {
  test('stringify data', () => {
    let txt = Receiver.stringifyData({
      ToUserName: 'to',
      FromUserName: 'from',
      CreateTime: 12345678
    })
    expect(txt).toMatch('ToUserName')
    //console.log('11111', txt)
  })
})

function testapp(app, id, token) {
  afterAll(() => {
    app.close()
  })

  function query(echostr, openid) {
    let q = {
      timestamp: new Date().getTime(),
      nonce: parseInt(Math.random() * 10e10, 10)
    }
    if (echostr) q.echostr = echostr
    if (openid) q.openid = openid

    q.signature = crypto.shasum(q.timestamp, q.nonce, token)
    return '/?' + qs.stringify(q)
  }

  test('signature', () => {
    return request(app)
      .get(query('randomtext'))
      .expect(200)
      .expect('randomtext')
  })

  test('signature invalid', () => {
    let q = query('randomtext')
    return request(app)
      .get(q + '_')
      .expect(401)
  })

  test('send data', () => {
    return request(app)
      .post(query(null, 'abcd'))
      .set('Content-Type', 'text/xml')
      .send(
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      )
      .expect(200)
  })

  test('send invalid data', () => {
    return request(app)
      .post(query(null, 'abcd'))
      .set('Content-Type', 'text/xml')
      .send('<xml2></xml2>')
      .expect(401)
  })

  test('send empty data', () => {
    return request(app)
      .post(query(null, 'abcd'))
      .set('Content-Type', 'text/xml')
      .send('')
      .expect(401)
  })
}

describe('app', () => {
  let app = require('./receiver-app-koa')
  testapp(app.listen(), app.id, app.token, app.aesKey)
  app = require('./receiver-app-express')
  testapp(app, app.id, app.token, app.aesKey)
})
