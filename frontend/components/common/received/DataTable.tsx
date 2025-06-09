'use client';

import React, {useState, useMemo, useEffect} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, ExternalLink, Package, Copy, ChevronLeft, ChevronRight} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {toast} from 'sonner';
import {ReceiveHistoryItem} from '@/lib/services/project/types';

const ITEMS_PER_PAGE = 20;
const MAX_PAGINATION_BUTTONS = 5;

const SORT_DIRECTIONS = {
  ASC: 'asc' as const,
  DESC: 'desc' as const,
};

interface DataTableProps {
  data: ReceiveHistoryItem[]
  isLoading?: boolean
}

type SortField = keyof ReceiveHistoryItem
type SortDirection = typeof SORT_DIRECTIONS[keyof typeof SORT_DIRECTIONS]

/** 格式化日期为本地化字符串 */
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '未知';

  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/** 复制文本到剪贴板 */
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch {
    toast.error('复制失败');
  }
};

/** 打开项目详情页 */
const openProjectDetail = (projectId: string): void => {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || window.location.origin;
  const url = `${baseUrl}/received/${projectId}`;
  window.open(url, '_blank');
};

/** 数据过滤和排序逻辑 */
const useDataProcessing = (
    data: ReceiveHistoryItem[],
    searchTerm: string,
    sortField: SortField,
    sortDirection: SortDirection,
) => {
  return useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter((item) =>
        item.project_name.toLowerCase().includes(term) ||
        item.project_creator.toLowerCase().includes(term) ||
        item.project_creator_nickname.toLowerCase().includes(term),
      );
    }

    filtered.sort((a, b) => {
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

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);
};

/** 分页逻辑 */
const usePagination = (data: ReceiveHistoryItem[], currentPage: number) => {
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage]);

  return {totalPages, paginatedData};
};

/** 空状态组件 */
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

/** 表格行组件 */
const TableRowComponent = ({item, index}: { item: ReceiveHistoryItem; index: number }) => (
  <TableRow key={`${item.project_id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
    <TableCell className="py-2 w-36">
      <div className="text-xs font-medium truncate text-gray-600 dark:text-gray-400">
        {item.project_name}
      </div>
    </TableCell>
    <TableCell className="py-2 w-40">
      <div className="text-xs truncate text-gray-600 dark:text-gray-400">
        {item.project_creator}({item.project_creator_nickname})
      </div>
    </TableCell>
    <TableCell className="py-2">
      <div className="group relative">
        <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all pr-7 text-gray-600 dark:text-gray-400">
          {item.content}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(item.content)}
          className="absolute right-0.5 top-0.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </TableCell>
    <TableCell className="py-2 w-44">
      <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
        {formatDateTime(item.received_at)}
      </div>
    </TableCell>
    <TableCell className="py-2 text-center w-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openProjectDetail(item.project_id)}
        className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400"
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        查看
      </Button>
    </TableCell>
  </TableRow>
);

/** 分页组件 */
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

/** 表格骨架屏组件 */
const DataTableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-20" />
      <div className="relative w-56">
        <Skeleton className="h-[30px] w-full rounded-md border" />
      </div>
    </div>

    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="h-10 w-36">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="h-10 w-40">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="h-10">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="h-10 w-44">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-16 h-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({length: 8}).map((_, index) => (
            <TableRow key={index} className="border-b border-gray-100 dark:border-gray-800">
              <TableCell className="py-2 w-36">
                <Skeleton className="h-3 w-28" />
              </TableCell>
              <TableCell className="py-2 w-40">
                <Skeleton className="h-3 w-32" />
              </TableCell>
              <TableCell className="py-2">
                <div className="group relative">
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded pr-7">
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-2 w-44">
                <Skeleton className="h-3 w-36" />
              </TableCell>
              <TableCell className="py-2 text-center w-16">
                <Skeleton className="h-7 w-12 mx-auto rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="border-t border-gray-200 dark:border-gray-700 py-3">
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export function DataTable({data, isLoading}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('received_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>(SORT_DIRECTIONS.DESC);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedData = useDataProcessing(data, searchTerm, sortField, sortDirection);
  const {totalPages, paginatedData} = usePagination(filteredAndSortedData, currentPage);

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /** 处理列排序 */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC);
    } else {
      setSortField(field);
      setSortDirection(SORT_DIRECTIONS.DESC);
    }
    setCurrentPage(1);
  };

  /** 渲染排序图标 */
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-gray-400">
        {sortDirection === SORT_DIRECTIONS.ASC ? '↑' : '↓'}
      </span>
    );
  };

  if (isLoading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* 头部搜索 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">领取记录</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
          <Input
            placeholder="搜索项目名称或分发者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-56 h-[30px] text-xs"
          />
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <TableHead
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium h-10 w-36"
                onClick={() => handleSort('project_name')}
              >
                项目名称
                {renderSortIcon('project_name')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium h-10 w-40"
                onClick={() => handleSort('project_creator_nickname')}
              >
                分发者
                {renderSortIcon('project_creator_nickname')}
              </TableHead>
              <TableHead className="text-sm font-medium h-10">领取内容</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium h-10 w-44"
                onClick={() => handleSort('received_at')}
              >
                领取时间
                {renderSortIcon('received_at')}
              </TableHead>
              <TableHead className="w-16 h-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={paginatedData.length === 0 ? 'h-[300px]' : ''}>
            {paginatedData.length === 0 ? (
              <EmptyState searchTerm={searchTerm} />
            ) : (
              paginatedData.map((item, index) => (
                <TableRowComponent key={`${item.project_id}-${index}`} item={item} index={index} />
              ))
            )}
          </TableBody>
        </Table>

        {/* 分页控制器 */}
        <div className="border-t border-gray-200 dark:border-gray-700 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            dataLength={filteredAndSortedData.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
