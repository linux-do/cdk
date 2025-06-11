'use client';

import React, {useState, useMemo, useEffect} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, ExternalLink, Package, Copy, ChevronLeft, ChevronRight} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {toast} from 'sonner';
import {ReceiveHistoryItem} from '@/lib/services/project/types';
import {formatDateTimeWithSeconds} from '@/lib/utils';

const ITEMS_PER_PAGE = 20;
const MAX_PAGINATION_BUTTONS = 5;
const SORT_DIRECTIONS = {
  ASC: 'asc' as const,
  DESC: 'desc' as const,
};

/**
 * 数据表格组件的Props接口
 */
interface DataTableProps {
  /** 领取历史数据 */
  data: ReceiveHistoryItem[];
  /** 加载状态 */
  isLoading?: boolean;
}

type SortField = keyof ReceiveHistoryItem;
type SortDirection = typeof SORT_DIRECTIONS[keyof typeof SORT_DIRECTIONS];

/**
 * 复制文本到剪贴板
 */
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch {
    toast.error('复制失败');
  }
};

/**
 * 打开项目详情页
 */
const openProjectDetail = (projectId: string): void => {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || window.location.origin;
  const url = `${baseUrl}/receive/${projectId}`;
  window.open(url, '_blank');
};

/**
 * 数据过滤和排序处理
 * 
 * @param data 原始数据
 * @param searchTerm 搜索关键词
 * @param sortField 排序字段
 * @param sortDirection 排序方向
 */
const processData = (
  data: ReceiveHistoryItem[],
  searchTerm: string,
  sortField: SortField,
  sortDirection: SortDirection,
): ReceiveHistoryItem[] => {
  let filtered = data;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = data.filter((item) =>
      item.project_name.toLowerCase().includes(term) ||
      item.project_creator.toLowerCase().includes(term) ||
      item.project_creator_nickname.toLowerCase().includes(term),
    );
  }

  return filtered.sort((a, b) => {
    let aValue: string | number | null = a[sortField];
    let bValue: string | number | null = b[sortField];

    if (sortField === 'received_at') {
      const aTime = aValue ? new Date(aValue as string).getTime() : 0;
      const bTime = bValue ? new Date(bValue as string).getTime() : 0;
      aValue = aTime;
      bValue = bTime;
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    return sortDirection === SORT_DIRECTIONS.ASC ?
      (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) :
      (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
  });
};

/**
 * 空状态组件
 */
const EmptyState = ({searchTerm}: { searchTerm: string }) => (
  <TableRow>
    <TableCell colSpan={5} className="h-[300px] text-center">
      {searchTerm ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Search className="h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">未找到匹配结果</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">尝试调整搜索条件</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <Package className="h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">暂无领取记录</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">您还没有领取任何项目内容</p>
        </div>
      )}
    </TableCell>
  </TableRow>
);

/**
 * 分页组件
 */
const Pagination = ({
  currentPage,
  totalPages,
  dataLength,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  dataLength: number
  onPageChange: (page: number) => void
}) => {
  const generatePageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + MAX_PAGINATION_BUTTONS - 1);

    if (endPage - startPage < MAX_PAGINATION_BUTTONS - 1) {
      startPage = Math.max(1, endPage - MAX_PAGINATION_BUTTONS + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return {pages, startPage, endPage};
  };

  const {pages, startPage, endPage} = generatePageNumbers();

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-xs text-gray-500">
        {dataLength === 0 ? (
          '无数据'
        ) : (
          `第 ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, dataLength)} 条，共 ${dataLength} 条`
        )}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || dataLength === 0}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {totalPages > 0 && (
          <>
            {startPage > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  className="h-7 px-2 text-xs"
                >
                  1
                </Button>
                {startPage > 2 && <span className="text-xs text-gray-400">...</span>}
              </>
            )}

            {pages.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-7 px-2 text-xs"
              >
                {page}
              </Button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="text-xs text-gray-400">...</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  className="h-7 px-2 text-xs"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || dataLength === 0}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

/**
 * 数据表格骨架屏组件
 */
const DataTableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
    </div>

    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-12 ml-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({length: 10}).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
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

    <div className="flex items-center justify-between px-2">
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
 * 数据表格组件
 */
export function DataTable({data, isLoading}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('received_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>(SORT_DIRECTIONS.DESC);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const sortedAndFilteredData = useMemo(
    () => processData(data, searchTerm, sortField, sortDirection),
    [data, searchTerm, sortField, sortDirection],
  );

  const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
  const paginatedData = sortedAndFilteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC);
    } else {
      setSortField(field);
      setSortDirection(SORT_DIRECTIONS.DESC);
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortDirection === SORT_DIRECTIONS.ASC ? ' ↑' : ' ↓';
  };

  if (isLoading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          详细记录
        </h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目名称或创建者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-48"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('received_at')}
                >
                  领取时间{renderSortIcon('received_at')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('project_name')}
                >
                  项目名称{renderSortIcon('project_name')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('project_creator_nickname')}
                >
                  创建者{renderSortIcon('project_creator_nickname')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('project_id')}
                >
                  项目ID{renderSortIcon('project_id')}
                </button>
              </TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <EmptyState searchTerm={searchTerm} />
            ) : (
              paginatedData.map((item) => (
                <TableRow key={`${item.project_id}-${item.received_at}`}>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {item.received_at ? formatDateTimeWithSeconds(item.received_at) : '-'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{item.project_name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {item.content || '暂无内容'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.project_creator_nickname || item.project_creator}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    {item.project_id}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.project_id)}
                        className="h-6 w-6 p-0"
                        title="复制项目ID"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openProjectDetail(item.project_id)}
                        className="h-6 w-6 p-0"
                        title="查看详情"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        dataLength={sortedAndFilteredData.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
