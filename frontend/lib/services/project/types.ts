import {ApiResponse, TrustLevel} from '../core/types';

/**
 * 项目分发类型
 */
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
 * 项目API响应类型
 */
export type ProjectResponse = ApiResponse<null>;

/**
 * 项目列表响应类型 (预留，后续可能需要)
 */
export type ProjectListResponse = ApiResponse<Project[]>;

/**
 * 项目详情响应类型 (预留，后续可能需要)
 */
export type ProjectDetailResponse = ApiResponse<Project>; 