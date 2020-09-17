const { BaseRequest } = require('./base')
const util = require('./util')
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const https = require('https')
const { md5 } = require('./crypto')

class WechatPayment extends BaseRequest {
  /**
   * Wechat payment
   *
   * @param {Object} params
   * 	- mch_id
   * 	- appid
   *
   * @param {Object} config
   *  - pfx
   *  - passphrase
   *  - apiKey
   *
   */
  constructor(params, config) {
    config = { ...config }
    if (!config.apiKey) throw new Error('config.apiKey required')
    config.request = { timeout: 5 * 1000, method: 'post', ...config.request }
    if (config.pfx)
      config.request.httpsAgent = new https.Agent({
        pfx: config.pfx,
        passphrase: config.passphrase,
      })
    super(params, config, 'https://api.mch.weixin.qq.com/' + (config.sandbox ? 'sandboxnew/' : ''))
  }

  nonce(length = 32) {
    const maxPos = CHARS.length
    let nonceStr = ''
    for (var i = 0; i < length; i++) {
      nonceStr += CHARS.charAt(Math.floor(Math.random() * maxPos))
    }
    return nonceStr
  }

  /**
   * post data api
   * post and parse xml data
   * create nonce str
   * sign data
   *
   * @api public
   * @param {String} path
   * @param {Object} config
   *
   */
  post(path, data, config) {
    config = Object.assign({}, config)
    config.params = Object.assign({}, config.params)
    config.headers = Object.assign({}, config.headers)

    data = { ...this.$params, ...data }
    data.nonce_str = data.nonce_str || this.nonce()
    data.sign = this.sign(data)
    config.data = util.stringifyXML({ xml: data })

    // apiKey
    return this.$req.request(path, config).then((res) => {
      return util.transformXMLResponse(res.data, res.headers)
    })
  }

  sign(params) {
    const qs =
      Object.keys(params)
        //.filter((key) => key && params[key] && !['sign'].includes(key))
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&') +
      '&key=' +
      this.$config.apiKey
    return md5(qs).toUpperCase()
  }
}

exports.WechatPayment = WechatPayment
