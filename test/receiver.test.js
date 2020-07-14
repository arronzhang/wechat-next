const { Receiver } = require('../')
const crypto = require('../lib/crypto')
const request = require('supertest')
const qs = require('querystring')

describe('parse', () => {
  let config = {
    token: '4c9184f37cff01bcdc32dc486ec36961',
    aes_key: 'trjsFvOlHtVtIu5fZn390NzJUuMlK7iegzEz5D842gk'
  }
  test('verify get', () => {
    let query = {
      signature: 'b5c32d63ae3061aec855af7b638dcef72cb6f46a',
      echostr: '4810926405170593787',
      timestamp: '1555644411',
      nonce: '1395122694'
    }
    expect(Receiver.verify(config, query)).toHaveProperty('message', '4810926405170593787')
    expect(Receiver.verify({ token: 'abc' }, query)).toBeFalsy()
  })

  test('verify encrypt get', () => {
    let query = {
      msg_signature: 'f7c79f3dc665af0d3e1bbea24bbb83d419a71c22',
      timestamp: '1556160617',
      nonce: '1556981187',
      echostr:
        '6Avuw0X7tDGCurnVT5SfdJJiOVs7Vo2JNlulGKXN0BFug2JNSa5JvVJctq5W7/wVnlZA88gZbvrBctZ9aqsFCA=='
    }
    expect(Receiver.verify(config, query)).toHaveProperty('message', '5111188581961824511')
    expect(Receiver.verify({ token: 'abc' }, query)).toBeFalsy()
    expect(() => Receiver.verify({ token: config.token }, query)).toThrow()
    expect(() => Receiver.verify({ token: config.token, aes_key: 'trjsFvOl' }, query)).toThrow()
  })

  test('verify post', () => {
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
      Receiver.parse(config, query, { xml: { ToUserName: ['arron'] } }).message
    ).toHaveProperty('ToUserName', 'arron')
    expect(
      Receiver.parse(
        config,
        query,
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      ).message
    ).toHaveProperty('ToUserName', 'gh_39993584375c')
  })

  test('verify encrypt post', () => {
    let query = {
      msg_signature: 'c781fe571a16a5fe3edc0bed9b97149d91c9f135',
      timestamp: '1556161274',
      nonce: '1556840412'
    }

    expect(Receiver.parse(config, query, undefined)).toBeFalsy()
    expect(Receiver.parse(config, query, 'xxxx')).toBeFalsy()
    expect(Receiver.parse(config, query, '<x></x>')).toBeFalsy()

    expect(
      Receiver.parse(
        config,
        query,
        '<xml><ToUserName><![CDATA[ww073d566727158bca]]></ToUserName><Encrypt><![CDATA[43SCt2110KwTepEygg3mCUR1J5+xPGPJ/A8vSvxPnqMsi7ANDuS9oj+JbxK2u5Lbi4ruP4V90wbdKSNKyezqzVfiaA/NUUeXNt9clRg5FSDVuPZ9mQEgAeoe7McxWSDv+vBAF6f9MKkds7zjyRAYVjs8Kptt79tixXFge8PdZVjGEQZcwbs0byrnTxr7EC3b20pQWElDcdXYyRptEyBt4nn3CcSLKStmxhZ9/ZtoMAAHXP+6Es+2d/hbXiVu9jjxK1/crbyRrSz9luLN+j9rwil+CbEm3K5+CW4biVPPwVozTUUR5nQLmCNtU1BiEadu/Gke0N58DtQX6/slGNl91ryOp9flwiem0Sw0O7YTsw8LJonEHi/wKMor4M7TL9+z69zGGH9Fmn0RJLwAv0h65mcIx7/IBtgnFDlpfiVYzdM=]]></Encrypt><AgentID><![CDATA[1000002]]></AgentID></xml>'
      ).message
    ).toHaveProperty('FromUserName', 'arron')
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
    expect(patch({ type: 'video', FromUserName: 'from' }, from)).toHaveProperty(
      'FromUserName',
      'from'
    )
    expect(patch({ type: 'video', ToUserName: 'to' }, from)).toHaveProperty('ToUserName', 'to')
    expect(patch({ type: 'video', CreateTime: 't' }, from)).toHaveProperty('CreateTime', 't')
  })

  test('stringify', () => {
    let from = {
      FromUserName: 'user',
      ToUserName: 'server'
    }
    expect(Receiver.stringify({}, {}, from, '')).toBe('success')
    expect(Receiver.stringify({}, {}, from, 'success')).toBe('success')
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
    expect(() => Receiver.stringify({}, { msg_signature: 'xx' }, from, 'text')).toThrow()
    let config = {
      appid: 'ww073d566727158bca',
      token: '4c9184f37cff01bcdc32dc486ec36961',
      aes_key: 'trjsFvOlHtVtIu5fZn390NzJUuMlK7iegzEz5D842gk'
    }
    txt = Receiver.stringify(config, { msg_signature: 'xx' }, from, 'text')
    expect(txt).toMatch(/<Encrypt>/i)
  })
})

function testapp(app, id, token, aesKey) {
  afterAll(() => {
    app.close && app.close()
  })

  function query(echostr, encryptData) {
    let q = {
      timestamp: new Date().getTime(),
      nonce: parseInt(Math.random() * 10e10, 10)
    }

    if (encryptData) {
      if (echostr) {
        q.echostr = crypto.encrypt(aesKey, id, echostr)
        q.msg_signature = crypto.shasum(q.timestamp, q.nonce, token, q.echostr)
      } else {
        q.msg_signature = crypto.shasum(q.timestamp, q.nonce, token, encryptData)
      }
    } else {
      if (echostr) q.echostr = echostr
      q.signature = crypto.shasum(q.timestamp, q.nonce, token)
    }
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

  test('signature encrypt', () => {
    return request(app)
      .get(query('randomtext', true))
      .expect(200)
      .expect('randomtext')
  })

  test('send data', () => {
    return request(app)
      .post(query(null))
      .set('Content-Type', 'text/xml')
      .send(
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      )
      .expect(200)
      .expect(/<Content><!\[CDATA\[hi\]\]><\/Content>/)
  })

  test('unexpect error', () => {
    return request(app)
      .post(query(null))
      .set('Content-Type', 'text/xml')
      .send(
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[error]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      )
      .expect(500)
  })

  test('send data invalid signature', () => {
    return request(app)
      .post(query(null) + '_')
      .set('Content-Type', 'text/xml')
      .send(
        '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
      )
      .expect(401)
  })

  test('send encrypt data', () => {
    let data = crypto.encrypt(
      aesKey,
      id,
      '<xml><ToUserName><![CDATA[gh_39993584375c]]></ToUserName>\n<FromUserName><![CDATA[oP8vYt86psFCDN_YWUaZpPhOQDTk]]></FromUserName>\n<CreateTime>1555664951</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[hi]]></Content>\n<MsgId>22271766593385610</MsgId>\n</xml>'
    )

    return request(app)
      .post(query(null, data))
      .set('Content-Type', 'text/xml')
      .send(`<xml><Encrypt><![CDATA[${data}]]></Encrypt></xml>`)
      .expect(200)
      .expect(/<Encrypt>/)
  })

  test('send empty encrypt data', () => {
    let data = crypto.encrypt(aesKey, id, '')
    return request(app)
      .post(query(null, data))
      .set('Content-Type', 'text/xml')
      .send(`<xml><Encrypt><![CDATA[${data}]]></Encrypt></xml>`)
      .expect(401)
  })

  test('send invalid encrypt data', () => {
    let data = crypto.encrypt(aesKey, id, '<x></x>')
    return request(app)
      .post(query(null, data))
      .set('Content-Type', 'text/xml')
      .send(`<xml><Encrypt><![CDATA[${data}]]></Encrypt></xml>`)
      .expect(401)
  })

  test('send invalid data', () => {
    return request(app)
      .post(query(null))
      .set('Content-Type', 'text/xml')
      .send('<xml2></xml2>')
      .expect(401)
  })

  test('send empty data', () => {
    return request(app)
      .post(query(null))
      .set('Content-Type', 'text/xml')
      .send('')
      .expect(401)
  })

  test('invild method', () => {
    return request(app)
      .put(query(null))
      .set('Content-Type', 'text/xml')
      .expect(501)
  })
}

describe('app', () => {
  let app = require('./receiver-app-koa')
  testapp(app.listen(), app.appid, app.token, app.aesKey)
  app = require('./receiver-app-express')
  testapp(app, app.appid, app.token, app.aesKey)
})
