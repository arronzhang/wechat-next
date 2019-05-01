const util = require('../lib/util')
const stream = require('stream')
const FormData = require('form-data')

test('is object', () => {
  expect(util.isObject({ a: 1 })).toBeTruthy()
  expect(util.isObject()).toBeFalsy()
  expect(util.isObject(null)).toBeFalsy()
  expect(util.isObject('abc')).toBeFalsy()
  expect(util.isObject(111)).toBeFalsy()
})

test('is stream', () => {
  expect(util.isStream({})).toBeFalsy()
  expect(util.isStream(new stream.Readable())).toBeTruthy()
})

test('media form data', () => {
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

test('response error', () => {
  expect(() => util.transformResponse('')).toThrow('empty')
  expect(() => util.transformResponse({ errcode: 1, errmsg: 'invalid' })).toThrow('invalid')
  expect(util.transformResponse({ errcode: 0, id: 1 })).toEqual({ errcode: 0, id: 1 })
  expect(() =>
    util.transformResponse(Buffer.from('abc'), {
      'error-code': '1',
      'error-msg': 'invalid'
    })
  ).toThrow('invalid')

  expect(() =>
    util.transformResponse(Buffer.from('{"errcode": 1, "errmsg": "invalid"}'), {
      'content-type': 'application/json; charset=UTF-8'
    })
  ).toThrow('invalid')
  expect(() =>
    util.transformResponse('{"errcode": 1, xxxx}', {
      'content-type': 'application/json; charset=UTF-8'
    })
  ).toThrow()
  expect(
    util.transformResponse(
      { errcode: 0, errmsg: 'ok' },
      {
        'content-type': 'application/json; charset=UTF-8'
      }
    )
  ).toHaveProperty('errmsg', 'ok')
})

describe('composeParams', () => {
  test('compose params', () => {
    expect(util.composeParams(null, null, [{ a: 1, b: 2 }])).toEqual({ a: 1, b: 2 })
    expect(util.composeParams(null, null, [1])).toEqual({})
    expect(util.composeParams(null, ['!a'], [{ a: 1, b: 2 }])).toEqual({ a: 1 })
    expect(util.composeParams(null, ['!a'], [{ a: 1, b: 2, access_token: 't' }])).toEqual({
      a: 1,
      access_token: 't'
    })
    expect(util.composeParams(null, ['!a', 'b'], [{ a: 1, b: 2 }])).toEqual({ a: 1, b: 2 })
    expect(() => {
      util.composeParams(null, ['!c'], [{ a: 1, b: 2 }])
    }).toThrow(/missing/)
    expect(() => {
      util.composeParams(null)
    }).toThrow()
  })

  test('compose params with defaults', () => {
    expect(util.composeParams({ a: 1 }, null, [{ b: 2 }])).toEqual({ a: 1, b: 2 })
    expect(util.composeParams({}, ['a', 'b'], [{ b: 2, c: 3 }])).toEqual({ b: 2 })
    expect(util.composeParams({ a: 1 }, ['a', 'b'], [{ b: 2, c: 3 }])).toEqual({ a: 1, b: 2 })
    expect(util.composeParams({ a: 1 }, ['!a'], [{ b: 2 }])).toEqual({ a: 1 })
    expect(util.composeParams({ a: 1 }, ['!a', 'b'], [{ b: 2 }])).toEqual({ a: 1, b: 2 })
    expect(() => {
      util.composeParams({ a: 1 }, ['!c'], [{ b: 2 }])
    }).toThrow()
  })

  test('compose expand params', () => {
    expect(util.composeParams({ a: 1 }, ['!a'], [])).toEqual({ a: 1 })
    expect(util.composeParams({ a: 1 }, ['!a'], [undefined])).toEqual({ a: 1 })
    expect(util.composeParams({ a: 1 }, ['!a'], [null])).toEqual({ a: 1 })
    expect(util.composeParams(null, ['!a'], [1])).toEqual({ a: 1 })
    expect(util.composeParams(null, ['!a', 'b'], [1, 2])).toEqual({ a: 1, b: 2 })
    expect(() => {
      util.composeParams(null, ['!c', 'd'], [null, 2])
    }).toThrow(/missing/)
  })

  test('check last param', () => {
    let list = [{ a: 1 }, { b: 2 }]
    expect(util.composeParams(null, null, list)).toEqual({ a: 1 })
    expect(list).toEqual([{ b: 2 }])

    list = [{ a: 1 }]
    expect(util.composeParams(null, [], list)).toEqual({})
    expect(list).toEqual([])

    list = [1, 2, 3, 4]
    expect(util.composeParams(null, ['a', 'b'], list)).toEqual({ a: 1, b: 2 })
    expect(list).toEqual([3, 4])

    list = [1, 2]
    expect(util.composeParams(null, [], list)).toEqual({})
    expect(list).toEqual([1, 2])
  })
})

test('xml', () => {
  expect(util.simplifyXML({ a: [1] }).a).toBe(1)
  expect(util.simplifyXML({ a: [1], _parent: 1 })._parent).toBeUndefined()
  expect(util.simplifyXML({ a: [{ title: { _text: 't' } }] }).a[0].title).toBe('t')
  expect(util.buildXML({ a: { _cdata: 't' }, b: { _text: 't' } }).a._cdata).toBe('t')
  expect(util.buildXML({ a: { _cdata: 't' }, b: { _text: 't' } }).b._text).toBe('t')
  expect(util.buildXML({ a: undefined })).toHaveProperty('a')

  let txt = util.stringifyXML({
    ToUserName: 'to',
    FromUserName: 'from',
    CreateTime: 12345678,
    MsgType: 'music',
    Music: {
      Title: 'music',
      ThumbMediaId: 'media_id'
    },
    ArticleCount: 2,
    Articles: [{ Title: 'Article' }, { Title: 'Article1' }],
    Articles1: [{ Title: 'Article2' }]
  })
  expect(txt).toMatch('<ToUserName><![CDATA[to]]></ToUserName>')
  expect(txt).toMatch('<CreateTime>12345678</CreateTime>')
  expect(txt).toMatch('<ThumbMediaId><![CDATA[media_id]]></ThumbMediaId>')
  expect(txt).toMatch(/<Articles>[\s\n\t]+<item>[\s\n\t]+<Title>/i)

  txt = util.stringifyXML({
    Articles: { item: [{ Title: 'Article' }] }
  })
  expect(txt).toMatch(/<Articles>[\s\n\t]+<item>[\s\n\t]+<Title>/i)
})
