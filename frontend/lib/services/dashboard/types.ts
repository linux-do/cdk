import {DistributionType} from '../project/types';
import {ApiResponse} from '../core/types';
import {ReactNode} from 'react';
import {NameType, ValueType} from 'recharts/types/component/DefaultTooltipContent';

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
  date: string;
  value: number;
}

/**
 * 活动数据
 */
export interface ActivityData extends TimeSeriesData {
  date: string;
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
  name: string;
  value: number;
}

/**
 * 分发模式数据
 */
export interface DistributeModeData extends ChartDataItem {
  name: DistributionType;
  value: number;
}

/**
 * 热门项目数据
 */
export interface HotProjectData {
  name: string;
  tags: string[]; // 后端返回的是标签数组
  receiveCount: number;
}

/**
 * 用户活跃度数据
 */
export interface UserActivityData {
  name: string;
  avatar?: string;
}

/**
 * 活跃创建者数据
 */
export interface ActiveCreatorData {
  avatar: string | null;
  name: string;
  projectCount: number;
}

/**
 * 活跃领取者数据
 */
export interface ActiveReceiverData {
  avatar: string | null;
  name: string;
  receiveCount: number;
}

/**
 * 热门标签数据
 */
export interface HotTagData {
  name: string;
  count: number;
}

/**
 * 统计数据
 */
export interface StatsSummary {
  totalUsers: number;
  newUsers: number;
  totalProjects: number;
  totalReceived: number;
  recentReceived: number;
}

/**
 * 后端原始数据结构
 */
export interface RawDashboardData {
  userGrowth: string | UserGrowthData[];
  activityData: string | ActivityData[];
  projectTags: string | ProjectTagsData[];
  distributeModes: string | DistributeModeData[];
  hotProjects: string | HotProjectData[];
  activeCreators: string | ActiveCreatorData[];
  activeReceivers: string | ActiveReceiverData[];
  summary: string | StatsSummary;
  [key: string]: unknown;
}

/**
 * 仪表盘数据响应
 */
export interface DashboardResponse {
  userGrowth: UserGrowthData[];
  activityData: ActivityData[];
  projectTags: ProjectTagsData[];
  distributeModes: DistributeModeData[];
  hotProjects: HotProjectData[];
  activeCreators: ActiveCreatorData[];
  activeReceivers: ActiveReceiverData[];
  summary: StatsSummary;
}

/**
 * 后端API响应类型
 */
export type DashboardApiResponse = ApiResponse<RawDashboardData>;

// ==================== 组件相关类型定义 ====================

/**
 * 统计卡片组件属性
 */
export interface StatCardProps {
  title: string;
  value?: number | string;
  icon: ReactNode;
  desc?: string;
  descColor?: string;
}

/**
 * 列表项数据类型（支持所有列表类型）
 */
export type ListItemData = HotProjectData | ActiveCreatorData | ActiveReceiverData;

/**
 * 卡片列表组件属性
 */
export interface CardListProps {
  title: string;
  iconBg: string;
  icon: ReactNode;
  list: ListItemData[];
  type: 'project' | 'creator' | 'receiver';
}

/**
 * 标签展示组件属性
 */
export interface TagsDisplayProps {
  title: string;
  iconBg: string;
  tags?: {name: string; count: number}[];
  icon?: ReactNode;
}

// ==================== 图表组件相关类型定义 ====================

/**
 * 图表容器组件属性
 */
export interface ChartContainerProps {
  title: string;
  icon?: ReactNode;
  iconBg?: string;
  isLoading: boolean;
  children: ReactNode;
}

/**
 * 用户增长图表组件属性
 */
export interface UserGrowthChartProps {
  data?: UserGrowthData[];
  isLoading: boolean;
  icon?: ReactNode;
  range?: number;
}

/**
 * 活动趋势图表组件属性
 */
export interface ActivityChartProps {
  data?: ActivityData[];
  isLoading: boolean;
  icon?: ReactNode;
  range?: number;
}

/**
 * 项目分类图表组件属性
 */
export interface CategoryChartProps {
  data?: ProjectTagsData[];
  isLoading: boolean;
  icon?: ReactNode;
}

/**
 * 分发模式图表组件属性
 */
export interface DistributeModeChartProps {
  data?: DistributeModeData[];
  isLoading: boolean;
  icon?: ReactNode;
}

/**
 * 自定义工具提示属性
 */
export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: ValueType;
    name?: NameType;
    dataKey?: string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  labelFormatter?: (label: string, payload?: Record<string, unknown>[]) => ReactNode;
}

