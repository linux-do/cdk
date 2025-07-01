'use client';

import React, {useState, useMemo, useEffect} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, ExternalLink, Copy, ChevronLeft, ChevronRight, Package} from 'lucide-react';
import {formatDateTimeWithSeconds, copyToClipboard} from '@/lib/utils';
import {ReceiveHistoryItem} from '@/lib/services/project/types';
import {EmptyState} from '@/components/common/layout/EmptyState';
import {motion} from 'motion/react';

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
}

type SortField = keyof ReceiveHistoryItem;
type SortDirection = typeof SORT_DIRECTIONS[keyof typeof SORT_DIRECTIONS];

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
 * 数据表格组件
 */
export function DataTable({data}: DataTableProps) {
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

  const containerVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        ease: 'easeOut',
      },
    },
  };

  const itemVariants = {
    hidden: {opacity: 0, y: 15},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.5, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
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
      </motion.div>

      <motion.div className="rounded-md border" variants={itemVariants}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('project_name')}
                >
                  项目名称{renderSortIcon('project_name')}
                </button>
              </TableHead>
              <TableHead className="w-[120px]">
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('project_creator_nickname')}
                >
                  创建者{renderSortIcon('project_creator_nickname')}
                </button>
              </TableHead>
              <TableHead className="w-[240px]">
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('content')}
                >
                  项目内容{renderSortIcon('content')}
                </button>
              </TableHead>
              <TableHead className="w-[10px]">
                <button
                  className="font-medium hover:text-primary transition-colors"
                  onClick={() => handleSort('received_at')}
                >
                  领取时间{renderSortIcon('received_at')}
                </button>
              </TableHead>
              <TableHead className="text-right w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={Package}
                    title="暂无领取记录"
                    description="您还没有领取任何项目内容"
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={`${item.project_id}-${item.received_at}`}>
                  <TableCell>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{item.project_name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {item.project_creator_nickname || item.project_creator}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-sm flex items-center justify-between group hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1 min-w-0">
                        {item.content}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.content)}
                        className="h-5 w-5 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="复制项目内容"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {item.received_at ? formatDateTimeWithSeconds(item.received_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
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
      </motion.div>

      <motion.div variants={itemVariants}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          dataLength={sortedAndFilteredData.length}
          onPageChange={setCurrentPage}
        />
      </motion.div>
    </motion.div>
  );
}
