'use client';

import React from 'react';
import Link from 'next/link';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, ExternalLink, Copy, ChevronLeft, ChevronRight, Package} from 'lucide-react';
import {formatDateTimeWithSeconds, copyToClipboard} from '@/lib/utils';
import {ReceiveHistoryItem} from '@/lib/services/project/types';
import {EmptyState} from '@/components/common/layout/EmptyState';
import {motion} from 'motion/react';
import {useIsMobile} from '@/hooks/use-mobile';

const MAX_PAGINATION_BUTTONS = 5;

/**
 * 数据表格组件的Props接口
 */
interface DataTableProps {
  /** 领取历史数据 */
  data: ReceiveHistoryItem[];
  /** 当前页码 */
  currentPage: number;
  /** 总数据条数 */
  totalItems: number;
  /** 每页条数 */
  pageSize: number;
  /** 页码变更回调 */
  onPageChange: (page: number) => void;
  /** 搜索词 */
  searchTerm: string;
  /** 搜索词变更回调 */
  onSearchChange: (search: string) => void;
}

/**
 * 打开项目详情页
 */
const openProjectDetail = (projectId: string): void => {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || window.location.origin;
  const url = `${baseUrl}/receive/${projectId}`;
  window.open(url, '_blank');
};

/**
 * 分页组件
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
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
      <div className="text-xs text-muted-foreground">
        {totalItems === 0 ? (
          '无数据'
        ) : (
          `第 ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalItems)} 条，共 ${totalItems} 条`
        )}
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalItems === 0}
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
          disabled={currentPage === totalPages || totalItems === 0}
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
export function DataTable({data, currentPage, totalItems, pageSize, onPageChange, searchTerm, onSearchChange}: DataTableProps) {
  const isMobile = useIsMobile();
  const totalPages = Math.ceil(totalItems / pageSize);
  const safeData = data || [];

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
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目名称或创建者..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-48"
          />
        </div>
      </motion.div>

      <motion.div className="rounded-md border" variants={itemVariants}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10px]">领取时间</TableHead>
              <TableHead className="w-[120px] lg:w-[200px] xl:w-[300px]">项目名称</TableHead>
              <TableHead className="w-[120px] lg:w-[160px] xl:w-[200px]">创建者</TableHead>
              <TableHead className="w-[240px] lg:w-[400px] xl:w-[600px]">项目内容</TableHead>
              <TableHead className="text-right w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeData.length === 0 ? (
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
              safeData.map((item) => (
                <TableRow key={`${item.project_id}-${item.received_at}`}>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {item.received_at ? formatDateTimeWithSeconds(item.received_at) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[120px] lg:max-w-[200px] xl:max-w-[300px]">
                      <span
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer block overflow-hidden text-ellipsis whitespace-nowrap"
                        onClick={() => openProjectDetail(item.project_id)}
                        title={`${item.project_name} - 点击查看项目详情`}
                      >
                        {item.project_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    <div className="max-w-[120px] lg:max-w-[160px] xl:max-w-[200px]">
                      <Link
                        href={`https://linux.do/u/${item.project_creator}/summary`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className="hover:text-primary hover:text-blue-600 dark:hover:text-blue-400 transition-colors block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={`${item.project_creator_nickname || item.project_creator} - 点击查看用户主页`}
                      >
                        {item.project_creator_nickname || item.project_creator}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    <div className="max-w-[240px] lg:max-w-[400px] xl:max-w-[600px]">
                      <div className="group flex cursor-pointer items-center justify-between rounded-sm bg-muted px-2 py-1 text-xs transition-colors hover:bg-muted/80"
                        onDoubleClick={() => copyToClipboard(item.content)}
                        title={`${item.content} - 双击复制内容`}
                      >
                        <div className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.content}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.content)}
                          className={`ml-2 h-5 w-5 p-0 transition-opacity duration-200 hover:bg-muted/80 ${
                            isMobile ?
                              'opacity-100' :
                              'opacity-0 group-hover:opacity-100'
                          }`}
                          title="复制项目内容"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
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
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </motion.div>
    </motion.div>
  );
}
