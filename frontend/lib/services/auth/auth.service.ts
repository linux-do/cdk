import { BaseService } from '../core/base.service';
import { CallbackRequest, UserInfoResponse } from './types';

/**
 * 认证服务
 * 处理OAuth登录和用户认证
 */
export class AuthService extends BaseService {
  /**
   * 基础路径
   */
  protected static basePath: string = '/api/v1/oauth';

  /**
   * 获取OAuth登录URL
   * @returns Promise<string> 返回登录URL
   */
  static async getLoginURL(): Promise<string> {
    return this.get<string>('/login');
  }

  /**
   * 处理OAuth回调
   * @param params 回调参数，包含state和code
   * @returns Promise<void>
   */
  static async handleCallback(params: CallbackRequest): Promise<void> {
    await this.post<null>('/callback', params);
  }

  /**
   * 获取当前用户信息
   * @returns Promise<BasicUserInfo> 返回用户信息
   */
  static async getUserInfo(): Promise<UserInfoResponse['data']> {
    // 确保请求带上Cookie，让后端能够从session中获取UserID
    return this.get<UserInfoResponse['data']>('/user-info');
  }

  /**
   * 执行OAuth登录流程
   * @param redirectTo 登录后重定向的页面路径
   * @returns Promise<void>
   */
  static async login(redirectTo?: string): Promise<void> {
    try {
      // 在跳转OAuth前，将重定向信息保存到sessionStorage
      if (redirectTo) {
        sessionStorage.setItem('oauth_redirect_to', redirectTo);
      } else {
        sessionStorage.removeItem('oauth_redirect_to');
      }
      
      const loginURL = await this.getLoginURL();
      // 跳转到OAuth认证页面
      window.location.href = loginURL;
    } catch (error) {
      console.error('获取登录URL失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns Promise<boolean> 返回是否已登录
   */
  static async checkAuthStatus(): Promise<boolean> {
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      return false;
    }
  }
} 