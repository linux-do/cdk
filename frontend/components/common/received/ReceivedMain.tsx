'use client';

import {useState, useEffect} from 'react';
import {DataChart} from './DataChart';
import {DataTable} from './DataTable';
import {Separator} from '@/components/ui/separator';
import {toast} from 'sonner';
import services from '@/lib/services';
import {ReceiveHistoryItem} from '@/lib/services/project/types';

const PAGE_SIZE = 100;

/**
 * 我的领取页面主组件
 */
export function ReceivedMain() {
  const [data, setData] = useState<ReceiveHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 获取所有领取记录
   */
  const fetchAllReceiveHistory = async () => {
    try {
      setLoading(true);

      const firstPageResult = await services.project.getReceiveHistorySafe({
        current: 1,
        size: PAGE_SIZE,
      });

      if (!firstPageResult.success || !firstPageResult.data) {
        throw new Error(firstPageResult.error || '获取数据失败');
      }

      const {total, results} = firstPageResult.data;
      const allResults = [...results];

      if (total > PAGE_SIZE) {
        const totalPages = Math.ceil(total / PAGE_SIZE);
        const remainingPages = Array.from({length: totalPages - 1}, (_, i) => i + 2);

        const remainingRequests = remainingPages.map((page) =>
          services.project.getReceiveHistorySafe({
            current: page,
            size: PAGE_SIZE,
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
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      toast.error(errorMessage);
      console.error('获取领取记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReceiveHistory();
  }, []);

  const isLoading = loading;

  return (
    <div className="space-y-6">
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
        <DataChart data={data} isLoading={isLoading} />
        <Separator className="my-8" />
        <DataTable data={data} isLoading={isLoading} />
      </div>
    </div>
  );
}
