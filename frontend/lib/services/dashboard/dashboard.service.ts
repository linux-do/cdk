import apiClient from '../core/api-client';
import {BaseService} from '../core/base.service';
import {
  DashboardResponse,
  DashboardApiResponse,
  HotProjectData,
  RawDashboardData,
  UserGrowthData,
  ActivityData,
  ProjectTagsData,
  DistributeModeData,
  ActiveCreatorData,
  ActiveReceiverData,
  StatsSummary,
} from './types';

/**
 * 仪表盘服务
 * 处理仪表盘数据获取和统计信息展示
 */
export class DashboardService extends BaseService {
  /**
   * API基础路径
   */
  protected static readonly basePath = '/api/v1/dashboard/stats';

  /**
   * 获取所有仪表盘数据
   * @param days - 天数范围 (1-30天)
   * @returns 仪表盘数据
   */
  static async getAllDashboardData(days: number): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardApiResponse>(
        `${this.basePath}/all`,
        {
          params: {days: Math.max(1, Math.min(30, days))},
        },
    );

    if (response.data.error_msg) {
      throw new Error(response.data.error_msg);
    }

    return this.normalizeData(response.data.data);
  }

  /**
   * 获取仪表盘数据（带错误处理）
   * @param days - 天数范围
   * @returns 获取结果，包含成功状态、数据和错误信息
   */
  static async getAllDashboardDataSafe(days: number): Promise<{
    success: boolean;
    data?: DashboardResponse;
    error?: string;
  }> {
    try {
      const data = await this.getAllDashboardData(days);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仪表盘数据失败';
      return {
        success: false,
        data: this.getDefaultData(),
        error: errorMessage,
      };
    }
  }

  /**
   * 标准化后端返回的数据格式
   * @param rawData - 后端原始数据
   * @returns 标准化后的数据
   */
  private static normalizeData(rawData: RawDashboardData): DashboardResponse {
    const parseJsonField = <T>(field: unknown, defaultValue: T): T => {
      if (!field) return defaultValue;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field) as T;
        } catch {
          console.warn(`Failed to parse field:`, field);
          return defaultValue;
        }
      }
      return field as T;
    };

    // 解析各个JSON字段
    const userGrowth = parseJsonField<UserGrowthData[]>(rawData.userGrowth, []);
    const activityData = parseJsonField<ActivityData[]>(rawData.activityData, []);
    const projectTags = parseJsonField<ProjectTagsData[]>(rawData.projectTags, []);
    const distributeModes = parseJsonField<DistributeModeData[]>(rawData.distributeModes, []);
    const hotProjects = parseJsonField<HotProjectData[]>(rawData.hotProjects, []);
    const activeCreators = parseJsonField<ActiveCreatorData[]>(rawData.activeCreators, []);
    const activeReceivers = parseJsonField<ActiveReceiverData[]>(rawData.activeReceivers, []);
    const summary = parseJsonField<StatsSummary>(rawData.summary, {
      totalUsers: 0,
      newUsers: 0,
      totalProjects: 0,
      totalReceived: 0,
      recentReceived: 0,
    });

    // 处理热门项目数据，转换tags数组为单个tag字符串用于显示
    const normalizedHotProjects: HotProjectData[] = hotProjects.map((project) => ({
      name: project.name,
      tags: Array.isArray(project.tags) ? project.tags : [], // 保持原始tags数组
      receiveCount: project.receiveCount,
    }));

    return {
      userGrowth,
      activityData,
      projectTags,
      distributeModes,
      hotProjects: normalizedHotProjects,
      activeCreators,
      activeReceivers,
      summary,
    };
  }

  /**
   * 获取默认数据结构
   * @returns 默认的仪表盘数据
   */
  private static getDefaultData(): DashboardResponse {
    return {
      userGrowth: [],
      activityData: [],
      projectTags: [],
      distributeModes: [],
      hotProjects: [],
      activeCreators: [],
      activeReceivers: [],
      summary: {
        totalUsers: 0,
        newUsers: 0,
        totalProjects: 0,
        totalReceived: 0,
        recentReceived: 0,
      },
    };
  }
}
