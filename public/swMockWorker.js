// public/swMockWorker.js
let domain = '';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 只拦截指定域名的 API 请求
  if (url.hostname === domain) {
    const responsePromise = new Promise(async resolve => {
      // 获取请求体数据
      let requestBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
        try {
          requestBody = await event.request.json();
        } catch (_e) {
          requestBody = null;
        }
      }
      // 建立通信管道
      const channel = new MessageChannel();
      channel.port1.onmessage = msg => {
        const { status, headers, body } = msg.data;
        resolve(
          new Response(JSON.stringify(body), {
            status: status || 200,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }),
        );
      };
      // 通知主线程执行对应的回调
      const allClients = await clients.matchAll();
      if (allClients.length > 0) {
        allClients[0].postMessage(
          {
            type: 'MSW_SIMULATE_REQUEST',
            data: {
              url: url.pathname,
              method: event.request.method,
              body: requestBody,
              query: Object.fromEntries(url.searchParams.entries()),
              headers: Object.fromEntries(event.request.headers.entries()),
            },
          },
          [channel.port2],
        );
      }
    });
    event.respondWith(responsePromise);
  }
});

// 接收初始化配置
self.addEventListener('message', event => {
  if (event.data.type === 'SET_CONFIG') {
    domain = event.data.domain;
  }
});
