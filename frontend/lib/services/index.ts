import {AuthService} from './auth/index';
import {ProjectService} from './project/index';
import {DashboardService} from './dashboard/index';

/**
 * 服务层统一入口
 */
const services = {
  /**
   * 认证服务
   */
  auth: AuthService,

  /**
   * 项目服务
   */
  project: ProjectService,

  /**
   * 仪表盘服务
   */
  dashboard: DashboardService,
};

export default services;
