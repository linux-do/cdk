import {BaseService} from '../core/base.service';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
} from './types';

/**
 * 项目服务
 * 处理项目的创建、更新、删除等操作
 */
export class ProjectService extends BaseService {
  /**
   * API基础路径
   */
  protected static readonly basePath = '/api/v1/project';

  /**
   * 创建项目
   * @param projectData - 项目创建数据
   * @returns 创建结果
   */
  static async createProject(projectData: CreateProjectRequest): Promise<void> {
    await this.post<null>('', projectData);
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
    await this.put<null>(`/${projectId}`, projectData);
  }

  /**
   * 删除项目
   * @param projectId - 项目ID
   * @returns 删除结果
   */
  static async deleteProject(projectId: string): Promise<void> {
    await this.delete<null>(`/${projectId}`);
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
      console.error('创建项目失败:', errorMessage);
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
      console.error('更新项目失败:', errorMessage);
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
      console.error('删除项目失败:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
} 