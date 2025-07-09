import apiClient from '../core/api-client';
import { POWManager } from '../../utils/pow';

class POWApiClient {
  private powManager = POWManager.getInstance();

  async get<T>(url: string, config?: any): Promise<{ data: T }> {
    // 检查是否是需要 PoW 验证的项目列表请求
    if (url === '/api/v1/projects' && (!config || config.method !== 'POST')) {
      try {
        // 尝试获取 challenge 并解决 PoW
        const { challenge, nonce } = await this.powManager.getChallengeAndSolve();
        
        // 添加 PoW 头部
        const headers = {
          ...config?.headers,
          'X-POW-Challenge': challenge,
          'X-POW-Nonce': nonce.toString()
        };

        return apiClient.get<T>(url, { ...config, headers });
      } catch (error) {
        console.error('PoW verification failed:', error);
        
        // 如果 PoW 失败，尝试直接发送请求
        try {
          return apiClient.get<T>(url, config);
        } catch (originalError) {
          // 检查是否是需要 PoW 验证的错误
          if (originalError instanceof Error && originalError.message.includes('POW')) {
            // 清除缓存并重试
            this.powManager.clearCache();
            throw new Error('PoW verification required. Please try again.');
          }
          throw originalError;
        }
      }
    }

    return apiClient.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return apiClient.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return apiClient.put<T>(url, data, config);
  }

  async delete<T>(url: string, config?: any): Promise<{ data: T }> {
    return apiClient.delete<T>(url, config);
  }
}

export default new POWApiClient();