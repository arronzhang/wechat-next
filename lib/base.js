const axios = require('axios')
const util = require('./util')
const { AccessToken } = require('./access-token')

class BaseRequest {
  constructor(params = {}, config = {}, baseURL) {
    this.$params = params
    this.$config = config
    let conf = Object.assign(
      {
        baseURL: baseURL,
        timeout: 1000 * 30,
        responseType: 'arraybuffer',
        method: 'get',
      },
      config.request
    )
    // Support urlstring for proxy
    if (conf.proxy) conf.proxy = util.parseProxyURL(conf.proxy)
    this.$req = axios.create(conf)
  }

  /**
   * Define shortcut method for access api
   *
   * @param {String} name
   * @param {String} method get|post
   * @param {String} path
   * @param {Array}  paramAttrs
   * @param {Array}  dataAttrs
   *
   */
  static define(name, method, path, paramAttrs, dataAttrs) {
    if ('post' == method) {
      this.prototype[name] = function (...params) {
        //pop data
        let data = !util.isParamValue(params[params.length - 1]) ? params.pop() : undefined
        let p = this.composeParams(paramAttrs, params)
        data = data || (dataAttrs && this.composeParams(dataAttrs, params))
        return this[method](path, p, data)
      }
    } else {
      this.prototype[name] = function (...params) {
        return this[method](path, this.composeParams(paramAttrs, params))
      }
    }
  }

  /**
   * Define shortcuts method for access api
   * @param {Array} shortcuts
   */
  static defines(shortcuts) {
    Object.keys(shortcuts).forEach((key) => {
      this.define(...[key].concat(shortcuts[key]))
    })
  }

  /**
   * Helper for compose params from defaults and valid param attributes
   *
   * @param {Array} attrs
   * @param {Array} params
   * @return {Object} params
   * @api public
   *
   */

  composeParams(attrs, params) {
    return util.composeParams(this.$params, attrs, params)
  }
}

class BaseApi extends BaseRequest {
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
    super(params, config, baseURL)
    this.$tokenKey = tokenKey || 'access_token'
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
   * Request api
   * It will automatic add access token to params and handle wx error message.
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

    return util.mediaFormData(config.data, config.headers).then((data) => {
      config.data = data
      return this.$req.request(path, config).then((res) => {
        return util.transformResponse(res.data, res.headers)
      })
    })
  }

  /**
   * Get the access token and then request.
   * Repeat once when token expired.
   * Call the `getAccessToken(defaultParams)` and `saveAccessToken(tokenData, defaultParams)` api if has set by `new Api({getAccessToken, saveAccessToken})`.
   *
   */

  authorizeRequest(path, config = {}, tokenExpired) {
    // Access token in params
    if (config.params && config.params[this.$tokenKey]) return this.request(path, config)

    let token = null
    if (!tokenExpired) {
      token = this.$config.getAccessToken
        ? this.$config.getAccessToken(this.$params)
        : this.accessToken
    }

    return Promise.resolve(token).then((token) => {
      if (token) {
        this.accessToken = token
        return this.request(path, config).catch((err) => {
          // https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Global_Return_Code.html
          if (!tokenExpired && [42001, 40014, 40001, 40002].indexOf(err.code) != -1) {
            return this.authorizeRequest(path, config, true)
          }
          throw err
        })
      } else {
        return this.getAccessToken(config.params)
          .then((token) => {
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

exports.BaseRequest = BaseRequest
exports.BaseApi = BaseApi
