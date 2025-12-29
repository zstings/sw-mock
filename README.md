# mocksw

一个基于 Service Worker 的轻量级、零侵入 API 模拟工具。通过在 Service Worker 层拦截 fetch 请求，实现在本地开发环境中快速模拟 API 响应。

## ✨ 特性

- 零侵入性：无需修改业务代码中的 fetch 或 axios 调用。
- Service Worker 拦截：在浏览器底层进行拦截，支持跨页面的持久化 Mock。
- 极致 TS 体验：完整的类型推断，支持泛型定义响应体。
- 语义化 API：支持链式调用、延迟响应、自定义状态码等。
- 数据库友好：可在拦截逻辑中直接使用 Dexie 等 IndexedDB 数据库。

## 📦 安装

```sh
npm install mocksw -D
# or
npm install mocksw -D
```

## 🚀 快速开始

### 1. 初始化

在你的项目根目录下运行初始化命令（通常是 public 文件夹）：

```sh
npx mocksw init public
# or
pnpm exec mocksw init public
```

这将在你的公共目录下生成 `swMockWorker.js` worker环境。

### 2. 注册拦截接口

在你的应用入口文件（如 `main.ts` 或 `index.ts`）中进行配置：

```js
import { httpRequest } from 'mocksw';

// 定义 Mock 接口
httpRequest.post('/api/user/login', async ({ body }, res) => {
  const { username, password } = body;
  // 模拟延迟 1000ms
  if (username !== 'admin') {
    return res.delay(1000).status(401).json({
      code: 401,
      msg: '用户名错误',
    });
  }
  return res.json({
    code: 200,
    data: { token: 'sw_mock_token_abc123' },
    msg: 'success',
  });
});
```

### 3. 在项目入口文件中引入初始化

在项目入口文件（如 `main.js`）中引入 Service Worker：

```js
// 初始化 Mock 环境 指定域名进行拦截 推荐在 Vue 实例挂载后初始化
httpRequest.init('www.vadmin.test.com').then(() => {
  console.log('🚀 完美 Mock 环境已就绪');
  // 挂载 Vue 实例 推荐在 init 后挂载
  app.mount('#app');
  // 现在这个接口调用会被拦截 并返回模拟响应
  login();
});

function login() {
  axios
    .post('http://www.vadmin.test.com/user/login', {
      username: 'admin',
      password: '123456',
    })
    .then(res => {
      console.log(res.data);
    });
}
```

启动项目，即可在浏览器中使用 Mock API。

## 📖 API 说明

`httpRequest`
支持所有标准 HTTP 方法：

- `httpRequest.get(url, callback)`
- `httpRequest.post(url, callback)`
- `httpRequest.put(url, callback)`
- `httpRequest.delete(url, callback)`
- `httpRequest.patch(url, callback)`
- `httpRequest.head(url, callback)`
- `httpRequest.options(url, callback)`

`MockRequest` (回调第一个参数)

- `body`：请求体（自动解析 JSON）
- `query`：URL 查询参数对象
- `headers`：原生请求头
- `method`：请求方法（如 GET、POST 等）
- `headers`：原生请求头

`MockResponse` (回调第二个参数)

- `json(data)`：设置 JSON 响应体
- `text(data)`：设置文本响应体
- `delay(ms)`：延迟响应指定毫秒数 支持链式调用
- `status(code)`：设置 HTTP 状态码（默认 200）支持链式调用

## 🛠️ 高阶用法：结合 Dexie 模拟数据库

由于拦截器运行在主线程环境，你可以轻松结合 IndexedDB 进行增删改查：

```ts
import Dexie from 'dexie';
httpRequest.get('/api/users', async (req, res) => {
  const db = new Dexie('MyDatabase');
  const users = await db.table('users').toArray();
  return res.json(users);
});
```
