import {ApiResponse, BasicUserInfo} from '../core/types';

/**
 * OAuth登录URL响应
 */
export type GetLoginURLResponse = ApiResponse<string>;

/**
 * OAuth回调请求参数
 */
export interface CallbackRequest {
  /** OAuth状态码 */
  state: string;
  /** 授权码 */
  code: string;
}

/**
 * OAuth回调响应
 */
export type CallbackResponse = ApiResponse<null>;

/**
 * 用户信息响应
 */
export type UserInfoResponse = ApiResponse<BasicUserInfo>;
