const querystring = require('querystring')
const Base = require('./base')

class Wework extends Base {
  /**
   * Wework api
   *
   * @param {Object} params
   * 	- corpid
   * 	- corpsecret
   * 	- agentid
   *
   */
  constructor(params = {}, config = {}) {
    super(params, config, 'https://qyapi.weixin.qq.com/cgi-bin/')
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
      this.accessToken = {
        expires_in: data.expires_in,
        access_token: data.access_token,
        created_at: Date.now()
      }
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
}

Wework.shortcuts = require('./wework.shortcut')

module.exports = Wework
