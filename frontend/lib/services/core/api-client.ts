import axios, {AxiosError, AxiosResponse} from 'axios';
import {ApiError, ApiResponse} from './types';

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
 * 响应拦截器
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      return response;
    },
    (error: AxiosError<ApiError>) => {
    // 统一错误处理
      if (error.response?.data?.error_msg) {
      // 后端返回的错误信息
        const apiError = new Error(error.response.data.error_msg);
        apiError.name = 'ApiError';
        throw apiError;
      }

      // 网络错误或其他错误
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接');
      }

      if (error.response?.status === 401) {
        throw new Error('未登录或登录已过期');
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
