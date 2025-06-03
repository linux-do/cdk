import apiClient from './api-client';
import { ApiResponse } from './types';

/**
 * 服务基类
 * 提供通用的HTTP方法封装
 */
export abstract class BaseService {
  /**
   * API基础路径
   */
  protected static basePath: string = '';

  /**
   * 获取完整的API路径
   */
  protected static getFullPath(path: string): string {
    return `${this.basePath}${path}`;
  }

  /**
   * GET请求
   * @template T 响应数据类型
   * @param path API路径
   * @param params 查询参数
   * @returns Promise<T> 响应数据
   */
  protected static async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(this.getFullPath(path), { params });
    return response.data.data;
  }

  /**
   * POST请求
   * @template T 响应数据类型
   * @param path API路径
   * @param data 请求数据
   * @returns Promise<T> 响应数据
   */
  protected static async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(this.getFullPath(path), data);
    return response.data.data;
  }

  /**
   * PUT请求
   * @template T 响应数据类型
   * @param path API路径
   * @param data 请求数据
   * @returns Promise<T> 响应数据
   */
  protected static async put<T>(path: string, data?: unknown): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(this.getFullPath(path), data);
    return response.data.data;
  }

  /**
   * DELETE请求
   * @template T 响应数据类型
   * @param path API路径
   * @param params 查询参数
   * @returns Promise<T> 响应数据
   */
  protected static async delete<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(this.getFullPath(path), { params });
    return response.data.data;
  }
} 