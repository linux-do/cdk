import { DistributionType } from '../project/types';

/**
 * 时间序列数据
 */
export interface TimeSeriesData {
  date: string;
  value: number;
}

/**
 * 用户增长数据
 */
export interface UserGrowthData extends TimeSeriesData {
  /** 日期，格式如 "5/27" */
  date: string;
  /** 新增用户数量 */
  value: number;
}

/**
 * 活动数据
 */
export interface ActivityData extends TimeSeriesData {
  /** 日期，格式如 "5/27" */
  date: string;
  /** 活动数量 */
  value: number;
}

/**
 * 统计图表数据
 */
export interface ChartDataItem {
  name: string | DistributionType;
  value: number;
}

/**
 * 项目分类数据
 */
export interface ProjectTagsData extends ChartDataItem {
  /** 分类名称 */
  name: string;
  /** 项目数量 */
  value: number;
}

/**
 * 分发模式数据
 */
export interface DistributeModeData extends ChartDataItem {
  /** 分发模式名称 */
  name: DistributionType;
  /** 使用该模式的项目数量 */
  value: number;
}

/**
 * 热门项目数据
 */
export interface HotProjectData {
  /** 项目名称 */
  name: string;
  /** 项目标签 */
  tag:  string;
  /** 领取数 */
  receiveCount: number;
  /** 项目ID */
  id?: string;
  /** 项目创建者 */
  creator?: string;
}

/**
 * 用户活跃度数据
 */
export interface UserActivityData {
  /** 用户名称 */
  name: string;
  /** 用户头像 */
  avatar?: string;
}

/**
 * 活跃创建者数据
 */
export interface ActiveCreatorData extends UserActivityData {
  /** 创建的项目数量 */
  projectCount: number;
}

/**
 * 活跃领取者数据
 */
export interface ActiveReceiverData extends UserActivityData {
  /** 领取次数 */
  receiveCount: number;
}

/**
 * 热门标签数据
 */
export interface HotTagData {
  /** 标签名称 */
  name: string;
  /** 使用该标签的项目数量 */
  count: number;
}


/**
 * 申请状态数据
 */
export interface ApplyStatusData {
  /** 总申请数 */
  total: number;
  /** 待处理申请数 */
  pending: number;
  /** 已通过申请数 */
  approved: number;
  /** 已拒绝申请数 */
  rejected: number;
}

/**
 * 统计数据
 */
export interface StatsSummary {
  /** 总用户数 */
  totalUsers: number;
  /** 新增用户数 */
  newUsers: number;
  /** 活跃项目数 */
  activeProjects: number;
  /** 总项目数 */
  totalProjects: number;
  /** 总领取数 */
  totalReceived: number;
  /** 最近领取数 */
  recentReceived: number;
  /** 成功率 */
  successRate: string;
}

/**
 * 仪表盘数据 
 */
export interface DashboardResponse {
  /** 用户增长趋势数据 */
  userGrowth: UserGrowthData[];
  /** 活动趋势数据 */
  activityData: ActivityData[];
  /** 项目标签统计 */
    projectTags: ProjectTagsData[];
  /** 分发模式统计 */
  distributeModes: DistributeModeData[];
  /** 热门项目排行 */
  hotProjects: HotProjectData[];
  /** 活跃创建者排行 */
  activeCreators: ActiveCreatorData[];
  /** 活跃领取者排行 */
  activeReceivers: ActiveReceiverData[];
  /** 申请状态统计 */
  applyStatus: ApplyStatusData;
  /** 统计概览 */
  summary: StatsSummary;
}

