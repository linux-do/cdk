import {useState, useEffect, useCallback, useRef} from 'react';
import services from '@/lib/services';
import {BasicUserInfo} from '@/lib/services/core';
import {hasSessionCookie, clearSessionCookie} from '@/lib/utils/cookies';

/**
 * 认证状态接口定义
 * @interface AuthState
 */
interface AuthState {
  /** 用户是否已认证 */
  isAuthenticated: boolean;
  /** 用户信息对象 */
  user: BasicUserInfo | null;
  /** 认证过程是否加载中 */
  isLoading: boolean;
  /** 认证过程错误信息 */
  error: string | null;
}

/**
 * 认证Hook返回值接口定义
 * @interface UseAuthReturn
 * @extends AuthState
 */
interface UseAuthReturn extends AuthState {
  /** 执行登录操作 */
  login: (redirectTo?: string) => Promise<void>;
  /** 执行登出操作 */
  logout: () => void;
  /** 清除错误信息 */
  clearError: () => void;
}

// 全局请求缓存对象
const userInfoCache: {
  data: BasicUserInfo | null;
  timestamp: number;
  promise: Promise<BasicUserInfo> | null;
} = {
  data: null,
  timestamp: 0,
  promise: null,
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 10000; // 10秒

/**
 * 用户认证状态管理Hook
 *
 * 提供用户认证状态、用户信息及登录登出等操作
 * 使用请求缓存、防抖和请求合并优化性能
 *
 * @returns {UseAuthReturn} 认证状态和操作方法
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // 防止重复请求的标记
  const requestInProgress = useRef(false);

  /**
   * 检查用户认证状态
   * 实现了请求缓存、防抖和请求合并
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));

      // 无Cookie时快速返回未登录状态
      if (!hasSessionCookie()) {
        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      // 防止重复请求
      if (requestInProgress.current) {
        return;
      }

      // 使用缓存数据（如果缓存有效）
      const now = Date.now();
      if (userInfoCache.data && now - userInfoCache.timestamp < CACHE_EXPIRY) {
        setState({
          isAuthenticated: true,
          user: userInfoCache.data,
          isLoading: false,
          error: null,
        });
        return;
      }

      // 使用进行中的请求（请求合并）
      if (userInfoCache.promise) {
        try {
          const userInfo = await userInfoCache.promise;
          setState({
            isAuthenticated: true,
            user: userInfo,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          setState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : '获取用户信息失败',
          });
        }
        return;
      }

      // 标记请求开始
      requestInProgress.current = true;

      // 创建新请求并缓存Promise
      userInfoCache.promise = services.auth.getUserInfo();

      try {
        const userInfo = await userInfoCache.promise;

        // 更新缓存
        userInfoCache.data = userInfo;
        userInfoCache.timestamp = Date.now();

        setState({
          isAuthenticated: true,
          user: userInfo,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('获取用户信息失败:', error);

        // 清除缓存
        userInfoCache.data = null;
        userInfoCache.timestamp = 0;

        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : '获取用户信息失败',
        });
      } finally {
        // 重置请求状态
        requestInProgress.current = false;
        userInfoCache.promise = null;
      }
    } catch (error) {
      console.error('认证状态检查失败:', error);

      requestInProgress.current = false;
      userInfoCache.promise = null;

      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : '认证状态检查失败',
      });
    }
  }, []);

  /**
   * 执行登录操作
   * @param {string} [redirectTo] - 登录成功后重定向的URL
   */
  const login = useCallback(async (redirectTo?: string) => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));
      await services.auth.login(redirectTo);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '登录失败',
      }));
    }
  }, []);

  /**
   * 执行登出操作
   * 清除缓存和Cookie，重定向到登录页
   */
  const logout = useCallback(() => {
    // 清除缓存
    userInfoCache.data = null;
    userInfoCache.timestamp = 0;
    userInfoCache.promise = null;

    clearSessionCookie();
    setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
    window.location.href = '/login';
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setState((prev) => ({...prev, error: null}));
  }, []);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus();

    // 组件卸载时清理，防止内存泄漏
    return () => {
      requestInProgress.current = false;
    };
  }, [checkAuthStatus]);

  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  };
}
