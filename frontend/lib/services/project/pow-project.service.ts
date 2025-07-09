import {POWManager} from '../../utils/pow';
import {ProjectService} from './project.service';
import {ListProjectsRequest, ProjectListData} from './types';

export class POWProjectService extends ProjectService {
  private static powManager = POWManager.getInstance();

  static async getProjectsWithPOW(params: ListProjectsRequest): Promise<ProjectListData> {
    try {
      // 尝试获取 challenge 并解决 PoW（在后台进行）
      const {challenge, nonce} = await this.powManager.getChallengeAndSolve();

      // 设置 PoW 头部
      const headers = {
        'X-POW-Challenge': challenge,
        'X-POW-Nonce': nonce.toString(),
      };

      // 使用带有 PoW 头部的请求
      const requestParams = {
        current: params.current,
        size: params.size,
      };

      if (params.tags && params.tags.length > 0) {
        requestParams.tags = params.tags;
      }

      const response = await fetch(`/api/v1/projects?${new URLSearchParams(requestParams as Record<string, string>)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_msg || 'Failed to fetch projects');
      }

      const data = await response.json();

      if (data.error_msg) {
        throw new Error(data.error_msg);
      }

      return data.data;
    } catch (error) {
      console.error('PoW verification failed, falling back to normal request:', error);
      // 如果 PoW 失败，回退到普通请求
      return this.getProjects(params);
    }
  }

  /**
   * 获取项目列表（带错误处理和 PoW 验证）
   */
  static async getProjectsSafe(params: ListProjectsRequest): Promise<{
    success: boolean;
    data?: ProjectListData;
    error?: string;
  }> {
    try {
      const data = await this.getProjectsWithPOW(params);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取项目列表失败';
      return {
        success: false,
        data: {total: 0, results: []},
        error: errorMessage,
      };
    }
  }
}
