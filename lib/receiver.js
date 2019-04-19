const crypto = require('./crypto')
const { js2xml, xml2js } = require('xml-js')

const Receiver = (module.exports = {
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
    let args = [config.token, config.aes_key, query]
    if ('POST' === method) args.push(xml)
    const msg = Receiver.parse(...args)
    let body = ''
    let status = 200
    if (false === msg) {
      status = 401
      body = 'Invalid signature'
    } else if ('GET' === method) {
      body = msg.message
    } else if ('POST' === method) {
      return Promise.resolve(handler(msg.message)).then(data => {
        return {
          status: 200,
          type: 'application/xml',
          body: Receiver.stringify(config.token, config.aes_key, config.id, query, data)
        }
      })
    } else {
      status = 501
      body = 'Not Implemented'
    }
    return Promise.resolve({ body, status })
  },

  /**
   * Parse receive data
   * Validate message signature and return `false` when invalid
   *
   * @param {String} token
   * @param {String} aesKey
   * @param {Object} query
   * 	- msg_signature
   * 	- signature
   * 	- timestamp
   * 	- nonce
   * 	- echostr
   * @param {Object} body provide only by post data
   * @return {Object}
   * 	- message
   * 	- id
   */

  parse(token, aesKey, query, data) {
    let isPost = arguments.length > 3
    if (isPost) {
      if (!data) return false
      //Post
      if (typeof data === 'string') data = parseXML(data)
      data = simplify(data)
      data = data && data.xml
      if (!data) return false
    }
    const check = [token, query.timestamp, query.nonce]
    const encrypted = !!query.msg_signature
    const signature = query.msg_signature || query.signature

    //post sign Encrypt
    if (encrypted) check.push(isPost ? data.Encrypt : query.echostr)

    if (signature === crypto.shasum(...check)) {
      if (encrypted) {
        if (isPost) {
          let ret = crypto.decrypt(aesKey, data)
          if (!ret.message) return false
          data = simplify(parseXML(ret.message))
          data = data && data.xml
          if (!data) return false
          return { message: data, id: ret.id }
        } else {
          return crypto.decrypt(aesKey, query.echostr)
        }
      }
      return isPost ? { message: data } : { message: query.echostr }
    }
    return false
  },

  stringify(token, aesKey, id, query, data) {
    //const encrypted = !!query.msg_signature
    if (data) {
      return ''
    }
    return ''
  },

  stringifyData(data) {
    return js2xml(
      { xml: data },
      {
        compact: true,
        spaces: 2
      }
    )
  }
})

function parseXML(xml) {
  try {
    return xml2js(xml, { compact: true, trim: true })
  } catch (e) {
    return
  }
}

function simplify(result) {
  if (Array.isArray(result)) {
    // xml2js value
    if (result.length == 1 && (result[0] == null || typeof result[0] != 'object')) {
      return result[0]
    }
    return result.map(res => simplify(res))
  } else if (typeof result == 'object' && result !== null) {
    let keys = Object.keys(result)
    if (keys.length == 1 && ['_cdata', '_text'].indexOf(keys[0]) != -1) {
      //xml-js value
      return result[keys[0]]
    }
    return keys.reduce((obj, key) => {
      obj[key] = simplify(result[key])
      return obj
    }, {})
  } else {
    return result
  }
}
