const querystring = require('querystring')
const Base = require('./base')

class WxWork extends Base {
  /**
   * WxWork api
   *
   * @param {Object} params
   * 	- corpid
   * 	- corpsecret
   * 	- agentid
   *
   */
  constructor(params = {}, config = {}) {
    super(params, config, 'https://qyapi.weixin.qq.com/')
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
    params = this.composeParams(['!corpid', '!corpsecret'], params)
    return this.request('cgi-bin/gettoken', { params }).then(data => {
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
  getAuthorizeURL(params) {
    params = Object.assign(
      {
        appid: (params && params.corpid) || this.$params.corpid,
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
  getQRAuthorizeURL(params) {
    params = Object.assign(
      {
        appid: (params && params.corpid) || this.$params.corpid,
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

WxWork.shortcuts = require('./wx-work.shortcut')

module.exports = WxWork
