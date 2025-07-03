import {useState, useEffect, useCallback, useMemo} from 'react';
import {DashboardService, DashboardResponse} from '@/lib/services/dashboard';

/**
 * 缓存数据结构
 */
interface CachedData {
  data: DashboardResponse;
  timestamp: number;
  lastUpdate: string;
}

/**
 * 仪表盘数据hook返回类型
 */
interface UseDashboardReturn {
  data: DashboardResponse;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: Error | null;
  lastUpdate: string;
  refresh: (forceLoading?: boolean) => Promise<void>;
  isCached: boolean;
}

// 全局数据缓存 - 所有组件实例共享
const dataCache = new Map<number, CachedData>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存过期时间

/**
 * 检查缓存是否有效
 * @param cachedData - 缓存的数据
 * @returns 是否有效
 */
function isCacheValid(cachedData: CachedData): boolean {
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
}

/**
 * 仪表盘数据hook
 * @param days - 天数范围
 */
export function useDashboard(days: number): UseDashboardReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isCached, setIsCached] = useState<boolean>(false);

  const defaultData: DashboardResponse = useMemo(() => ({
    userGrowth: [],
    activityData: [],
    projectTags: [],
    distributeModes: [],
    hotProjects: [],
    activeCreators: [],
    activeReceivers: [],
    summary: {
      totalUsers: 0,
      newUsers: 0,
      totalProjects: 0,
      totalReceived: 0,
      recentReceived: 0,
    },
  }), []);

  /**
   * 从缓存获取数据
   * @param days - 天数
   * @returns 缓存的数据或null
   */
  const getCachedData = useCallback((days: number): CachedData | null => {
    const cached = dataCache.get(days);
    if (cached && isCacheValid(cached)) {
      return cached;
    }
    // 如果缓存过期，删除它
    if (cached) {
      dataCache.delete(days);
    }
    return null;
  }, []);

  /**
   * 缓存数据
   * @param days - 天数
   * @param data - 数据
   * @param lastUpdate - 最后更新时间
   */
  const setCachedData = useCallback((days: number, data: DashboardResponse, lastUpdate: string) => {
    dataCache.set(days, {
      data,
      timestamp: Date.now(),
      lastUpdate,
    });
  }, []);

  /**
   * 获取数据的核心方法
   * @param forceLoading - 是否强制显示加载状态
   * @param forceRefresh - 是否强制刷新（忽略缓存）
   */
  const fetchData = useCallback(async (forceLoading = false, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedData(days);
      if (cached) {
        setData(cached.data);
        setLastUpdate(cached.lastUpdate);
        setIsCached(true);
        setIsLoading(false);
        setIsInitialLoading(false);
        setError(null);
        return;
      }
    }

    if (isInitialLoading || forceLoading) {
      setIsLoading(true);
    }
    setError(null);
    setIsCached(false);

    try {
      const newData = await DashboardService.getAllDashboardData(days);
      const updateTime = new Date().toLocaleTimeString();

      setCachedData(days, newData, updateTime);

      setData(newData);
      setLastUpdate(updateTime);

      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取仪表盘数据失败';
      setError(new Error(errorMessage));

      setData((prevData) => prevData || defaultData);
    } finally {
      setIsLoading(false);
    }
  }, [days, isInitialLoading, defaultData, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async (forceLoading = false) => {
    await fetchData(forceLoading, true);
  }, [fetchData]);

  return {
    data: data || defaultData,
    isLoading,
    isInitialLoading,
    error,
    lastUpdate,
    refresh,
    isCached,
  };
}
