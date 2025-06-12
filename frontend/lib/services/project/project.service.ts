import {BaseService} from '../core/base.service';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ReceiveHistoryRequest,
  ReceiveHistoryData,
  ProjectResponse,
  ReceiveHistoryResponse,
  TagsResponse,
  ReceiveProjectResponse,
  GetProjectResponseData,
  GetProjectResponse,
  ListProjectsRequest,
  ProjectListData,
  ProjectListResponse,
  ApiRequestParams,
} from './types';
import apiClient from '../core/api-client';

/**
 * 项目服务
 * 处理项目的创建、更新、删除等操作
 */
export class ProjectService extends BaseService {
  /**
   * API基础路径
   */
  protected static readonly basePath = '/api/v1/projects';

  /**
   * 获取项目详情
   * @param projectId - 项目ID
   * @returns 项目详细信息
   */
  static async getProject(projectId: string): Promise<GetProjectResponseData> {
    const response = await apiClient.get<GetProjectResponse>(`${this.basePath}/${projectId}`);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }

    return response.data.data;
  }

  /**
   * 创建项目
   * @param projectData - 项目创建数据
   * @returns 创建结果
   */
  static async createProject(projectData: CreateProjectRequest): Promise<void> {
    const response = await apiClient.post<ProjectResponse>(`${this.basePath}`, projectData);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
  }

  /**
   * 更新项目
   * @param projectId - 项目ID
   * @param projectData - 项目更新数据
   * @returns 更新结果
   */
  static async updateProject(
      projectId: string,
      projectData: UpdateProjectRequest,
  ): Promise<void> {
    const response = await apiClient.put<ProjectResponse>(`${this.basePath}/${projectId}`, projectData);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
  }

  /**
   * 删除项目
   * @param projectId - 项目ID
   * @returns 删除结果
   */
  static async deleteProject(projectId: string): Promise<void> {
    const response = await apiClient.delete<ProjectResponse>(`${this.basePath}/${projectId}`);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
  }

  /**
   * 领取项目内容
   * @param projectId - 项目ID
   * @returns 领取结果
   */
  static async receiveProject(projectId: string): Promise<void> {
    const response = await apiClient.post<ReceiveProjectResponse>(`${this.basePath}/${projectId}/receive`);
    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }
  }

  /**
   * 获取领取历史
   * @param params - 分页参数
   * @returns 领取历史数据
   */
  static async getReceiveHistory(params: ReceiveHistoryRequest): Promise<ReceiveHistoryData> {
    const response = await apiClient.get<ReceiveHistoryResponse>(`${this.basePath}/received`, {
      params: {
        current: params.current,
        size: params.size,
      },
    });

    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }

    return response.data.data;
  }

  /**
   * 获取标签列表
   * @returns 所有可用标签
   */
  static async getTags(): Promise<string[]> {
    try {
      const response = await apiClient.get<TagsResponse>('/api/v1/tags');

      if (response.data.error_msg) {
        throw new Error(response.data.error_msg);
      }

      return response.data.data || [];
    } catch (error) {
      console.warn('获取标签列表失败:', error);
      return [];
    }
  }

  /**
   * 获取项目列表
   * @param params - 分页和过滤参数
   * @returns 项目列表数据
   */
  static async getProjects(params: ListProjectsRequest): Promise<ProjectListData> {
    const requestParams: ApiRequestParams = {
      current: params.current,
      size: params.size,
    };

    if (params.tags && params.tags.length > 0) {
      requestParams.tags = params.tags;
    }

    const response = await apiClient.get<ProjectListResponse>(`${this.basePath}`, {
      params: requestParams,
      paramsSerializer: {
        indexes: null,
      },
    });

    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }

    return response.data.data;
  }

  /**
   * 获取我的项目列表
   * @param params - 分页和过滤参数
   * @returns 我的项目列表数据
   */
  static async getMyProjects(params: ListProjectsRequest): Promise<ProjectListData> {
    const requestParams: ApiRequestParams = {
      current: params.current,
      size: params.size,
    };

    if (params.tags && params.tags.length > 0) {
      requestParams.tags = params.tags;
    }

    const response = await apiClient.get<ProjectListResponse>(`${this.basePath}/mine`, {
      params: requestParams,
      paramsSerializer: {
        indexes: null,
      },
    });

    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }

    return response.data.data;
  }

  /**
   * 获取项目详情（带错误处理）
   * @param projectId - 项目ID
   * @returns 获取结果，包含成功状态、项目数据和错误信息
   */
  static async getProjectSafe(projectId: string): Promise<{
    success: boolean;
    data?: GetProjectResponseData;
    error?: string;
  }> {
    try {
      const data = await this.getProject(projectId);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取项目详情失败';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 创建项目（带错误处理）
   * @param projectData - 项目创建数据
   * @returns 创建结果，包含成功状态和错误信息
   */
  static async createProjectSafe(projectData: CreateProjectRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.createProject(projectData);
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建项目失败';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 更新项目（带错误处理）
   * @param projectId - 项目ID
   * @param projectData - 项目更新数据
   * @returns 更新结果，包含成功状态和错误信息
   */
  static async updateProjectSafe(
      projectId: string,
      projectData: UpdateProjectRequest,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.updateProject(projectId, projectData);
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新项目失败';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 删除项目（带错误处理）
   * @param projectId - 项目ID
   * @returns 删除结果，包含成功状态和错误信息
   */
  static async deleteProjectSafe(projectId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.deleteProject(projectId);
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除项目失败';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 领取项目内容（带错误处理）
   * @param projectId - 项目ID
   * @returns 领取结果，包含成功状态和错误信息
   */
  static async receiveProjectSafe(projectId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.receiveProject(projectId);
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '领取项目内容失败';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 获取领取历史（带错误处理）
   * @param params - 分页参数
   * @returns 领取历史结果，包含成功状态、数据和错误信息
   */
  static async getReceiveHistorySafe(params: ReceiveHistoryRequest): Promise<{
    success: boolean;
    data?: ReceiveHistoryData;
    error?: string;
  }> {
    try {
      const data = await this.getReceiveHistory(params);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取领取历史失败';
      return {
        success: false,
        data: {total: 0, results: []},
        error: errorMessage,
      };
    }
  }

  /**
   * 获取标签列表（带错误处理）
   * @returns 获取结果，包含标签数组和错误信息
   */
  static async getTagsSafe(): Promise<{
    success: boolean;
    tags: string[];
    error?: string;
  }> {
    try {
      const tags = await this.getTags();
      return {
        success: true,
        tags,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取标签失败';
      return {
        success: false,
        tags: [],
        error: errorMessage,
      };
    }
  }

  /**
   * 获取项目列表（带错误处理）
   * @param params - 分页和过滤参数
   * @returns 获取结果，包含成功状态、项目列表数据和错误信息
   */
  static async getProjectsSafe(params: ListProjectsRequest): Promise<{
    success: boolean;
    data?: ProjectListData;
    error?: string;
  }> {
    try {
      const data = await this.getProjects(params);
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

  /**
   * 获取我的项目列表（带错误处理）
   * @param params - 分页和过滤参数
   * @returns 获取结果，包含成功状态、我的项目列表数据和错误信息
   */
  static async getMyProjectsSafe(params: ListProjectsRequest): Promise<{
    success: boolean;
    data?: ProjectListData;
    error?: string;
  }> {
    try {
      const data = await this.getMyProjects(params);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取我的项目列表失败';
      return {
        success: false,
        data: {total: 0, results: []},
        error: errorMessage,
      };
    }
  }
}
