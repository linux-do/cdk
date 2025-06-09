'use client';

import {useState, useEffect} from 'react';
import {DataChart} from './DataChart';
import {DataTable} from './DataTable';
import {Separator} from '@/components/ui/separator';
import {toast} from 'sonner';
import {useAuth} from '@/hooks/use-auth';
import services from '@/lib/services';
import {ReceiveHistoryItem} from '@/lib/services/project/types';

/** 领取记录数据获取逻辑 */
const useReceiveHistory = (isAuthenticated: boolean, authLoading: boolean) => {
  const [data, setData] = useState<ReceiveHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || authLoading) {
        return;
      }

      try {
        setLoading(true);

        // 获取第一页数据
        const firstPageResult = await services.project.getReceiveHistorySafe({
          current: 1,
          size: 100,
        });

        if (!firstPageResult.success || !firstPageResult.data) {
          throw new Error(firstPageResult.error || '获取数据失败');
        }

        const {total, results} = firstPageResult.data;
        const allResults = [...results];

        // 获取剩余数据
        if (total > 100) {
          const totalPages = Math.ceil(total / 100);
          const remainingRequests = Array.from({length: totalPages - 1}, (_, i) =>
            services.project.getReceiveHistorySafe({
              current: i + 2,
              size: 100,
            }),
          );

          const remainingResults = await Promise.all(remainingRequests);

          remainingResults.forEach((result) => {
            if (result.success && result.data) {
              allResults.push(...result.data.results);
            }
          });
        }

        setData(allResults);
      } catch (err) {
        console.error('获取领取记录失败:', err);
        const errorMessage = err instanceof Error ? err.message : '加载数据失败，请稍后再试';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  return {data, loading};
};

export function ReceivedMain() {
  const {isAuthenticated, isLoading: authLoading} = useAuth();
  const {data: claims, loading: dataLoading} = useReceiveHistory(isAuthenticated, authLoading);

  const isLoading = dataLoading || authLoading;

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的领取</h1>
          <p className="text-muted-foreground mt-1">
            查看您已领取的项目信息和内容
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="space-y-6">
        {/* 数据统计图表 */}
        <DataChart
          data={claims}
          isLoading={isLoading}
        />

        <Separator className="my-8" />

        {/* 领取数据表格 */}
        <DataTable
          data={claims}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
