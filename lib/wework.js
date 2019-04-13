const querystring = require('querystring')
const axios = require('axios')
const AccessToken = require('./access-token')

class Wework {
  constructor(params = {}) {
    this.$params = params
    this.$req = axios.create({
      baseURL: 'https://qyapi.weixin.qq.com/cgi-bin/',
      timeout: 1000 * 10
    })
  }

  get accessToken() {
    return this.$accessToken
  }

  set accessToken(token) {
    if (!(token instanceof AccessToken)) token = new AccessToken(token)
    return (this.$accessToken = token)
  }

  /**
   * Request wework api
   * It will automatic add access token to params and handle wework result error.
   *
   * @api public
   * @param {String} path
   * @param {Object} config
   *
   */
  request(path, config = {}) {
    config.params = Object.assign({}, config.params)
    if (!config.params.access_token && this.accessToken)
      config.params.access_token = this.accessToken.accessToken
    return this.$req
      .request(path, config)
      .then(res => res.data)
      .then(data => {
        if (!data) throw new Error('Wework api response empty')

        if (data.errcode) {
          const err = new Error(data.errmsg)
          err.name = 'WeworkError'
          err.code = data.errcode
          throw err
        }

        return data
      })
  }

  get(path, params) {
    return this.request(path, { params })
  }

  post(path, data) {
    return this.request(path, { data })
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
        if (!params[attr]) throw new Error('param `' + attr + '` required')
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
   *
   * @api public
   * @param {Object} params request params
   *
   */

  getAccessToken(params) {
    return this.get('gettoken', this.fillParams(params, ['corpid', 'corpsecret'])).then(data => {
      this.accessToken = new AccessToken({
        expires_in: data.expires_in,
        access_token: data.access_token,
        created_at: Date.now()
      })
      return this.accessToken
    })
  }

  getUserInfo(params) {
    return this.get('user/getuserinfo', this.fillParams(params, ['code']))
  }
}

module.exports = Wework
