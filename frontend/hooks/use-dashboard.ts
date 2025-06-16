import { useState, useEffect } from 'react'; 
import { DashboardService, DashboardResponse } from '@/lib/services/dashboard';

/**
 * 仪表盘数据hook
 * @param days - 天数范围
 * @param useMock - 是否使用模拟数据
 */
export function useDashboard(days: number, useMock = false) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: DashboardResponse;

      if (useMock) {
        // 开发环境使用模拟数据
        data = DashboardService.getMockDataByDays(days);
      } else {
        // 生产环境使用真实API
        data = await DashboardService.getAllDashboardData(days);
      }

      setData(data);
      setLastUpdate(new Date().toLocaleTimeString());
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
    data,
    isLoading,
    error,
    lastUpdate,
    refresh: fetchData
  };
}
