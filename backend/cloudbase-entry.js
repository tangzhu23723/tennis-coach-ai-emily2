// CloudBase 云函数入口
const { main } = require('./dist/index.js');

exports.main = async (event, context) => {
  // 将 CloudBase 事件转换为 Express 请求
  const { httpMessage, ...rest } = event;
  
  if (httpMessage) {
    // HTTP 触发
    const { httpMethod, path, headers, body, queryString } = httpMessage;
    
    // 构造 Express 请求对象
    const req = {
      method: httpMethod,
      url: path,
      headers,
      body: body ? JSON.parse(body) : {},
      query: queryString || {},
    };
    
    // 构造 Express 响应对象
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.headers['Content-Type'] = 'application/json';
        this.body = JSON.stringify(data);
        return this;
      },
      send: function(data) {
        this.body = data;
        return this;
      },
      setHeader: function(name, value) {
        this.headers[name] = value;
      }
    };
    
    // 调用 Express 应用
    const app = require('./dist/index.js').app;
    await new Promise((resolve) => {
      app(req, res, resolve);
    });
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
    };
  }
  
  // 定时触发等其他类型
  return { status: 'ok' };
};
