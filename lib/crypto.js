const crypto = require('crypto')

/**
 * 提供基于PKCS7算法的加解密接口
 *
 */
const PKCS7Encoder = {
  /**
   * 删除解密后明文的补位字符
   *
   * @param {String} text 解密后的明文
   */
  decode(text) {
    let pad = text[text.length - 1]

    if (pad < 1 || pad > 32) {
      pad = 0
    }

    return text.slice(0, text.length - pad)
  },

  /**
   * 对需要加密的明文进行填充补位
   *
   * @param {String} text 需要进行填充补位操作的明文
   */
  encode(text) {
    let blockSize = 32
    let textLength = text.length
    //计算需要填充的位数
    let amountToPad = blockSize - (textLength % blockSize)

    let result = new Buffer.alloc(amountToPad)
    result.fill(amountToPad)

    return Buffer.concat([text, result])
  }
}

function parseKey(key) {
  if (!key) throw new Error('key required')

  key = Buffer.from(key + '=', 'base64')
  if (key.length !== 32) {
    throw new Error('invalid key')
  }
  return key
}

module.exports = {
  /**
   * Sha sum args
   */

  shasum(...args) {
    return crypto
      .createHash('sha1')
      .update(args.sort().join(''))
      .digest('hex')
  },

  /**
   * 对密文进行解密
   *
   * @param {String} key
   * @param {String} text 待解密的密文
   */
  decrypt(key, text) {
    key = parseKey(key)
    // 创建解密对象，AES采用CBC模式，数据采用PKCS#7填充；IV初始向量大小为16字节，取AESKey前16字节
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, key.slice(0, 16))
    decipher.setAutoPadding(false)
    let deciphered = Buffer.concat([decipher.update(text, 'base64'), decipher.final()])

    deciphered = PKCS7Encoder.decode(deciphered)
    // 算法：AES_Encrypt[random(16B) + msg_len(4B) + msg + $CorpID]
    // 去除16位随机数
    let content = deciphered.slice(16)
    let length = content.slice(0, 4).readUInt32BE(0)

    return {
      message: content.slice(4, length + 4).toString(),
      id: content.slice(length + 4).toString()
    }
  },

  /**
   * 对明文进行加密
   *
   * @param {String} key
   * @param {String} id
   * @param {String} text 待加密的明文
   */
  encrypt(key, id, text) {
    key = parseKey(key)
    // 算法：AES_Encrypt[random(16B) + msg_len(4B) + msg + $CorpID]
    // 获取16B的随机字符串
    let randomString = crypto.pseudoRandomBytes(16)

    let msg = Buffer.from(text)

    // 获取4B的内容长度的网络字节序
    let msgLength = Buffer.alloc(4)
    msgLength.writeUInt32BE(msg.length, 0)

    let bufMsg = Buffer.concat([randomString, msgLength, msg, Buffer.from(id)])

    // 对明文进行补位操作
    let encoded = PKCS7Encoder.encode(bufMsg)

    // 创建加密对象，AES采用CBC模式，数据采用PKCS#7填充；IV初始向量大小为16字节，取AESKey前16字节
    let cipher = crypto.createCipheriv('aes-256-cbc', key, key.slice(0, 16))
    cipher.setAutoPadding(false)

    let cipheredMsg = Buffer.concat([cipher.update(encoded), cipher.final()])

    // 返回加密数据的base64编码
    return cipheredMsg.toString('base64')
  }
}
