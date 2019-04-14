const querystring = require('querystring')
const axios = require('axios')
const AccessToken = require('./access-token')

class Wework {
  constructor(params = {}) {
    this.$params = params
    this.$req = axios.create({
      baseURL: 'https://qyapi.weixin.qq.com/cgi-bin/',
      timeout: 1000 * 10,
      method: 'get'
    })
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
  request(path, config = {}) {
    // Don't change config property
    config = Object.assign({}, config)
    config.params = Object.assign({}, config.params)
    if (!config.params.access_token && this.accessToken)
      config.params.access_token = this.accessToken.accessToken

    return this.$req
      .request(path, config)
      .then(res => res.data)
      .then(data => {
        if (!data) throw new Error('Wework api response empty')

        if (data.errcode) {
          // https://qydev.weixin.qq.com/wiki/index.php?title=%E5%85%A8%E5%B1%80%E8%BF%94%E5%9B%9E%E7%A0%81%E8%AF%B4%E6%98%8E
          const err = new Error(data.errmsg)
          err.name = 'WeworkError'
          err.code = data.errcode
          throw err
        }

        return data
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
          if (!tokenExpired && 42001 === err.code) {
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

  get(path, params) {
    return this.authorizeRequest(path, { method: 'get', params })
  }

  post(path, data, params) {
    return this.authorizeRequest(path, { method: 'post', data, params })
  }

  /**
   * Helper for compose params from defaults and valid param attributes
   *
   * @param {Object} params
   * @param {Array} requiredAttrs
   * @param {Array} attrs only contains attr, default is requiredAttrs
   * @return {Object} params
   * @api public
   *
   */

  fillParams(params, requiredAttrs, attrs) {
    params = Object.assign({}, this.$params, params)
    requiredAttrs &&
      requiredAttrs.forEach(attr => {
        if (!params[attr]) throw new Error('missing param `' + attr + '`')
      })
    attrs = Array.isArray(attrs) ? attrs.concat(requiredAttrs) : requiredAttrs
    if (attrs) {
      attrs = attrs.concat(['access_token'])
      Object.keys(params).forEach(key => {
        if (attrs.indexOf(key) == -1) {
          delete params[key]
        }
      })
    }
    return params
  }

  /**
   * Get access token.
   * Notice: It will not call `saveAccessToken` api.
   *
   * @api public
   * @param {Object} params request params
   *
   */

  getAccessToken(params = {}) {
    params = this.fillParams(params, ['corpid', 'corpsecret'])
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
   * Get user info
   */
  getUserInfo(params = {}) {
    return this.get('user/getuserinfo', this.fillParams(params, ['code']))
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
}

module.exports = Wework
