const { WechatPayment } = require('../')
const mchId = process.env.WECHAT_PAYMENT_MCH_ID || '1501176891'
const apiKey = process.env.WECHAT_PAYMENT_API_KEY || ''
if (!apiKey) {
  console.log('Need process.env.WECHAT_PAYMENT_API_KEY for test')
}

describe('wechat payment', () => {
  test('post test', async () => {
    if (apiKey) {
      const api = new WechatPayment(
        {
          mch_id: mchId,
        },
        { apiKey, sandbox: true }
      )
      const res = await api.post('pay/getsignkey')
      api.$config.apiKey = res.sandbox_signkey
      expect(res.sandbox_signkey).toBeDefined()
    }
  })
})
