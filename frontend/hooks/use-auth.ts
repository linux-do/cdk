import {useState, useEffect, useCallback, useRef} from 'react';
import services from '@/lib/services';
import {BasicUserInfo} from '@/lib/services/core';

/**
 * 认证状态
 */
interface AuthState {
  /** 用户是否已认证 */
  isAuthenticated: boolean;
  /** 用户信息 */
  user: BasicUserInfo | null;
  /** 认证过程加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 认证Hook返回值
 */
interface UseAuthReturn extends AuthState {
  /** 执行登录 */
  login: (redirectTo?: string) => Promise<void>;
  /** 执行登出 */
  logout: (redirectTo?: string) => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
  /** 检查认证状态 */
  checkAuthStatus: () => Promise<void>;
}

/** 缓存过期时间（毫秒） */
const CACHE_EXPIRY = 10000; // 10秒

/** 用户信息缓存 */
const userInfoCache: {
  data: BasicUserInfo | null;
  timestamp: number;
  promise: Promise<BasicUserInfo> | null;
} = {
  data: null,
  timestamp: 0,
  promise: null,
};

/**
 * 用户认证状态管理Hook
 *
 * 使用请求缓存、防抖和请求合并优化性能
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // 防止重复请求标记
  const requestInProgress = useRef(false);

  /**
   * 检查用户认证状态
   * 实现请求缓存、防抖和请求合并
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setState((prev) => ({...prev, isLoading: true, error: null}));

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
   * @param redirectTo - 登录成功后重定向的URL
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
   * @param redirectTo - 登出后重定向的URL
   */
  const logout = useCallback(async (redirectTo = '/login') => {
    try {
      setState((prev) => ({...prev, isLoading: true}));

      // 清除缓存
      userInfoCache.data = null;
      userInfoCache.timestamp = 0;
      userInfoCache.promise = null;

      // 调用登出方法（会处理API调用和重定向）
      await services.auth.logout(redirectTo);

      // 更新状态（页面可能已重定向）
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // 这段代码通常不会执行，因为logout会在出错时也执行重定向
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '登出失败',
      }));
    }
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
    checkAuthStatus,
  };
}
