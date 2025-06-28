import {useState, useEffect, useCallback, useMemo} from 'react';
import {DashboardService, DashboardResponse} from '@/lib/services/dashboard';

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
   * 获取数据的核心方法
   * @param forceLoading - 是否强制显示加载状态
   */
  const fetchData = useCallback(async (forceLoading = false) => {
    // 只有初次加载或强制刷新时才显示loading状态
    if (isInitialLoading || forceLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const newData = await DashboardService.getAllDashboardData(days);
      setData(newData);
      setLastUpdate(new Date().toLocaleTimeString());

      // 首次加载完成后，设置为false
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取仪表盘数据失败';
      setError(new Error(errorMessage));

      // 错误时使用默认数据，避免页面崩溃
      if (!data) {
        setData(defaultData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [days, isInitialLoading, data, defaultData]);

  // 当天数改变时重新获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: data || defaultData,
    isLoading,
    isInitialLoading,
    error,
    lastUpdate,
    refresh: fetchData,
  };
}
