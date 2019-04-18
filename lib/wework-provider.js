const querystring = require('querystring')
const Base = require('./base')

class WeworkProvider extends Base {
  /**
   * Wework provider api
   *
   * @param {Object} params
   * 	- corpid
   * 	- provider_secret
   */
  constructor(params, config) {
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

  getAccessToken(...data) {
    data = this.composeParams(['!corpid', '!provider_secret'], data)
    return this.request('service/get_provider_token', { method: 'post', data }).then(data => {
      this.accessToken = {
        expires_in: data.expires_in,
        access_token: data.provider_access_token,
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
        state: this.$params.state || 'state',
        usertype: this.$params.usertype || 'admin'
      },
      params
    )

    delete params.corpid

    return (
      'https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect' +
      '?' +
      querystring.stringify(params)
    )
  }

  getUserInfo(...data) {
    data = this.composeParams(['!auth_code'], data)
    return this.post('service/get_login_info', {}, data)
  }
}

module.exports = WeworkProvider
