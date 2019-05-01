const crypto = require('./crypto')
const { js2xml, xml2js } = require('xml-js')

const Receiver = (module.exports = {
  /**
   * Express middleware
   */
  express(defaultConfig, handler) {
    return function WechatReceiver(req, res) {
      const config = Object.assign({}, defaultConfig, req.wechatConfig)
      Receiver.handleRequest(config, req.method, req.query, req.body, function(message) {
        return new Promise(function(resolve) {
          handler(message, req, function(data) {
            resolve(data)
          })
        })
      }).then(data => {
        if (data.type) res.set('Content-Type', data.type)
        res.status(data.status).end(data.body)
      })
    }
  },

  /**
   * Koa middleware
   */
  koa(defaultConfig, handler) {
    return function WechatReceiver(ctx) {
      const config = Object.assign({}, defaultConfig, ctx.wechatConfig)
      return Receiver.handleRequest(config, ctx.method, ctx.query, ctx.request.body, function(
        message
      ) {
        return handler(message, ctx)
      }).then(data => {
        if (data.type) ctx.type = data.type
        ctx.status = data.status
        ctx.body = data.body
      })
    }
  },

  /**
   * Helper for handle request
   *
   * @param {Object} config
   * 	- id
   * 	- token
   * 	- aes_key
   * @param {String} method
   * @param {Object} query
   * @param {Object|String} xml post xml
   * @param {AsyncFunction} handler
   * @return {Promise}
   * 	- type
   * 	- status
   * 	- body
   *
   */

  handleRequest(config, method, query, xml, handler) {
    method = method.toUpperCase()
    const msg =
      'POST' === method ? Receiver.parse(config, query, xml) : Receiver.verify(config, query)
    let body = ''
    let status = 200
    if (false === msg) {
      status = 401
      body = 'Invalid signature'
    } else if ('GET' === method) {
      body = msg.message
    } else if ('POST' === method) {
      return Promise.resolve(handler(msg.message, msg.id || config.id)).then(replyMessage => {
        return {
          status: 200,
          type: 'application/xml',
          body: Receiver.stringify(config, query, msg.message, replyMessage)
        }
      })
    } else {
      status = 501
      body = 'Not Implemented'
    }
    return Promise.resolve({ body, status })
  },

  /**
   * Verify signature and return `false` when invalid
   *
   * @param {Object} config
   * 	- token
   * 	- aes_key
   * @param {Object} query
   * 	- msg_signature
   * 	- signature
   * 	- timestamp
   * 	- nonce
   * 	- echostr
   * @return {Object}
   * 	- message
   * 	- id
   */
  verify(config, query) {
    const check = [config.token, query.timestamp, query.nonce]
    const encrypted = !!query.msg_signature
    const signature = query.msg_signature || query.signature

    if (encrypted) check.push(query.echostr)

    if (signature === crypto.shasum(...check)) {
      return encrypted ? crypto.decrypt(config.aes_key, query.echostr) : { message: query.echostr }
    }
    return false
  },

  /**
   * Parse receive data
   * Verify message signature and return `false` when invalid
   *
   * @param {Object} config
   * 	- token
   * 	- aes_key
   * @param {Object} query
   * 	- msg_signature
   * 	- signature
   * 	- timestamp
   * 	- nonce
   * @param {Object} body provide only by post data
   * @return {Object}
   * 	- message
   * 	- id
   */

  parse(config, query, data) {
    if (!data) return false
    if (typeof data === 'string') data = parseXML(data)
    data = simplify(data)
    data = data && data.xml
    if (!data) return false
    const check = [config.token, query.timestamp, query.nonce]
    const encrypted = !!query.msg_signature
    const signature = query.msg_signature || query.signature

    if (encrypted) check.push(data.Encrypt)

    if (signature === crypto.shasum(...check)) {
      if (encrypted) {
        let ret = crypto.decrypt(config.aes_key, data.Encrypt)
        if (!ret.message) return false
        data = simplify(parseXML(ret.message))
        data = data && data.xml
        if (!data) return false
        return { message: data, id: ret.id }
      }
      return { message: data }
    }
    return false
  },

  /**
   * Stringify reply message
   *
   * @param {Object} config
   * 	- id
   * 	- token
   * 	- aes_key
   * @param {Object} query
   * 	- msg_signature
   *
   * @param {Object} receiveMessage
   * @param {Object|Array|String} replyMessage
   * @return {String}
   *
   */

  stringify(config, query, receiveMessage, replyMessage) {
    if (!replyMessage || 'success' === replyMessage) return 'success'
    const encrypted = !!query.msg_signature
    let xml = Receiver.stringifyData(Receiver.patchReplyMessage(replyMessage, receiveMessage))
    if (encrypted) {
      let encryptedXML = crypto.encrypt(config.aes_key, config.id, xml)
      const timestamp = parseInt(Date.now() / 1000)
      const nonce = parseInt(Math.random() * 100000000000, 10)
      return Receiver.stringifyData({
        Encrypt: encryptedXML,
        MsgSignature: crypto.shasum(config.token, timestamp, nonce, encryptedXML),
        TimeStamp: timestamp,
        Nonce: nonce
      })
    } else {
      return xml
    }
  },

  /**
   * Patch replay message
   *
   * @param {Object|Array|String} msg
   * @param {Object} receiveMessage
   * @return {Object}
   *
   */
  patchReplyMessage(msg, receiveMessage = {}) {
    const ret = {}
    if ('string' == typeof msg) {
      ret.MsgType = 'text'
      ret.Content = msg
    } else if (Array.isArray(msg)) {
      ret.MsgType = 'news'
      ret.Articles = msg
    } else {
      Object.assign(ret, msg)
    }

    //Fix article count
    if (ret.Articles && !ret.ArticleCount) {
      ret.ArticleCount = ret.Articles.length
    }
    if (!ret.FromUserName) ret.FromUserName = receiveMessage.ToUserName
    if (!ret.ToUserName) ret.ToUserName = receiveMessage.FromUserName
    if (!ret.CreateTime) ret.CreateTime = parseInt(Date.now() / 1000)
    if (ret.type) {
      //Alias type
      ret.MsgType = ret.type
      delete ret.type
    }
    return ret
  },

  stringifyData(data) {
    return js2xml(
      { xml: cdata(data) },
      {
        compact: true,
        spaces: 2
      }
    )
  },

  simplify: simplify,
  cdata: cdata
})

function parseXML(xml) {
  try {
    return xml2js(xml, { compact: true, trim: true })
  } catch (e) {
    return
  }
}

function cdata(obj, key) {
  if (Array.isArray(obj)) {
    let ret = obj.map(res => cdata(res))
    if (key == 'item') {
      return ret
    }
    //Array to item
    return { item: ret }
  } else if (typeof obj == 'object' && obj !== null) {
    let keys = Object.keys(obj)
    if (keys.length == 1 && ['_cdata', '_text'].indexOf(keys[0]) != -1) {
      return obj
    }
    return keys.reduce((ret, key) => {
      ret[key] = cdata(obj[key], key)
      return ret
    }, {})
  } else if (typeof obj == 'string') {
    return { _cdata: obj }
  } else if (typeof obj == 'number') {
    return { _text: obj }
  }
  return obj
}

function simplify(obj) {
  if (Array.isArray(obj)) {
    // xml2js value
    if (obj.length == 1 && (obj[0] == null || typeof obj[0] != 'object')) {
      return obj[0]
    }
    return obj.map(res => simplify(res))
  } else if (typeof obj == 'object' && obj !== null) {
    let keys = Object.keys(obj)
    if (keys.length == 1 && ['_cdata', '_text'].indexOf(keys[0]) != -1) {
      //xml-js value
      return obj[keys[0]]
    }
    return keys.reduce((ret, key) => {
      if (key != '_parent') ret[key] = simplify(obj[key])
      return ret
    }, {})
  } else {
    return obj
  }
}
