const querystring = require('querystring')
const Base = require('./base')

class WxWorkSuite extends Base {
  /**
   * WxWork suite api
   *
   * @param {Object} params
   * 	- suite_id
   * 	- suite_secret
   * 	- suite_ticket
   */
  constructor(params, config) {
    super(params, config, 'https://qyapi.weixin.qq.com/cgi-bin/', 'suite_access_token')
  }

  /**
   * Get access token.
   * Notice: It will not call `saveAccessToken` api.
   *
   * @api public
   * @param {Object} params request params
   *
   */

  getAccessToken(...data) {
    data = this.composeParams(['!suite_ticket', '!suite_id', '!suite_secret'], data)
    return this.request('service/get_suite_token', { method: 'post', data }).then(data => {
      this.accessToken = {
        expires_in: data.expires_in,
        access_token: data.suite_access_token,
        created_at: Date.now()
      }
      return this.accessToken
    })
  }

  /**
   * Get install app url.
   */
  getInstallURL(params) {
    params = Object.assign(
      {
        suite_id: this.$params.suite_id,
        pre_auth_code: this.$params.pre_auth_code || '',
        redirect_uri: this.$params.redirect_uri || '',
        state: this.$params.state || 'state'
      },
      params
    )
    return 'https://open.work.weixin.qq.com/3rdapp/install' + '?' + querystring.stringify(params)
  }

  /**
   * Get autherize url.
   */
  getAuthorizeURL(params) {
    params = Object.assign(
      {
        appid: (params && params.suite_id) || this.$params.suite_id,
        redirect_uri: this.$params.redirect_uri || '',
        response_type: this.$params.response_type || 'code',
        scope: this.$params.scope || 'snsapi_userinfo',
        state: this.$params.state || 'state'
      },
      params
    )

    delete params.suite_id

    return (
      'https://open.weixin.qq.com/connect/oauth2/authorize' +
      '?' +
      querystring.stringify(params) +
      '#wechat_redirect'
    )
  }
}

module.exports = WxWorkSuite
