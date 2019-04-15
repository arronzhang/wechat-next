const fs = require('fs')
const stream = require('stream')
const FormData = require('form-data')
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
      Object.keys(data || {}).forEach(name => {
        if (name != key) form.append(name, data[name])
      })
      form.append(key, file instanceof stream.Readable ? file : fs.createReadStream(file))
      Object.assign(headers, form.getHeaders())
      return form
    }
    return data
  },

  /**
   * axios transform method for handle api response error
   *
   */
  apiResponseError(data) {
    if (!data) throw new Error('Wework api response empty')
    if (data.errcode) {
      // https://qydev.weixin.qq.com/wiki/index.php?title=%E5%85%A8%E5%B1%80%E8%BF%94%E5%9B%9E%E7%A0%81%E8%AF%B4%E6%98%8E
      const err = new Error(data.errmsg)
      err.name = 'WeworkError'
      err.expose = true
      err.code = data.errcode
      throw err
    }
    return data
  },

  /**
   * Helper for compose params from defaults and valid required attributes
   *
   * @param {Object} defaults
   * @param {Array} requiredAttrs
   * @param {Array} optionalAttrs
   * @param {Object} ...params
   * @return {Object} params
   * @api public
   *
   */

  composeParams(defaults, requiredAttrs, optionalAttrs, ...params) {
    let obj = params[0]
    let attrs = Array.isArray(optionalAttrs)
      ? (requiredAttrs || []).concat(optionalAttrs)
      : requiredAttrs
    if (params.length && attrs && (util.isStream(obj) || !util.isObject(obj))) {
      // Need expand params
      obj = attrs.reduce((ret, val, i) => {
        if (params[i] !== undefined && params[i] !== null) ret[val] = params[i]
        return ret
      }, {})
    }
    params = Object.assign({}, defaults, obj)
    requiredAttrs &&
      requiredAttrs.forEach(attr => {
        if (!params[attr]) throw new Error('missing param `' + attr + '`')
      })
    if (attrs) {
      // Clean not define in attrs
      attrs = attrs.concat(['access_token'])
      Object.keys(params).forEach(key => {
        if (attrs.indexOf(key) == -1) {
          delete params[key]
        }
      })
    }
    return params
  }
})
