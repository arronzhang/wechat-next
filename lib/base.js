const axios = require('axios')
const util = require('./util')
const AccessToken = require('./access-token')

class Base {
  /**
   * Base
   *
   * @param {Object} params
   * @param {Object} config
   * 	- {Function} saveAccessToken
   * 	- {Function} getAccessToken
   * 	- {Object} request
   *
   *
   */
  constructor(params = {}, config = {}, baseURL, tokenKey) {
    let cls = this.constructor
    if (cls.shortcuts && cls.define && !cls.__initShortcuts) {
      //Define shortcut method
      cls.__initShortcuts = true
      Object.keys(cls.shortcuts).forEach(key => {
        cls.define(...[key].concat(cls.shortcuts[key]))
      })
    }

    this.$params = params
    this.$config = config
    this.$tokenKey = tokenKey || 'access_token'
    this.$req = axios.create(
      Object.assign(
        {
          baseURL: baseURL,
          timeout: 1000 * 30,
          responseType: 'json',
          method: 'get'
        },
        config.request
      )
    )
  }

  /**
   * Define shortcut method for access api
   *
   * @param {String} name
   * @param {String} method get|post
   * @param {String} path
   * @param {Array} requiredAttrs
   * @param {Array} optionalAttrs
   *
   */
  static define(name, method, path, requiredAttrs, optionalAttrs) {
    if ('post' == method) {
      this.prototype[name] = function(...params) {
        let data = !util.isParamValue(params[params.length - 1]) ? params.pop() : undefined
        return this[method](path, this.composeParams(requiredAttrs, optionalAttrs, ...params), data)
      }
    } else {
      this.prototype[name] = function(...params) {
        return this[method](path, this.composeParams(requiredAttrs, optionalAttrs, ...params))
      }
    }
  }

  /**
   * Get instance accessToken object.
   *
   * @api public
   * @return {AccessToken}
   *
   */

  get accessToken() {
    return this.$accessToken
  }

  /**
   * Set instance accessToken object.
   *
   * @api public
   * @param {AccessToken|Object} accessToken
   *
   */

  set accessToken(accessToken) {
    if (!(accessToken instanceof AccessToken)) accessToken = new AccessToken(accessToken)
    this.$accessToken = accessToken
  }

  /**
   * Request wework api
   * It will automatic add access token to params and throw wework error message.
   *
   * @api public
   * @param {String} path
   * @param {Object} config
   *
   */
  request(path, config) {
    config = Object.assign({}, config)
    config.params = Object.assign({}, config.params)
    config.headers = Object.assign({}, config.headers)

    // Add access token
    if (!config.params[this.$tokenKey] && this.accessToken)
      config.params[this.$tokenKey] = this.accessToken.accessToken

    // Response buffer if media_id in params
    if (config.params.media_id && !config.responseType) config.responseType = 'arraybuffer'

    return util.mediaFormData(config.data, config.headers).then(data => {
      config.data = data
      return this.$req.request(path, config).then(res => {
        return util.apiResponseError(res.data, res.headers)
      })
    })
  }

  /**
   * Get the access token and then request.
   * Repeat once when token expired.
   * Call the `getAccessToken(defaultParams)` and `saveAccessToken(tokenData, defaultParams)` api if has set by `new Wework({getAccessToken, saveAccessToken})`.
   *
   */

  authorizeRequest(path, config = {}, tokenExpired) {
    // Access token in params
    if (config.params && config.params[this.$tokenKey]) return this.request(path, config)

    let token = null
    if (!tokenExpired) {
      token = this.accessToken
      if (!token) token = this.$config.getAccessToken && this.$config.getAccessToken(this.$params)
    }

    return Promise.resolve(token).then(token => {
      if (token) {
        this.accessToken = token
        return this.request(path, config).catch(err => {
          if (!tokenExpired && (42001 === err.code || 40014 === err.code)) {
            return this.authorizeRequest(path, config, true)
          }
          throw err
        })
      } else {
        return this.getAccessToken(config.params)
          .then(token => {
            // Call save token method
            return Promise.resolve(
              this.$config.saveAccessToken && this.$config.saveAccessToken(token.data, this.$params)
            )
          })
          .then(() => this.request(path, config))
      }
    })
  }

  get(path, params, config) {
    return this.authorizeRequest(path, Object.assign({ method: 'get', params }, config))
  }

  post(path, params, data, config) {
    return this.authorizeRequest(path, Object.assign({ method: 'post', data, params }, config))
  }

  /**
   * Helper for compose params from defaults and valid param attributes
   *
   * @param {Array} requiredAttrs
   * @param {Array} optionalAttrs
   * @param {Object} ...params
   * @return {Object} params
   * @api public
   *
   */

  composeParams(requiredAttrs, optionalAttrs, ...params) {
    return util.composeParams(this.$params, requiredAttrs, optionalAttrs, ...params)
  }

  /**
   * Get access token.
   * Notice: It will not call `saveAccessToken` api.
   *
   * @api public
   * @param {Object} params request params
   *
   */

  getAccessToken() {
    throw new Error('getAccessToken must be provided')
  }
}

module.exports = Base
