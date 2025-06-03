import {BaseService} from '../core/base.service';
import {CallbackRequest, UserInfoResponse} from './types';
import {clearSessionCookie} from '@/lib/utils/cookies';

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
   * API登出请求
   * 注意：此方法只负责API调用，不处理Cookie或重定向
   * @returns Promise<void>
   */
  static async callLogoutAPI(): Promise<void> {
    return this.get('/logout');
  }

  /**
   * 执行完整的登出流程
   * 包括调用API、清除Cookie和重定向
   * @param redirectTo 登出后重定向的页面路径，默认为首页
   * @returns Promise<void>
   */
  static async logout(redirectTo: string = '/'): Promise<void> {
    try {
      // 清除可能存在的本地存储的用户信息
      sessionStorage.removeItem('oauth_redirect_to');

      // 先尝试调用后端API
      try {
        await this.callLogoutAPI();
      } catch (error) {
        console.warn('后端登出API调用失败，继续前端登出流程', error);
      }

      // 无论API调用成功与否，都清除前端Cookie
      clearSessionCookie();

      // 如果重定向到登录页面，添加登出标记
      if (redirectTo === '/login') {
        redirectTo = '/login?logout=true';
      }

      // 重定向到指定页面或首页
      window.location.href = redirectTo;
    } catch (error) {
      console.error('登出失败:', error);

      // 清除Cookie
      clearSessionCookie();

      // 如果重定向到登录页面，添加登出标记
      if (redirectTo === '/login') {
        redirectTo = '/login?logout=true';
      }

      window.location.href = redirectTo;
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
    } catch {
      return false;
    }
  }
}
