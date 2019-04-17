const querystring = require('querystring')
const axios = require('axios')
const AccessToken = require('./access-token')
const util = require('./util')

class Wework {
  constructor(params = {}, requestConfig = {}) {
    let cls = this.constructor
    if (cls.shortcuts && cls.define && !cls.__initShortcuts) {
      //Define shortcut method
      cls.__initShortcuts = true
      Object.keys(cls.shortcuts).forEach(key => {
        cls.define(...[key].concat(cls.shortcuts[key]))
      })
    }

    this.$params = params
    this.$req = axios.create(
      Object.assign(
        {
          baseURL: 'https://qyapi.weixin.qq.com/cgi-bin/',
          timeout: 1000 * 30,
          responseType: 'json',
          method: 'get'
        },
        requestConfig
      )
    )
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
    if (!config.params.access_token && this.accessToken)
      config.params.access_token = this.accessToken.accessToken

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
    if (config.params && config.params.access_token) return this.request(path, config)

    let token = null
    if (!tokenExpired) {
      token = this.accessToken
      if (!token) token = this.$params.getAccessToken && this.$params.getAccessToken(this.$params)
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
              this.$params.saveAccessToken && this.$params.saveAccessToken(token.data, this.$params)
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

  getAccessToken(...params) {
    params = this.composeParams(['corpid', 'corpsecret'], null, ...params)
    return this.request('gettoken', { params }).then(data => {
      this.accessToken = new AccessToken({
        expires_in: data.expires_in,
        access_token: data.access_token,
        created_at: Date.now()
      })
      return this.accessToken
    })
  }

  /**
   * Get autherize url.
   */
  getAuthorizeURL(params = {}) {
    params = Object.assign(
      {
        appid: params.corpid || this.$params.corpid || this.$params.appid,
        redirect_uri: this.$params.redirect_uri || '',
        response_type: this.$params.response_type || 'code',
        scope: this.$params.scope || 'snsapi_base',
        state: this.$params.state || 'state'
      },
      params
    )

    delete params.corpid

    return (
      'https://open.weixin.qq.com/connect/oauth2/authorize' +
      '?' +
      querystring.stringify(params) +
      '#wechat_redirect'
    )
  }

  /**
   * Get web qr scan autherize url.
   */
  getQRAuthorizeURL(params = {}) {
    params = Object.assign(
      {
        appid: params.corpid || this.$params.corpid || this.$params.appid,
        agentid: this.$params.agentid,
        redirect_uri: this.$params.redirect_uri || '',
        response_type: this.$params.response_type || 'code',
        scope: this.$params.scope || 'snsapi_base',
        state: this.$params.state || 'state'
      },
      params
    )

    delete params.corpid

    return (
      'https://open.work.weixin.qq.com/wwopen/sso/qrConnect' + '?' + querystring.stringify(params)
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
}

Wework.shortcuts = require('./wework.shortcut')

module.exports = Wework
