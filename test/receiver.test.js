const { Receiver } = require('../')
const crypto = require('../lib/crypto')
const request = require('supertest')
const qs = require('querystring')

describe('parse', () => {
  let config = {
    token: '4c9184f37cff01bcdc32dc486ec36961'
  }
  test('validate get', () => {
    let query = {
      signature: 'b5c32d63ae3061aec855af7b638dcef72cb6f46a',
      echostr: '4810926405170593787',
      timestamp: '1555644411',
      nonce: '1395122694'
    }
    expect(Receiver.verify(config, query)).toHaveProperty('message', '4810926405170593787')
    expect(Receiver.verify({ token: 'abc' }, query)).toBeFalsy()
  })

  test('validate post', () => {
    let query = {
      signature: '00d8395e2b7dfe793e50d37ff4bf6516ddc35a71',
      timestamp: '1555664951',
      nonce: '1391619866',
      openid: 'oP8vYt86psFCDN_YWUaZpPhOQDTk'
    }

    expect(Receiver.parse(config, query, undefined)).toBeFalsy()
    expect(Receiver.parse(config, query, 'xxxx')).toBeFalsy()
    expect(Receiver.parse(config, query, '<x></x>')).toBeFalsy()

    expect(
      Receiver.parse(
        config,
        query,
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      ).message
    ).toHaveProperty('ToUserName', 'gh_39993584375c')
  })
})

describe('stringify', () => {
  test('patch relay message', () => {
    let patch = Receiver.patchReplyMessage
    let from = {
      FromUserName: 'user',
      ToUserName: 'server'
    }
    expect(patch('abc')).toHaveProperty('Content', 'abc')
    expect(patch('abc')).toHaveProperty('MsgType', 'text')
    expect(patch('abc', from)).toHaveProperty('FromUserName', 'server')
    expect(patch('abc', from)).toHaveProperty('ToUserName', 'user')
    expect(patch('abc')).toHaveProperty('CreateTime')

    let articles = [
      {
        Title: 'abc'
      }
    ]
    expect(patch(articles, from)).toHaveProperty('ArticleCount', 1)
    expect(patch(articles, from).Articles).toEqual(articles)
    expect(patch({ type: 'video' }, from)).toHaveProperty('MsgType', 'video')
  })

  test('stringify data', () => {
    let txt = Receiver.stringifyData({
      ToUserName: 'to',
      FromUserName: 'from',
      CreateTime: 12345678,
      MsgType: 'music',
      Music: {
        Title: 'music',
        ThumbMediaId: 'media_id'
      },
      ArticleCount: 2,
      Articles: [{ Title: 'Article' }, { Title: 'Article1' }],
      Articles1: [{ Title: 'Article2' }]
    })
    expect(txt).toMatch('<ToUserName><![CDATA[to]]></ToUserName>')
    expect(txt).toMatch('<CreateTime>12345678</CreateTime>')
    expect(txt).toMatch('<ThumbMediaId><![CDATA[media_id]]></ThumbMediaId>')
    expect(txt).toMatch(/<Articles>[\s\n\t]+<item>[\s\n\t]+<Title>/i)

    txt = Receiver.stringifyData({
      Articles: { item: [{ Title: 'Article' }] }
    })
    expect(txt).toMatch(/<Articles>[\s\n\t]+<item>[\s\n\t]+<Title>/i)
  })

  test('stringify', () => {
    let from = {
      FromUserName: 'user',
      ToUserName: 'server'
    }
    let txt = Receiver.stringify({}, {}, from, 'text')
    expect(txt).toMatch(/^<xml>[\s\n\t]+<MsgType>/i)
    expect(txt).toMatch('<MsgType><![CDATA[text]]></MsgType>')
    expect(txt).toMatch('<Content><![CDATA[text]]></Content>')
    expect(txt).toMatch('<FromUserName><![CDATA[server]]></FromUserName>')
    txt = Receiver.stringify({}, {}, from, [{ Title: 'art' }])
    expect(txt).toMatch(/<Articles>[\s\n\t]+<item>[\s\n\t]+<Title>/i)
    txt = Receiver.stringify({}, {}, from, {
      type: 'video',
      Video: {
        MediaId: 'media_id'
      }
    })
    expect(txt).toMatch(/<Video>[\s\n\t]+<MediaId>/i)
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
