/**
 * API基础响应格式
 */
export interface ApiResponse<T = unknown> {
  /** 错误信息，成功时为空字符串 */
  error_msg: string;
  /** 响应数据 */
  data: T;
}

/**
 * 分页数据响应格式
 */
export interface PaginatedResponse<T = unknown> {
  /** 总数量 */
  total: number;
  /** 结果列表 */
  results: T[];
}

/**
 * API错误响应
 */
export interface ApiError {
  /** 错误信息 */
  error_msg: string;
}

/**
 * 用户信任等级枚举
 */
/* eslint-disable no-unused-vars */
export enum TrustLevel {
  /** 新用户 */
  NEW_USER = 0,
  /** 基础用户 */
  BASIC_USER = 1,
  /** 普通用户 */
  USER = 2,
  /** 活跃用户 */
  ACTIVE_USER = 3,
  /** 领导者 */
  LEADER = 4,
}
/* eslint-enable no-unused-vars */

/**
 * 基础用户信息
 */
export interface BasicUserInfo {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 信任等级 */
  trust_level: TrustLevel;
  /** 头像URL */
  avatar_url: string;
}
