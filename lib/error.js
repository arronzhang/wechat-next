/**
 * api error.
 *
 * @constructor
 * @param {String} [message]
 * @param {String} [code]
 * @api public
 */

class ApiError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidateError extends ApiError {}

class ResponseError extends ApiError {}

exports.ApiError = ApiError
exports.ValidateError = ValidateError
exports.ResponseError = ResponseError
