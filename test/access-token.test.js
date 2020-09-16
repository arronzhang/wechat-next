const AccessToken = require('../lib/access-token')

test('create valid access token', (done) => {
  let token1 = new AccessToken()
  expect(token1.isExpired()).toBeTruthy()

  expect(token1.createdAt).toBeDefined()
  const now = Date.now()
  let token = new AccessToken({
    access_token: 'abc',
    expires_in: 1,
    created_at: now,
  })
  expect(token.data).toEqual({
    access_token: 'abc',
    expires_in: 1,
    created_at: now,
  })
  expect(token.accessToken).toBe('abc')
  expect(token.createdAt).toBe(now)
  expect(token.expiresIn).toBe(1)
  expect(token.isExpired()).toBeFalsy()
  setTimeout(() => {
    expect(token.isExpired()).toBeTruthy()
    done()
  }, 1200)
})
