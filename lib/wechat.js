const { BaseApi } = require('./base')

class Wechat extends BaseApi {
  /**
   * Wechat api
   *
   * @param {Object} params
   * 	- appid
   * 	- secret
   *
   */
  constructor(params, config) {
    super(params, config, 'https://api.weixin.qq.com/')
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
    params = Object.assign(
      { grant_type: 'client_credential' },
      this.composeParams(['!appid', '!secret', 'grant_type'], params)
    )
    return this.request('cgi-bin/token', { params }).then((data) => {
      // access_token, expires_in
      this.accessToken = Object.assign(
        {
          created_at: Date.now(),
        },
        data
      )
      return this.accessToken
    })
  }
}

Wechat.defines(require('./wechat.shortcut'))

exports.Wechat = Wechat
