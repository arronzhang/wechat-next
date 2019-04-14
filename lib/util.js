const fs = require('fs')
const stream = require('stream')
const FormData = require('form-data')

exports.mediaFormData = function mediaFormData(data, headers = {}) {
  // Support multipart/form-data for media upload
  const key = 'media'
  const file = data && data[key]
  if (file) {
    const form = new FormData()
    Object.keys(data || {}).forEach(name => {
      if (name != key) form.append(name, data[name])
    })
    form.append(key, file instanceof stream.Readable ? file : fs.createReadStream(file))
    Object.assign(headers, form.getHeaders())
    return form
  }
  return data
}

exports.apiResponseError = function apiResponseError(data) {
  if (!data) throw new Error('Wework api response empty')
  if (data.errcode) {
    // https://qydev.weixin.qq.com/wiki/index.php?title=%E5%85%A8%E5%B1%80%E8%BF%94%E5%9B%9E%E7%A0%81%E8%AF%B4%E6%98%8E
    const err = new Error(data.errmsg)
    err.name = 'WeworkError'
    err.expose = true
    err.code = data.errcode
    throw err
  }
  return data
}
