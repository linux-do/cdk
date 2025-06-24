import apiClient from '../core/api-client';
import { DistributionType } from '../project/types';
import { BaseService } from '../core/base.service';
import {
  DashboardResponse
} from './types';

/**
 * 仪表盘服务
 */
export class DashboardService extends BaseService {
  /**
   * API路径
   */
  protected static override basePath = '/api/v1/dashboard/stats';

  /**
   * 获取所有仪表盘数据
   * @param days - 天数范围
   */
  static async getAllDashboardData(days: number): Promise<DashboardResponse> {
    try {
      const response = await apiClient.get(`${this.basePath}/all?days=${days}`);
      // 检查后端返回的错误消息
      if (response.data.error_msg) {
        throw new Error(response.data.error_msg);
      }
      
      // 处理后端可能返回的字符串字段，确保正确解析
      const data = response.data.data || response.data;
      const normalizedData = this.normalizeData(data, days);
      
      return normalizedData; 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取数据失败';
      throw new Error(errorMessage); 
    }
  }

  /**
   * 标准化数据格式，处理可能的字符串字段
   * @param data - 原始数据
   * @param days - 天数范围，用于补全时间序列数据
   */
  private static normalizeData(data: any, days: number): DashboardResponse {
    const normalized: any = {};
    
    const jsonFields = ['userGrowth', 'activityData', 'projectTags', 'distributeModes', 'hotProjects', 'activeCreators', 'activeReceivers', 'summary', 'applyStatus'];
    
    for (const field of jsonFields) {
      if (data[field]) {
        if (typeof data[field] === 'string') {
          try {
            normalized[field] = JSON.parse(data[field]);
          } catch (e) {
            console.warn(`Failed to parse ${field}:`, data[field]);
            normalized[field] = field === 'summary' ? {} : [];
          }
        } else {
          normalized[field] = data[field];
        }
      } else {
        normalized[field] = field === 'summary' ? {} : [];
      }
    }
    return normalized as DashboardResponse;
  }

  /**
   * 获取模拟数据
   */
  static getMockDataByDays(days: number): DashboardResponse {
    const baseData = this.getMockData();
        
    // 图表模拟变化
    const userGrowth = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userGrowth.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 10)
      });
    }
        
    return {
      ...baseData,
      userGrowth: userGrowth.slice(-Math.min(days, 10))
    };
  }

  /**
   * 获取模拟数据（仅用于开发）
   */
  static getMockData(): DashboardResponse {
    return {
      userGrowth: [
        { date: '5月27日', value: 0 },
        { date: '5月28日', value: 1 },
        { date: '5月29日', value: 2 },
        { date: '5月30日', value: 6 },
        { date: '5月31日', value: 4 },
        { date: '6月1日', value: 1 },
        { date: '6月2日', value: 1 },
        { date: '6月3日', value: 1 },
        { date: '6月4日', value: 1 },
        { date: '6月5日', value: 2 },
        { date: '6月6日', value: 1 },
        { date: '6月7日', value: 1 },
        { date: '6月8日', value: 1 },
        { date: '6月9日', value: 1 },
      ],
      activityData: [
        { date: '5月28日', value: 12 },
        { date: '5月29日', value: 12 },
        { date: '5月30日', value: 5 },
        { date: '5月31日', value: 2 },
        { date: '6月1日', value: 1 },
        { date: '6月2日', value: 12 },
        { date: '6月3日', value: 1 },
        { date: '6月4日', value: 3 },
        { date: '6月5日', value: 12 },
        { date: '6月6日', value: 4 },
        { date: '6月7日', value: 1 },
        { date: '6月8日', value: 1 },
        { date: '6月9日', value: 6 },
      ],
      projectTags: [
          { name: '人工', value: 8 },
          { name: '软件具', value: 6 },
          { name: '游娱乐', value: 3 },
          { name: '资分享', value: 2 },
          { name: '其', value: 1 },
        ],
      distributeModes: [
        { name: DistributionType.ONE_FOR_EACH, value: 4 },
        { name: DistributionType.INVITE, value: 8 },
      ],
      hotProjects: [
        { name: '1313', tag: '人工智能',  receiveCount: 1 },
        { name: 'test', tag: '其他', receiveCount: 1 },
        { name: '123', tag: '人工智能', receiveCount: 1 },
        { name: '测试数据3', tag: '软件工具', receiveCount: 1 },
        { name: '测试数据2', tag: '软件工具', receiveCount: 1 },
      ],
      activeCreators: [
        { avatar: 'https://linux.do/user_avatar/linux.do/chenyme/48/156695_2.png', name: 'Chenyme', projectCount: 13 },
        { avatar: 'https://linux.do/user_avatar/linux.do/chenyme/48/156695_2.png', name: 'Throttle', projectCount: 2 },
        { avatar: 'https://linux.do/user_avatar/linux.do/neuroplexus/48/156695_2.png', name: 'Neuroplexus', projectCount: 3 },
        { avatar: 'https://linux.do/user_avatar/linux.do/lurk/48/156695_2.png', name: 'lurk', projectCount: 2 },
        { avatar: 'https://linux.do/user_avatar/linux.do/jiu/48/156695_2.png', name: 'JiuRanYa', projectCount: 2 },
      ],
      activeReceivers: [
        { avatar: 'https://linux.do/user_avatar/linux.do/chenyme/48/156695_2.png', name: 'Chenyme', receiveCount: 13 },
        { avatar: 'https://linux.do/user_avatar/linux.do/kevin/48/156695_2.png', name: 'kevin', receiveCount: 1 },
        { avatar: 'https://linux.do/user_avatar/linux.do/lurk/48/156695_2.png', name: 'lurk', receiveCount: 1 },
      ],
      applyStatus: {
        total: 23,
        pending: 5,
        approved: 15,
        rejected: 3,
      },
      summary: {
        totalUsers: 12,
        newUsers: 12,
        activeProjects: 22,
        totalProjects: 23,
        totalReceived: 15,
        recentReceived: 15,
        successRate: '12.2%',
      },
    };
  }
}
