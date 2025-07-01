import {BaseService} from '../core/base.service';
import {CallbackRequest, UserInfoResponse} from './types';

/**
 * 认证服务
 * 处理OAuth登录和用户认证相关操作
 */
export class AuthService extends BaseService {
  /**
   * API基础路径
   */
  protected static readonly basePath = '/api/v1/oauth';

  /**
   * 获取OAuth登录URL
   * @returns 登录授权URL
   */
  static async getLoginURL(): Promise<string> {
    return this.get<string>('/login');
  }

  /**
   * 处理OAuth回调
   * @param params - 包含state和code的回调参数
   */
  static async handleCallback(params: CallbackRequest): Promise<void> {
    await this.post<null>('/callback', params);
  }

  /**
   * 获取当前用户信息
   * @returns 用户基本信息
   */
  static async getUserInfo(): Promise<UserInfoResponse['data']> {
    return this.get<UserInfoResponse['data']>('/user-info');
  }

  /**
   * 执行OAuth登录流程
   * @param redirectTo - 登录成功后重定向的页面路径
   */
  static async login(redirectTo?: string): Promise<void> {
    try {
      // 保存重定向信息到sessionStorage
      if (redirectTo) {
        sessionStorage.setItem('oauth_redirect_to', redirectTo);
      } else {
        sessionStorage.removeItem('oauth_redirect_to');
      }

      const loginURL = await this.getLoginURL();
      window.location.href = loginURL;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取登录URL失败';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * API登出请求
   */
  static async callLogoutAPI(): Promise<void> {
    return this.get('/logout');
  }

  /**
   * 执行完整的登出流程
   * @param redirectTo - 登出后重定向的页面路径
   */
  static async logout(redirectTo = '/'): Promise<void> {
    try {
      // 清除会话存储
      sessionStorage.removeItem('oauth_redirect_to');

      // 调用后端API
      await this.callLogoutAPI();

      // 添加登出标记
      const finalRedirect = redirectTo === '/login' ?
        '/login?logout=true' :
        redirectTo;

      // 重定向
      window.location.href = finalRedirect;
    } catch (error) {
      console.error('登出失败:', error instanceof Error ? error.message : '未知错误');

      // 出错时仍然重定向
      const finalRedirect = redirectTo === '/login' ?
        '/login?logout=true' :
        redirectTo;

      window.location.href = finalRedirect;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns 用户认证状态
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
