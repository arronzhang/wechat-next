const Base = require('./base')

class Wechat extends Base {
  /**
   * Wechat api
   *
   * @param {Object} params
   * 	- appid
   * 	- secret
   *
   */
  constructor(params = {}, config = {}) {
    super(params, config, 'https://api.weixin.qq.com/cgi-bin/')
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
    params = this.composeParams(['!appid', '!secret', 'grant_type'], params)
    if (!params.grant_type) params.grant_type = 'client_credential'
    return this.request('token', { params }).then(data => {
      // access_token, expires_in
      this.accessToken = Object.assign(
        {
          created_at: Date.now()
        },
        data
      )
      return this.accessToken
    })
  }
}

Wechat.shortcuts = require('./wechat.shortcut')

module.exports = Wechat