exports.AccessToken = require('./lib/access-token').AccessToken
exports.BaseApi = require('./lib/base').BaseApi
exports.WxWork = require('./lib/wx-work').WxWork
exports.WxWorkProvider = require('./lib/wx-work-provider').WxWorkProvider
exports.WxWorkSuite = require('./lib/wx-work-suite').WxWorkSuite
exports.Receiver = require('./lib/receiver').Receiver
exports.Wechat = require('./lib/wechat').Wechat
exports.WechatOauth = require('./lib/wechat-oauth').WechatOauth
Object.assign(exports, require('./lib/error'))
