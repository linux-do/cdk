'use client';

import {useState, useEffect, useCallback} from 'react';
import {toast} from 'sonner';
import {Skeleton} from '@/components/ui/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {DataChart, DataTable} from '@/components/common/received';
import services from '@/lib/services';
import {ReceiveHistoryItem, ReceiveHistoryChartPoint} from '@/lib/services/project/types';
import {motion} from 'motion/react';
import {useDebounce} from '@/hooks/use-debounce';

const PAGE_SIZE = 20;

/**
 * 数据图表骨架屏组件
 */
const DataChartSkeleton = () => {
  const chartBarHeights = [60, 35, 50, 25, 30, 55, 45];

  return (
    <div className="rounded-[22px] bg-muted">
      <div className="flex items-center justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-background/70 p-1">
          {Array.from({length: 4}).map((_, i) => (
            <Skeleton key={i} className="h-7 w-12 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 pb-3 md:grid-cols-4">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="py-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="mt-2 h-6 w-12" />
          </div>
        ))}
      </div>

      <div className="p-4 pt-1">
        <div className="h-[300px] w-full flex items-center justify-center">
          <div className="w-full max-w-full px-8">
            <div className="flex h-48 items-end justify-between gap-4">
              {chartBarHeights.map((height, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <Skeleton
                    className="w-8 bg-blue-100 dark:bg-blue-900/20"
                    style={{height: `${height}px`}}
                  />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 数据表格骨架屏组件
 */
const DataTableSkeleton = () => (
  <div className="rounded-[22px] bg-muted">
    <div className="flex flex-col gap-3 p-4 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-3.5 w-3.5 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-9 w-full rounded-full sm:w-56" />
    </div>

    <div className="px-3 pb-1">
      <div className="overflow-hidden rounded-[18px] bg-background/75">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="text-right w-[60px]">
                <Skeleton className="ml-auto h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({length: 10}).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    <div className="flex items-center justify-between px-4 pb-4 pt-2">
      <Skeleton className="h-4 w-20" />
      <div className="flex items-center space-x-1">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-7 w-7" />
      </div>
    </div>
  </div>
);

/**
 * 我的领取页面主组件
 */
export function ReceivedMain() {
  const [chartData, setChartData] = useState<ReceiveHistoryChartPoint[]>([]);
  const [tableData, setTableData] = useState<ReceiveHistoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [chartDay, setChartDay] = useState(7);

  /**
   * 获取图表数据
   */
  const fetchChartData = async (day: number) => {
    try {
      setChartLoading(true);

      const result = await services.project.getReceiveHistoryChartSafe({
        day,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || '获取图表数据失败');
      }

      setChartData(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '获取图表数据失败');
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(chartDay);
  }, [chartDay]);

  /**
   * 获取表格数据
   */
  const fetchTableData = async (page: number, search: string) => {
    try {
      setTableLoading(true);

      const result = await services.project.getReceiveHistorySafe({
        current: page,
        size: PAGE_SIZE,
        search,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || '获取表格数据失败');
      }

      setTableData(result.data.results || []);
      setTotalItems(result.data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '获取表格数据失败');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        ease: 'easeOut',
      },
    },
  };

  const itemVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.6, ease: 'easeOut'},
    },
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col gap-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" variants={itemVariants}>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">我的领取</h1>
          <div className="mt-1 text-muted-foreground">
            查看您已领取的分发项目信息和内容
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="h-px w-full bg-black/6 dark:bg-white/[0.06]" />
      </motion.div>

      <motion.div className="flex min-h-0 flex-1 flex-col gap-6" variants={itemVariants}>
        {chartLoading ? (
          <DataChartSkeleton />
        ) : (
          <DataChart data={chartData} selectedDay={chartDay} onRangeChange={setChartDay} />
        )}

        {tableLoading ? (
          <DataTableSkeleton />
        ) : (
          <DataTable
            data={tableData}
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            searchTerm={searchInput}
            onSearchChange={handleSearchChange}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
