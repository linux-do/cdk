import {TrustLevel} from '../core/types';

/**
 * 项目分发类型
 */
/* eslint-disable no-unused-vars */
export enum DistributionType {
  /** 一码一用 */
  ONE_FOR_EACH = 0,
  /** 邀请制 */
  INVITE = 1,
}

/**
 * 项目基础信息
 */
export interface Project {
  /** 项目ID */
  id: string;
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 分发类型 */
  distribution_type: DistributionType;
  /** 总物品数量 */
  total_items: number;
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
  /** 最低信任等级 */
  minimum_trust_level: TrustLevel;
  /** 是否允许同一IP */
  allow_same_ip: boolean;
  /** 风险等级 */
  risk_level: number;
  /** 创建者ID */
  creator_id: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 创建项目请求参数
 */
export interface CreateProjectRequest {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string;
  /** 项目标签 */
  project_tags?: string[];
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
  /** 最低信任等级 */
  minimum_trust_level: TrustLevel;
  /** 是否允许同一IP */
  allow_same_ip?: boolean;
  /** 风险等级 */
  risk_level?: number;
  /** 分发类型 */
  distribution_type: DistributionType;
  /** 项目物品列表 */
  project_items: string[];
}

/**
 * 更新项目请求参数
 */
export interface UpdateProjectRequest {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string;
  /** 项目标签 */
  project_tags?: string[];
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
  /** 最低信任等级 */
  minimum_trust_level: TrustLevel;
  /** 是否允许同一IP */
  allow_same_ip?: boolean;
  /** 风险等级 */
  risk_level?: number;
  /** 追加的项目物品列表 */
  project_items?: string[];
}

/**
 * 后端标准响应结构
 */
export interface BackendResponse<T = unknown> {
  /** 错误信息，空字符串表示无错误 */
  error_msg: string;
  /** 响应数据 */
  data: T;
}

/**
 * 创建项目成功时的响应数据类型
 */
export interface CreateProjectResponseData {
  /** 项目ID */
  projectId: string;
}

/**
 * 项目操作成功时的响应数据类型 (通常为null)
 */
export type ProjectOperationData = null;

/**
 * 创建项目API响应类型
 */
export type CreateProjectResponse = BackendResponse<CreateProjectResponseData>;

/**
 * 项目API响应类型
 */
export type ProjectResponse = BackendResponse<ProjectOperationData>;

/**
 * 标签列表响应类型
 */
export type TagsResponse = BackendResponse<string[]>;

/**
 * 领取历史记录项
 */
export interface ReceiveHistoryItem {
  /** 项目ID */
  project_id: string;
  /** 项目名称 */
  project_name: string;
  /** 项目创建者用户名 */
  project_creator: string;
  /** 项目创建者昵称 */
  project_creator_nickname: string;
  /** 领取的内容 */
  content: string;
  /** 领取时间 */
  received_at: string | null;
}

/**
 * 领取历史数据
 */
export interface ReceiveHistoryData {
  /** 总数量 */
  total: number;
  /** 结果列表 */
  results: ReceiveHistoryItem[];
}

/**
 * 领取历史请求参数
 */
export interface ReceiveHistoryRequest {
  /** 当前页码 */
  current: number;
  /** 每页数量 */
  size: number;
}

/**
 * 领取历史响应类型
 */
export type ReceiveHistoryResponse = BackendResponse<ReceiveHistoryData>;

/**
 * 领取项目成功时的响应数据类型
 */
export interface ReceiveProjectData {
  /** 领取的内容 */
  itemContent: string;
}

/**
 * 领取项目响应类型
 */
export type ReceiveProjectResponse = BackendResponse<ReceiveProjectData>;

/**
 * 获取项目详情响应数据
 */
export interface GetProjectResponseData extends Project {
  /** 创建者用户名 */
  creator_username: string;
  /** 创建者昵称 */
  creator_nickname: string;
  /** 项目标签列表 */
  tags: string[] | null;
  /** 可领取数量 */
  available_items_count: number;
  /** 当前用户是否已领取 */
  is_received: boolean;
  /** 已领取的内容 */
  received_content: string;
}

/**
 * 获取项目详情响应类型
 */
export type GetProjectResponse = BackendResponse<GetProjectResponseData>;

/**
 * 项目列表请求参数
 */
export interface ListProjectsRequest {
  /** 当前页码 */
  current: number;
  /** 每页数量 */
  size: number;
  /** 标签过滤 */
  tags?: string[];
}

/**
 * API请求参数类型
 */
export interface ApiRequestParams {
  /** 当前页码 */
  current: number;
  /** 每页数量 */
  size: number;
  /** 标签数组（可选） */
  tags?: string[];
}

/**
 * 项目列表项
 */
export interface ProjectListItem {
  /** 项目ID */
  id: string;
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 分发类型 */
  distribution_type: DistributionType;
  /** 总物品数量 */
  total_items: number;
  /** 开始时间 */
  start_time: string;
  /** 结束时间 */
  end_time: string;
  /** 最低信任等级 */
  minimum_trust_level: TrustLevel;
  /** 是否允许同一IP */
  allow_same_ip: boolean;
  /** 风险等级 */
  risk_level: number;
  /** 项目标签列表 */
  tags: string[] | null;
  /** 创建时间 */
  created_at: string;
}

/**
 * 项目列表数据
 */
export interface ProjectListData {
  /** 总数量 */
  total: number;
  /** 结果列表 */
  results: ProjectListItem[];
}

/**
 * 项目列表响应类型
 */
export type ProjectListResponse = BackendResponse<ProjectListData>;
