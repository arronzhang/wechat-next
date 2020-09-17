/// <reference types="node" />

import { AxiosRequestConfig } from 'axios'

export = WechatNext

declare module WechatNext {
  interface LiteralObject {
    [key: string]: any
  }

  interface AccessTokenData {
    access_token: string
    expires_in: number
    refresh_token?: string
    openid?: string
    scope?: string
    [key: string]: any
  }

  class AccessToken {
    constructor(data: AccessTokenData)
    get data(): AccessTokenData
    get accessToken(): string
    get expiresIn(): number
    get createdAt(): number
    isExpired(): boolean
  }

  class ApiError extends Error {
    constructor(message: any, code?: any)
  }

  class ValidateError extends ApiError {}

  class ResponseError extends ApiError {}

  interface BaseApiConfig<TParams> {
    getAccessToken?: (
      params: TParams
    ) => AccessTokenData | AccessToken | Promise<AccessTokenData | AccessToken>
    saveAccessToken?: (data: AccessTokenData, params: TParams) => void | Promise<void>
    request?: AxiosRequestConfig
  }

  type Shortcut =
    | ['get' | 'post', string]
    | ['get' | 'post', string, string[]]
    | ['get' | 'post', string, string[] | null, string[]]
  type Shortcuts = { [name: string]: Shortcut }

  abstract class BaseRequest {
    constructor(params: any, config: any, baseURL: string)
    static define(
      name: string,
      method: 'get' | 'post',
      path: string,
      paramAttrs?: string[],
      dataAttrs?: string[]
    ): void
    static defines(shortcuts: Shortcuts): void
    /**
     * Helper for compose params from defaults and valid param attributes
     */
    composeParams(attrs: string[], params: any[]): LiteralObject
  }

  abstract class BaseApi<TParams = LiteralObject> extends BaseRequest {
    constructor(params: TParams, config: BaseApiConfig<TParams>, baseURL: string, tokenKey?: string)
    get accessToken(): AccessToken
    set accessToken(accessToken: AccessToken)
    /**
     * Call get access token api.
     * Notice: It will not call `saveAccessToken` api.
     */
    abstract getAccessToken(...args: any[]): Promise<AccessToken>
    /**
     * Request api
     * It will automatic add access token to params and handle wx error message.
     */
    request<T = any>(path: string, config?: AxiosRequestConfig): Promise<T>

    /**
     * Get the access token and then request.
     * Repeat once when token expired.
     * Call the `getAccessToken(defaultParams)` and `saveAccessToken(tokenData, defaultParams)` api if has set by `new Api({getAccessToken, saveAccessToken})`.
     *
     */
    authorizeRequest<T = any>(path: string, config?: AxiosRequestConfig): Promise<T>

    get<T = any>(path: string, params?: any, config?: AxiosRequestConfig): Promise<T>
    post<T = any>(path: string, params?: any, data?: any, config?: AxiosRequestConfig): Promise<T>
  }

  interface WxWorkParams {
    access_token?: string
    corpid?: string
    corpsecret?: string
    agentid?: string
    redirect_uri?: string
    response_type?: string
    scope?: string
    state?: string
  }

  class WxWork extends BaseApi<WxWorkParams> {
    constructor(params?: WxWorkParams, config?: BaseApiConfig<WxWorkParams>)

    getAccessToken(params?: WxWorkParams): Promise<AccessToken>
    getAccessToken(corpid?: string, corpsecret?: string): Promise<AccessToken>

    getAuthorizeURL(params?: WxWorkParams): string
    getQRAuthorizeURL(params?: WxWorkParams): string

    getUserInfo(params: WxWorkParams & { code: string }): Promise<any>
    getUserInfo(code: string): Promise<any>
  }

  interface WxWorkProviderParams {
    access_token?: string
    corpid?: string
    provider_secret?: string
    redirect_uri?: string
    state?: string
    usertype?: string
  }

  class WxWorkProvider extends BaseApi<WxWorkProviderParams> {
    constructor(params?: WxWorkProviderParams, config?: BaseApiConfig<WxWorkProviderParams>)

    getAccessToken(params?: WxWorkProviderParams): Promise<AccessToken>
    getAccessToken(corpid?: string, providerSecret?: string): Promise<AccessToken>

    getAuthorizeURL(params?: WxWorkProviderParams): string

    getUserInfo(params: WxWorkProviderParams & { auth_code: string }): Promise<any>
    getUserInfo(authCode: string): Promise<any>
  }

  interface WxWorkSuiteParams {
    suite_access_token?: string
    suite_id?: string
    suite_secret?: string
    suite_ticket?: string
    redirect_uri?: string
    response_type?: string
    scope?: string
    state?: string
    pre_auth_code?: string
  }

  class WxWorkSuite extends BaseApi<WxWorkSuiteParams> {
    constructor(params?: WxWorkSuiteParams, config?: BaseApiConfig<WxWorkSuiteParams>)

    getAccessToken(params?: WxWorkSuiteParams): Promise<AccessToken>
    getAccessToken(corpid?: string, providerSecret?: string): Promise<AccessToken>

    getInstallURL(params?: WxWorkSuiteParams): string
    getAuthorizeURL(params?: WxWorkSuiteParams): string
  }

  interface WechatParams {
    access_token?: string
    appid?: string
    secret?: string
    grant_type?: string
  }

  class Wechat extends BaseApi<WechatParams> {
    constructor(params?: WechatParams, config?: BaseApiConfig<WechatParams>)

    getAccessToken(params?: WechatParams): Promise<AccessToken>
    getAccessToken(appid?: string, secret?: string, grantType?: string): Promise<AccessToken>

    createMenu(data: any): Promise<any>
    getMenu(): Promise<any>
  }

  interface WechatOauthParams extends WechatParams {
    redirect_uri?: string
    response_type?: string
    scope?: string
    state?: string
  }

  type WechatOauthUserInfoLang = 'zh_CN' | 'zh_TW' | 'en'

  class WechatOauth extends BaseApi<WechatOauthParams> {
    constructor(params?: WechatOauthParams, config?: BaseApiConfig<WechatOauthParams>)

    getAccessToken(params: WechatOauthParams & { code: string }): Promise<AccessToken>
    getAccessToken(
      code: string,
      appid?: string,
      secret?: string,
      grantType?: string
    ): Promise<AccessToken>

    getAuthorizeURL(params?: WechatOauthParams): string
    getQRAuthorizeURL(params?: WechatOauthParams): string

    code2Session(params: WechatOauthParams & { js_code: string }): Promise<any>
    code2Session(jsCode: string, appid?: string, secret?: string, grantType?: string): Promise<any>

    decryptData(params: WechatOauthParams & { data: string; session_key: string; iv: string }): any
    decryptData(data: string, sessionKey: string, iv: string, appid?: string): any

    getUserInfo(
      params: WechatOauthParams & { openid: string; lang?: WechatOauthUserInfoLang }
    ): Promise<any>
    getUserInfo(openid: string, lang?: WechatOauthUserInfoLang): Promise<any>
  }

  interface WechatPaymentParams {
    mch_id?: string
    appid?: string
  }

  interface WechatPaymentConfig {
    apiKey?: string
    pfx?: string
    passphrase?: string
  }

  class WechatPayment extends BaseRequest {
    constructor(params?: WechatPaymentParams, config?: BaseApiConfig<WxWorkParams>)
    static nonce(length: number): string
    static sign(data: LiteralObject, apiKey: string): string
    static parseXML(data: string): any
    static stringifyXML(data: any): string
    post<T = any>(
      path: string,
      data?: any,
      config?: AxiosRequestConfig & { apiKey?: string }
    ): Promise<T>
  }

  interface ReceiverConfig {
    appid: string
    token: string
    aes_key?: string
  }

  interface ReceiverResponse {
    type?: string
    status: number
    body: any
  }

  namespace Receiver {
    /**
     * Express middleware for handle wechat message.
     * Merge config from `req.wechatConfig`
     *
     */
    function express(
      config: ReceiverConfig | null,
      handler: (message: any, request: any, response: (data: any) => void) => void
    ): (req: any, res: any, next: any) => void

    /**
     * Koa middleware for handle wechat message.
     * Merge config from `ctx.wechatConfig`
     */
    function koa(
      config: ReceiverConfig | null,
      handler: (message: any, ctx: any) => any | Promise<any>
    ): (ctx: any) => Promise<any>

    function handleRequest(
      config: ReceiverConfig,
      method: string,
      query: LiteralObject,
      xml: string | LiteralObject,
      handler: (message: any, appid?: string) => any | Promise<any>
    ): Promise<ReceiverResponse>

    /**
     * Verify query signature and return `false` when invalid
     */
    function verify(
      config: { token: string; aes_key?: string },
      query: LiteralObject
    ): { message: string; appid?: string } | false

    /**
     * Parse received post data
     * Verify query and post message signature and return `false` when invalid
     */
    function parse(
      config: { token: string; aes_key?: string },
      query: LiteralObject,
      data: string | LiteralObject
    ): { message: string; appid?: string } | false

    /**
     * Stringify reply message
     */
    function stringify(
      config: ReceiverConfig,
      query: LiteralObject,
      receiveMessage: any,
      replyMessage: any
    ): string

    /**
     * Patch replay message form receiveMessage
     */
    function patchReplyMessage(replyMessage: any, receiveMessage?: LiteralObject): LiteralObject
  }
}
