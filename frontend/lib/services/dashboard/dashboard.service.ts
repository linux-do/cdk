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
      return response.data; 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取数据失败';
      throw new Error(errorMessage); 
    }
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
        { name: '1313', tag: '人工智能',  receive_count: 1 },
        { name: 'test', tag: '其他', receive_count: 1 },
        { name: '123', tag: '人工智能', receive_count: 1 },
        { name: '测试数据3', tag: '软件工具', receive_count: 1 },
        { name: '测试数据2', tag: '软件工具', receive_count: 1 },
      ],
      activeCreators: [
        { avatar: 'https://linux.do/user_avatar/linux.do/chenyme/48/156695_2.png', name: 'Chenyme', project_count: 13 },
        { avatar: 'https://linux.do/user_avatar/linux.do/chenyme/48/156695_2.png', name: 'Throttle', project_count: 2 },
        { avatar: 'https://linux.do/user_avatar/linux.do/neuroplexus/48/156695_2.png', name: 'Neuroplexus', project_count: 3 },
        { avatar: 'https://linux.do/user_avatar/linux.do/lurk/48/156695_2.png', name: 'lurk', project_count: 2 },
        { avatar: 'https://linux.do/user_avatar/linux.do/jiu/48/156695_2.png', name: 'JiuRanYa', project_count: 2 },
      ],
      activeReceivers: [
        { avatar: 'https://linux.do/user_avatar/linux.do/chenyme/48/156695_2.png', name: 'Chenyme', receive_count: 13 },
        { avatar: 'https://linux.do/user_avatar/linux.do/kevin/48/156695_2.png', name: 'kevin', receive_count: 1 },
        { avatar: 'https://linux.do/user_avatar/linux.do/lurk/48/156695_2.png', name: 'lurk', receive_count: 1 },
      ],
      applyStatus: {
        total: 23,
        pending: 5,
        approved: 15,
        rejected: 3,
      },
      summary: {
        total_users: 12,
        new_users: 12,
        active_projects: 22,
        total_projects: 23,
        total_received: 15,
        recent_received: 15,
        success_rate: '12.2%',
      },
    };
  }
}
