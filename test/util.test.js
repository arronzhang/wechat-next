const util = require('../lib/util')
const stream = require('stream')
const FormData = require('form-data')

it('media form data', () => {
	expect( util.mediaFormData({'a': 1}) ).toEqual({'a': 1})
	const headers = {'custom': 'cc'}
	const data = util.mediaFormData({'a': 1, 'media': __dirname + '/media.txt' }, headers)
	expect( headers ).toHaveProperty('custom', 'cc')
	expect( headers ).toHaveProperty('content-type')
	expect( data ).toBeInstanceOf( FormData )
})

it('response error', () => {
	expect( () => util.apiResponseError('') ).toThrow('empty')
	expect( () => util.apiResponseError({errcode: 1, errmsg: 'invalid'}) ).toThrow('invalid')
	expect( util.apiResponseError({errcode: 0, id: 1}) ).toEqual({errcode: 0, id: 1})
})
