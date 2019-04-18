const fs = require('fs')
const FormData = require('form-data')
const ApiError = require('./error')
const toString = Object.prototype.toString

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
   * axios transform method for handle api response error
   *
   */
  apiResponseError(data, headers = {}) {
    if (!data) throw new ApiError.ResponseError('Wework api response empty')
    if (headers['error-code'] && headers['error-code'] != '0') {
      //Error in headers: 'error-code': '0', 'error-msg': 'ok'
      const err = new ApiError.ResponseError(headers['error-msg'], +headers['error-code'])
      throw err
    }

    if (data instanceof Buffer && /application\/json/i.test(headers['content-type'])) {
      //Check error in media
      try {
        data = JSON.parse(data.toString('utf8'))
      } catch (e) {
        // Ignore
      }
    }

    if (data.errcode) {
      // https://qydev.weixin.qq.com/wiki/index.php?title=%E5%85%A8%E5%B1%80%E8%BF%94%E5%9B%9E%E7%A0%81%E8%AF%B4%E6%98%8E
      const err = new ApiError.ResponseError(data.errmsg, data.errcode)
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
        if (!params[attr]) throw new ApiError.ValidateError('missing param `' + attr + '`', attr)
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
  }
})
