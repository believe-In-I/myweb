import axios from 'axios';

// 开发环境使用代理，生产环境使用完整 URL
const isDev = import.meta.env.DEV;
const baseURL = isDev ? '/api' : 'https://api.niumashuai.top';

// 创建 axios 实例
const request = axios.create({
  baseURL, // 开发环境用代理，生产用完整URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加认证信息，如 token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    // 处理请求错误
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 处理成功响应
    const res = response.data;
    
    // 可以根据后端返回的状态码进行统一处理
    // if (res.code !== 200) {
    //   // 处理错误
    //   return Promise.reject(new Error(res.message || '请求失败'));
    // }
    
    return res;
  },
  error => {
    // 处理响应错误
    console.error('响应错误:', error);
    
    // 可以根据错误状态码进行统一处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，可跳转到登录页
          break;
        case 403:
          // 禁止访问
          break;
        case 404:
          // 资源不存在
          break;
        case 500:
          // 服务器错误
          break;
        default:
          // 其他错误
          break;
      }
    }
    
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export const get = (url, params = {}, config = {}) => {
  return request({
    method: 'get',
    url,
    params,
    ...config
  });
};

// 封装 POST 请求
export const post = (url, data = {}, config = {}) => {
  return request({
    method: 'post',
    url,
    data,
    ...config
  });
};

// 封装 PUT 请求
export const put = (url, data = {}, config = {}) => {
  return request({
    method: 'put',
    url,
    data,
    ...config
  });
};

// 封装 DELETE 请求
export const del = (url, params = {}, config = {}) => {
  return request({
    method: 'delete',
    url,
    params,
    ...config
  });
};

// 封装 PATCH 请求
export const patch = (url, data = {}, config = {}) => {
  return request({
    method: 'patch',
    url,
    data,
    ...config
  });
};

export default request;