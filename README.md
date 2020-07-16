[![Build Status](https://travis-ci.org/zzdhidden/wechat-next.svg?branch=master)](https://travis-ci.org/zzdhidden/wechat-next) [![Coverage Status](https://coveralls.io/repos/github/zzdhidden/wechat-next/badge.svg?branch=master&service=github)](https://coveralls.io/github/zzdhidden/wechat-next.js?branch=master) 

# Wechat Next 微信开放平台api (Node.js)

Wechat Next 主要实现实现对 微信、企业微信 api 的基础访问功能，包括接口访问、错误处理、accessToken
管理、微信消息接收。没有做过多的封装，所有数据参数请参考微信文档。

```js
npm install wechat-next
```

## 使用

```js
const { Wechat } = require('wechat-next')
const params = { appid, secret };
let token;
const api = new Wechat(params, {
  saveAccessToken(accessTokenData, params){
    token = accessTokenData;
  },
  getAccessToken(params){
    return token;
  }
});

await api.post('cgi-bin/menu/create', menus)
const menus = await api.get('cgi-bin/menu/get_current_selfmenu_info')

```

### accssToken 管理

根据 `acessToken` 的不同处理方式，该api支持多种调用方法

如果想自行管理 `accssToken`，可以将该库当作 `request` 使用。

```js
const { Wechat } = require('wechat-next')
const api = new Wechat();
const accessToken = await api.getAccessToken({ appid, secret });
await api.post('cgi-bin/menu/create', {
  access_token: accessToken.accessToken
}, menus)
const menus = await api.get('cgi-bin/menu/get_current_selfmenu_info', {
  access_token: accessToken.accessToken
})

```

如果是单进程，可以直接由类自动处理 `accessToken` 获取、过期重试

```js
const { Wechat } = require('wechat-next')
const params = { appid, secret };
const api = new Wechat(params);
await api.post('cgi-bin/menu/create', menus)
```

如果是多进程，或者分布式部署，初始化类时提供了 `getAccessToken`, `saveAccessToken` 配置以供
accessToken 的存储。

```js
const { Wechat } = require('wechat-next')
const params = { appid, secret };
const api = new Wechat(params, {
  saveAccessToken(accessTokenData, params){
    return saveAsync(accessTokenData);
  },
  getAccessToken(params){
    return getAsync(params); //params 为初始化时的 params
  }
});
```

## 基础功能

微信api、企业微信api、oauth认证都继承自`BaseApi` 都拥有一样的基础功能

### 初始化api

```js
const { Wechat, WxWork } = require('wechat-next')
const wechatApi = new Wechat(params, { saveAccessToken, getAccessToken, request })
const wxWorkApi = new WxWork(params, { saveAccessToken, getAccessToken, request })
```

各自的 params 略有不同，主要提供默认的认证参数，比如 Wechat 是 `{ appid, secret }`，
WxWork 是 `{ corpid, corpsecret, agentid }` 根据微信api文档定义未做更改。
如果未配置 params 则需要在访问方法(需授权)的参数中提供。

`request` 配置 [axios](https://github.com/axios/axios) 的默认值。


### api.request(path, config)

请求无需提前授权的 api，`path`, `config` 为 [axios](https://github.com/axios/axios) 的参数
处理接口错误信息，抛出错误。

### api.getAccessToken(params)

获取授权 `accessToken`。
`params` 参考微信授权api，会合并初始化时的默认 `params`

### api.authorizeRequest(path, config)

自动处理授权后请求 `api.request`
如果提供了授权令牌参数 `access_token`，则直接访问。
未提供则调用 `api.getAccessToken` 获得授权后访问。
自动处理过期重试。

### api.get(path, params, config)

`get` 方式访问 `api.authorizeRequest`
`params` 为 url query 参数

### api.post(path, params, data, config)

`post` 方式访问 `api.authorizeRequest`
`params` 为 url query 参数
`data` 为提交数据

## Oauth 认证（微信，小程序，开放平台）

```js
const { WechatOauth } = require('wechat-next')
const oauth = new WechatOauth({ appid, secret })
```

### oauth.getAuthorizeURL(params)

微信内嵌网页获取认证 url
参数会合并初始化中的 `params`
[参数参考](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html)

### oauth.getQRAuthorizeURL(params)

网页扫码认证 url
[参数参考](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)

### oauth.code2Session(js\_code)

小程序 jsCode 获取 openid、session\_key

### oauth.decryptData(data, session\_key, iv, appid)

解密数据（小程序）

### oauth.getUserInfo(openid, lang)

获取用户数据

## 接收消息 Receiver

接收微信，企业微信消息

```js
const { Receiver } = require('wechat-next')
```

### Receiver.handleRequest({ appid, token, aes\_key }, method, query, xml, handler)

自定义处理微信 request 请求。
handler 支持返回 Promise

```js
const { Receiver } = require('wechat-next')
const config = { appid: 'demo', token: 'demo', aes_key: 'demo' };
const http = require('http');
const server = http.createServer((req, res) => {
  Receiver.handleRequest(
    config,
    req.method,
    paseQuery(req),
    parseBody(req),
    function(messsage) => {
       return 'ok';
    }
  ).then(ret => {
    res.statusCode = ret.status;
    if(ret.type) res.setHeader('Content-Type', ret.type);
    res.end(ret.body);
  }).catch(err => {
    res.statusCode = 500;
    res.end('');
  });
});
server.listen(3000);
```

### Receiver.koa(config, handler)

koa 中间件
最终传入 `Receiver.handleRequest` 的 config 会合并 `ctx.wechatConfig` 如果有自定义 appid
的需求可以提前设置 `ctx.wechatConfig`

```js
const { Receiver } = require('wechat-next')
app.use( Receiver.koa(config, async (message, ctx) => {
  return 'ok';
})
```

### Receiver.express(config, handler)

express 中间件
最终传入 `Receiver.handleRequest` 的 config 会合并 `req.wechatConfig` 如果有自定义 appid
的需求可以提前设置 `req.wechatConfig`

```js
const { Receiver } = require('wechat-next')
app.use( Receiver.express(config, (message, req, done) => {
  done('ok');
})
```

## 微信，小程序 api

[官方文档](https://developers.weixin.qq.com/doc/)

```js
const { Wechat } = require('wechat-next')
const wechatApi = new Wechat({ appid, secret })
```

## 企业微信内部开发 api

[官方文档](https://work.weixin.qq.com/api/doc)

```js
const { WxWork } = require('wechat-next')
const wxWorkApi = new WxWork({ corpid, corpsecret, agentid })
```

### wxWorkApi.getAuthorizeURL(params)

微信内嵌网页获取认证 url
参数会合并初始化中的 `params`
[参数参考](https://work.weixin.qq.com/api/doc/90000/90135/91022)

### wxWorkApi.getQRAuthorizeURL(params)

网页扫码认证 url
[参数参考](https://work.weixin.qq.com/api/doc/90000/90135/91019)

### wxWorkApi.getUserInfo(code)

获取用户数据

## 企业微信服务商认证 api

[官方文档](https://work.weixin.qq.com/api/doc)

```js
const { WxWorkProvider } = require('wechat-next')
const wxWorkProviderApi = new WxWorkProvider({ corpid, provider_secret })
```

### wxWorkProviderApi.getAuthorizeURL(params)

[参数参考](https://work.weixin.qq.com/api/doc/90001/90143/91120)

### wxWorkProviderApi.getUserInfo(auth\_code)

获取用户数据

## 企业微信服务商 api

[官方文档](https://work.weixin.qq.com/api/doc)

```js
const { WxWorkSuite } = require('wechat-next')
const wxWorkSuiteApi = new WxWorkSuite({ suite_id, suite_secret, suite_ticket })
```

### wxWorkSuiteApi.getAuthorizeURL(params)

[参数参考](https://work.weixin.qq.com/api/doc/90001/90143/91120)

### wxWorkProviderApi.getInstallURL(params)

[参数参考](https://work.weixin.qq.com/api/doc/90001/90143/90597)

