type HandlerCallback = (req: any, res: ResponseActions) => Promise<void> | void;
type ResponseConfig = { status?: number };
class ResponseActions {
  private _headers: Record<string, string> = { 'Content-Type': 'application/json' };
  private _status: number = 200;
  private _delayMs = 0;
  private _port: MessagePort;
  private _isSent = false;

  constructor(port: MessagePort) {
    this._port = port;
  }
  // 设置延迟时间
  delay = (ms: number) => {
    this._delayMs = ms;
    return this;
  };
  // 设置状态码
  status = (status: number) => {
    this._status = status;
    return this;
  };
  // 配置 JSON 响应
  json = async (data: Record<string, any>, config?: ResponseConfig) => {
    if (!this._tryLock()) return;
    this._sendStatus(config);
    this._headers['Content-Type'] = 'application/json';
    await this._send(data);
  };
  // 配置文本响应
  text = async (content: string, config?: ResponseConfig) => {
    if (!this._tryLock()) return;
    this._sendStatus(config);
    this._headers['Content-Type'] = 'text/plain';
    await this._send(content);
  };
  // 统一判断是否设置发送状态码
  private _sendStatus = (config?: ResponseConfig) => {
    if (config && typeof config.status === 'number') this._status = config.status;
  };
  // 统一的锁：尝试锁定发送状态
  // 返回 true 表示锁定成功（可以发送），false 表示已经发送过
  private _tryLock = (): boolean => {
    if (this._isSent) return false;
    this._isSent = true;
    return true;
  };
  // 发送响应
  private _send = async (data: any) => {
    // 如果设置了延迟，则等待
    if (this._delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this._delayMs));
    }
    // 通过端口回传给 Service Worker
    this._port.postMessage({
      status: this._status,
      headers: this._headers,
      body: data,
    });
  };
}

class MockClient {
  private handlers = new Map<string, HandlerCallback>();
  // 1. 定义语法糖
  // 特殊方法：匹配所有模式
  all(url: string, callback: HandlerCallback) {
    ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].forEach(method => {
      this.handlers.set(`${method.toUpperCase()}:${url}`, callback);
    });
  }
  // 标准方法：GET, POST, DELETE, PUT, PATCH, HEAD, OPTIONS
  get(url: string, callback: HandlerCallback) {
    this.handlers.set(`GET:${url}`, callback);
  }
  post(url: string, callback: HandlerCallback) {
    this.handlers.set(`POST:${url}`, callback);
  }
  delete(url: string, callback: HandlerCallback) {
    this.handlers.set(`DELETE:${url}`, callback);
  }
  put(url: string, callback: HandlerCallback) {
    this.handlers.set(`PUT:${url}`, callback);
  }
  patch(url: string, callback: HandlerCallback) {
    this.handlers.set(`PATCH:${url}`, callback);
  }
  head(url: string, callback: HandlerCallback) {
    this.handlers.set(`HEAD:${url}`, callback);
  }
  options(url: string, callback: HandlerCallback) {
    this.handlers.set(`OPTIONS:${url}`, callback);
  }
  // 2. 启动并监听 SW 的询问
  async init(domain: string) {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.register('/swMockWorker.js');
    await navigator.serviceWorker.ready;
    // 同步配置信息
    registration.active?.postMessage({ type: 'SET_CONFIG', domain });
    // 监听来自 SW 的请求信号
    navigator.serviceWorker.addEventListener('message', async event => {
      if (event.data.type === 'MSW_SIMULATE_REQUEST') {
        const { method, url } = event.data.data;
        const port = event.ports[0];
        const handlerKey = `${method}:${url}`;
        const handler = this.handlers.get(handlerKey);
        if (!port) return;
        if (handler) {
          const res = new ResponseActions(port);
          await handler(Object.assign({}, event.data.data), res);
        } else {
          // 如果没找到对应的 Mock，也得给 SW 一个反馈，否则就挂起了
          port.postMessage({ body: { error: 'Not Found' }, status: 404 });
        }
      }
    });
  }
}

export const httpRequest = new MockClient();
