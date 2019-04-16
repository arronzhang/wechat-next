const util = require('../lib/util')
const stream = require('stream')
const FormData = require('form-data')

it('is object', () => {
  expect(util.isObject({ a: 1 })).toBeTruthy()
  expect(util.isObject()).toBeFalsy()
  expect(util.isObject(null)).toBeFalsy()
  expect(util.isObject('abc')).toBeFalsy()
  expect(util.isObject(111)).toBeFalsy()
})

it('is stream', () => {
  expect(util.isStream({})).toBeFalsy()
  expect(util.isStream(new stream.Readable())).toBeTruthy()
})

it('media form data', () => {
  expect(util.mediaFormData({ a: 1 })).resolves.toEqual({ a: 1 })
  const headers = { custom: 'cc' }
  let data = util.mediaFormData({ a: 1, media: __dirname + '/media.txt' }, headers)
  expect(headers).toHaveProperty('custom', 'cc')
  data.then(() => {
    expect(headers).toHaveProperty('content-type')
    expect(headers).toHaveProperty('content-length')
  })
  expect(data).resolves.toBeInstanceOf(FormData)
  data = util.mediaFormData(
    { a: 1, media: require('fs').createReadStream(__dirname + '/media.txt') },
    headers
  )
  expect(data).resolves.toBeInstanceOf(FormData)
})

it('response error', () => {
  expect(() => util.apiResponseError('')).toThrow('empty')
  expect(() => util.apiResponseError({ errcode: 1, errmsg: 'invalid' })).toThrow('invalid')
  expect(util.apiResponseError({ errcode: 0, id: 1 })).toEqual({ errcode: 0, id: 1 })
  expect(() =>
    util.apiResponseError(Buffer.from('abc'), {
      'error-code': '1',
      'error-msg': 'invalid'
    })
  ).toThrow('invalid')

  expect(() =>
    util.apiResponseError(Buffer.from('{"errcode": 1, "errmsg": "invalid"}'), {
      'content-type': 'application/json; charset=UTF-8'
    })
  ).toThrow('invalid')
})

test('compose params', () => {
  expect(util.composeParams(null, null, null, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
  expect(util.composeParams(null, ['a'], null, { a: 1, b: 2 })).toEqual({ a: 1 })
  expect(util.composeParams(null, ['a'], ['a', 'b'], { a: 1, b: 2 })).toEqual({ a: 1, b: 2 })
  expect(() => {
    util.composeParams(null, ['c'], null, { a: 1, b: 2 })
  }).toThrow()
})

test('compose params with defaults', () => {
  expect(util.composeParams({ a: 1 }, null, null, { b: 2 })).toEqual({ a: 1, b: 2 })
  expect(util.composeParams({}, null, ['a', 'b'], { b: 2, c: 3 })).toEqual({ b: 2 })
  expect(util.composeParams({ a: 1 }, null, ['a', 'b'], { b: 2, c: 3 })).toEqual({ a: 1, b: 2 })
  expect(util.composeParams({ a: 1 }, ['a'], null, { b: 2 })).toEqual({ a: 1 })
  expect(util.composeParams({ a: 1 }, ['a'], ['a', 'b'], { b: 2 })).toEqual({ a: 1, b: 2 })
  expect(() => {
    util.composeParams({ a: 1 }, ['c'], null, { b: 2 })
  }).toThrow()
})

test('compose expand params', () => {
  expect(util.composeParams({ a: 1 }, ['a'], null)).toEqual({ a: 1 })
  expect(util.composeParams({ a: 1 }, ['a'], null, undefined)).toEqual({ a: 1 })
  expect(util.composeParams({ a: 1 }, ['a'], null, null)).toEqual({ a: 1 })
  expect(util.composeParams(null, ['a'], null, 1)).toEqual({ a: 1 })
  expect(util.composeParams(null, ['a'], ['b'], 1, 2)).toEqual({ a: 1, b: 2 })
  expect(() => {
    util.composeParams(null, ['c'], ['d'], null, 2)
  }).toThrow()
})
