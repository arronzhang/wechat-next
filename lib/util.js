const fs = require('fs')
const FormData = require('form-data')
const { ResponseError, ValidateError } = require('./error')
const JSONbig = require('json-bigint')
const toString = Object.prototype.toString
const { js2xml, xml2js } = require('xml-js')
const url = require('url')

const util = (module.exports = {
  /**
   * Determine if a value is an Object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Object, otherwise false
   */
  isObject(val) {
    return val !== null && typeof val === 'object'
  },

  /**
   * Determine if a value is a Function
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  isFunction(val) {
    return toString.call(val) === '[object Function]'
  },

  /**
   * Determine if a value is a Stream
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  isStream(val) {
    return util.isObject(val) && util.isFunction(val.pipe)
  },

  /**
   * axios transform request method for media upload
   *
   */
  mediaFormData(data, headers = {}) {
    // Support multipart/form-data for media upload
    const key = 'media'
    const file = data && data[key]
    if (file) {
      const form = new FormData()
      Object.keys(data).forEach(name => {
        if (name != key) form.append(name, data[name])
      })
      return new Promise(function(resolve, reject) {
        form.append(key, util.isStream(file) ? file : fs.createReadStream(file))
        form.getLength(function(err, length) {
          if (err) return reject(err)
          resolve(length)
        })
      }).then(length => {
        Object.assign(headers, form.getHeaders({ 'content-length': length }))
        return form
      })
    }
    return Promise.resolve(data)
  },

  /**
   * Determine if a value is a param value
   *
   */
  isParamValue(val) {
    return util.isStream(val) || !util.isObject(val)
  },

  /**
   * Transform api response
   * Throw ResponseError
   *
   */
  transformResponse(data, headers) {
    headers = headers || {}
    if (!data) throw new ResponseError('api response empty', -1)
    if (headers['error-code'] && headers['error-code'] != '0') {
      //Error in headers: 'error-code': '0', 'error-msg': 'ok'
      const err = new ResponseError(headers['error-msg'], +headers['error-code'])
      throw err
    }

    // json parse
    if (/application\/json/i.test(headers['content-type'])) {
      //Transform buffer
      data = data instanceof Buffer ? data.toString('utf8') : data
      if (typeof data === 'string') {
        try {
          data = JSONbig.parse(data)
        } catch (err) {
          //Throw json error
          let e = new ResponseError(err.message, -2)
          e.data = data
          throw e
        }
      }
    }
    // Handle text
    if (/text\/plain/i.test(headers['content-type'])) {
      //Transform buffer
      data = data instanceof Buffer ? data.toString('utf8') : data
      if (typeof data === 'string') {
        // many api response content type `text/plain`
        // try json parse
        // Ex: https://api.weixin.qq.com/sns/jscode2session
        try {
          data = JSONbig.parse(data)
        } catch (err) {
          //Don't throw json error
        }
      }
    }

    if (data && data.errcode) {
      // https://qydev.weixin.qq.com/wiki/index.php?title=%E5%85%A8%E5%B1%80%E8%BF%94%E5%9B%9E%E7%A0%81%E8%AF%B4%E6%98%8E
      const err = new ResponseError(data.errmsg, data.errcode)
      throw err
    }
    return data
  },

  /**
   * Helper for compose params from defaults and valid required attributes
   * The paramList array will split by attr used
   * Returned params will be cleaned by attrs except key contains `access_token`
   *
   * @param {Object} defaults
   * @param {Array} attrs
   * @param {Array} paramList
   * @return {Object}
   * @api public
   *
   */

  composeParams(defaults, attrs, paramList) {
    if (!Array.isArray(paramList)) {
      throw new Error('`paramList` must be an array')
    }

    let required = []
    attrs =
      attrs &&
      attrs.map(k => {
        if (k.startsWith('!')) {
          k = k.substr(1)
          required.push(k)
        }
        return k
      })

    let first = paramList[0]
    if (util.isParamValue(first)) {
      if (attrs) {
        // Need expand params
        first = attrs.reduce((ret, key) => {
          let val = paramList.shift()
          if (val !== undefined && val !== null) ret[key] = val
          return ret
        }, {})
      }
    } else {
      paramList.shift()
    }

    let params = Object.assign({}, defaults, first)
    required &&
      required.forEach(attr => {
        if (!params[attr]) throw new ValidateError('missing param `' + attr + '`', attr)
      })
    if (attrs) {
      // Clean not define in attrs
      Object.keys(params).forEach(key => {
        if (attrs.indexOf(key) == -1 && key.indexOf('access_token') == -1) {
          delete params[key]
        }
      })
    }
    return params
  },

  /**
   * Stringify xml
   *
   */
  stringifyXML(data) {
    return js2xml(buildXML(data), {
      compact: true,
      spaces: 2
    })
  },

  /**
   * Parse xml
   *
   */
  parseXML(xml) {
    try {
      return xml2js(xml, { compact: true, trim: true })
    } catch (e) {
      return
    }
  },

  simplifyXML: simplify,
  buildXML: buildXML,

  /**
   * parse axios proxy config from url string
   *
   */
  parseProxyURL(str) {
    if (typeof str == 'string') {
      let parsed = url.parse(str)
      let auth = parsed.auth && parsed.auth.split(':')
      let conf = {
        protocol: parsed.protocol,
        host: parsed.hostname,
        port: parsed.port
      }
      if (auth) conf.auth = { username: auth[0], password: auth[1] }
      return conf
    }
    return str
  }
})

function buildXML(obj, key) {
  if (Array.isArray(obj)) {
    let ret = obj.map(res => buildXML(res))
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
      ret[key] = buildXML(obj[key], key)
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
