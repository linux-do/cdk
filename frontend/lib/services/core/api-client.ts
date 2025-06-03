import axios, {AxiosError, AxiosResponse} from 'axios';
import {ApiError, ApiResponse} from './types';
import {clearSessionCookie} from '@/lib/utils/cookies';

/**
 * 创建axios实例
 */
const apiClient = axios.create({
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
);

/**
 * 重定向到登录页
 * @param currentPath 当前路径
 */
function redirectToLogin(currentPath: string): never {
  // 防止循环重定向：只有非登录相关路径才重定向
  if (!currentPath.startsWith('/login') && !currentPath.startsWith('/callback')) {
    // 清除cookie
    clearSessionCookie();
    
    // 保存当前路径用于登录后返回
    const redirectUrl = new URL('/login', window.location.origin);
    redirectUrl.searchParams.set('redirect', currentPath);
    
    // 重定向到登录页
    window.location.href = redirectUrl.toString();
  }
  
  // 返回一个永远不会解决的Promise，防止错误继续传播
  return new Promise<never>(() => {}) as never;
}

/**
 * 响应拦截器
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // 处理401未授权错误 - 必须重定向到登录页面
    if (error.response?.status === 401) {
      return redirectToLogin(window.location.pathname);
    }
    
    // 处理后端返回的错误信息
    if (error.response?.data?.error_msg) {
      const apiError = new Error(error.response.data.error_msg);
      apiError.name = 'ApiError';
      throw apiError;
    }

    // 处理其他常见错误
    if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }

    if (error.response?.status === 403) {
      throw new Error('权限不足');
    }

    if (error.response && error.response.status >= 500) {
      throw new Error('服务器内部错误，请稍后重试');
    }

    throw new Error(error.message || '网络请求失败');
  },
);

export default apiClient;
