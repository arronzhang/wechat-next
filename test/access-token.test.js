const AccessToken = require('../lib/access-token')

test('create valid access token', done => {
  const now = Date.now()
  const token = new AccessToken({
    access_token: 'abc',
    expires_in: 2,
    created_at: now
  })
  expect(token.data).toEqual({
    access_token: 'abc',
    expires_in: 2,
    created_at: now
  })
  expect(token.accessToken).toBe('abc')
  expect(token.createdAt).toBe(now)
  expect(token.expiresIn).toBe(2)
  expect(token.isExpired()).toBeFalsy()
  setTimeout(() => {
    expect(token.isExpired()).toBeTruthy()
    done()
  }, 3000)
})
