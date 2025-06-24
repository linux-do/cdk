import { useState, useEffect } from 'react'; 
import { DashboardService, DashboardResponse } from '@/lib/services/dashboard';

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
 * @param useMock - 是否使用模拟数据
 */
export function useDashboard(days: number, useMock = false): UseDashboardReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // 默认的空数据结构，防止undefined错误
  const defaultData: DashboardResponse = {
    userGrowth: [],
    activityData: [],
    projectTags: [],
    distributeModes: [],
    hotProjects: [],
    activeCreators: [],
    activeReceivers: [],
    applyStatus: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    summary: {
      totalUsers: 0,
      newUsers: 0,
      activeProjects: 0,
      totalProjects: 0,
      totalReceived: 0,
      recentReceived: 0,
      successRate: '0%',
    },
  };

  const fetchData = async (forceLoading = false) => {
    // 只有初次加载或强制刷新时才显示loading状态
    if (isInitialLoading || forceLoading) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      let newData: DashboardResponse;

      if (useMock) {
        // 开发环境使用模拟数据
        newData = DashboardService.getMockDataByDays(days);
      } else {
        // 生产环境使用真实API
        newData = await DashboardService.getAllDashboardData(days);
      }

      setData(newData);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // 首次加载完成后，设置为false
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, useMock]);

  return {
    data: data || defaultData,
    isLoading,
    isInitialLoading,
    error,
    lastUpdate,
    refresh: (forceLoading = false) => fetchData(forceLoading)
  };
}
