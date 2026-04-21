'use client';

import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {StatCardProps, CardListProps, TagsDisplayProps, ListItemData} from '@/lib/services/dashboard/types';
import {Tags} from 'lucide-react';
import {DashboardEmptyState} from './DashboardEmptyState';

/**
 * 统计卡片组件
 */
export function StatCard({
  title,
  value,
  icon,
  desc,
}: StatCardProps) {
  const numericValue =
    typeof value === 'number' ?
      value :
      typeof value === 'string' && !isNaN(Number(value)) ?
        Number(value) :
        null;

  return (
    <div
      className="min-h-[88px] bg-gray-50 dark:bg-gray-800 rounded-[20px] px-3.5 py-3 sm:min-h-[96px] sm:px-4"
      title={desc || title}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate pr-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {title}
          </div>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xl font-semibold leading-none tracking-[-0.03em] text-gray-900 dark:text-gray-100 sm:text-2xl">
            {numericValue !== null ? (
              <CountingNumber
                number={numericValue}
                inView={true}
                transition={{stiffness: 100, damping: 30}}
              />
            ) : (
              value || '--'
            )}
          </div>
          <div className="mt-2 truncate text-[11px] text-gray-500 dark:text-gray-400">
            {desc || '\u00a0'}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 卡片列表组件
 */
export function CardList({title, icon, list, type}: Omit<CardListProps, 'iconBg'>) {
  const displayedList = (list || []).slice(0, 10);

  const getMetricValue = (item: ListItemData) => {
    switch (type) {
      case 'project':
        return 'receiveCount' in item ? item.receiveCount : 0;
      case 'creator':
        return 'projectCount' in item ? item.projectCount : 0;
      case 'receiver':
        return 'receiveCount' in item ? item.receiveCount : 0;
      default:
        return 0;
    }
  };

  const getMetricLabel = () => {
    switch (type) {
      case 'project':
        return '领取';
      case 'creator':
        return '项目';
      case 'receiver':
        return '领取';
      default:
        return '';
    }
  };

  const getMetricTitle = (item: ListItemData) => {
    const value = getMetricValue(item);

    switch (type) {
      case 'project':
        return `领取数: ${value}`;
      case 'creator':
        return `项目数: ${value}`;
      case 'receiver':
        return `领取数: ${value}`;
      default:
        return String(value);
    }
  };

  /**
   * 渲染列表项头像或序号
   */
  const renderItemLeading = (item: ListItemData, index: number) => {
    const rank = String(index + 1).padStart(2, '0');

    if (
      (type === 'creator' || type === 'receiver') &&
      'avatar' in item &&
      item.avatar
    ) {
      return (
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-4 text-[11px] font-medium tabular-nums text-gray-400 dark:text-gray-500">
            {rank}
          </span>
          <Avatar className="h-6 w-6 rounded-full flex-shrink-0">
            <AvatarImage src={item.avatar} />
            <AvatarFallback className="text-[11px]">
              {item.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      );
    }

    return (
      <div className="w-4 text-[11px] font-medium tabular-nums text-gray-400 dark:text-gray-500 flex-shrink-0">
        {rank}
      </div>
    );
  };

  /**
   * 渲染列表项内容
   */
  const renderItemContent = (item: ListItemData) => {
    const getMainText = () => {
      return item.name;
    };

    const getProjectTags = () => {
      if (type === 'project' && 'tags' in item) {
        if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
          return item.tags.slice(0, 2);
        } else {
          return [];
        }
      }
      return null;
    };

    const getSubText = () => {
      switch (type) {
        case 'project':
          return '';
        case 'creator':
          return 'projectCount' in item ? `${item.projectCount} 个项目` : '';
        case 'receiver':
          return 'receiveCount' in item ? `${item.receiveCount} 次领取` : '';
        default:
          return '';
      }
    };

    const mainText = getMainText();
    const projectTags = getProjectTags();
    const subText = getSubText();

    return (
      <div className="flex-1 min-w-0">
        <div>
          <span className="block truncate text-[13px] font-medium leading-5 text-gray-900 dark:text-gray-100">
            {mainText}
          </span>
        </div>
        <div className="mt-0.5 h-4 overflow-hidden">
          {projectTags && projectTags.length > 0 ? (
            <div className="flex items-center gap-1 whitespace-nowrap">
              {projectTags.map((tag) => (
                <span
                  key={`${item.name}-${tag}`}
                  className="inline-flex h-4 items-center rounded-sm bg-white/60 dark:bg-white/[0.04] px-1.5 text-[10px] font-medium leading-none text-gray-500 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : subText ? (
            <p className="truncate text-[11px] leading-4 text-gray-500 dark:text-gray-400">
              {subText}
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  /**
   * 渲染列表项指标
   */
  const renderItemMetric = (item: ListItemData) => {
    const value = getMetricValue(item);
    const label = getMetricLabel();

    return (
      <div
        className="flex-shrink-0 text-right"
        title={getMetricTitle(item)}
      >
        <div className="text-[13px] font-semibold tabular-nums leading-none text-gray-800 dark:text-gray-200">
          {value}
        </div>
        <div className="mt-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-[22px] h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pb-1.5 pt-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-gray-500 dark:text-gray-400 w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </div>
        </div>
        <div className="text-[10px] font-medium tabular-nums text-gray-400 dark:text-gray-500">
          {displayedList.length}
        </div>
      </div>

      <div className="flex-1 px-4 pb-3 pt-1">
        <div className="space-y-1">
          {displayedList.map((item, index) => (
            <div
              key={`${type}-${item.name}-${index}`}
              className="group flex min-h-[42px] items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors duration-200 hover:bg-white/50 dark:hover:bg-white/[0.03]"
            >
              {renderItemLeading(item, index)}
              {renderItemContent(item)}
              {renderItemMetric(item)}
            </div>
          ))}

          {displayedList.length === 0 && (
            <DashboardEmptyState icon={icon} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 标签展示组件
 */
export function TagsDisplay({title, tags, icon}: Omit<TagsDisplayProps, 'iconBg'>) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-gray-600 dark:text-gray-400 w-4 h-4 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</div>
        </div>
      </div>
      <div className="p-4 pt-2">
        <div className="flex flex-wrap gap-2">
          {tags && tags.length > 0 ? (
            tags.map((tag, idx) => (
              <span
                key={`${tag.name}-${idx}`}
                className="inline-flex items-center rounded-lg px-3 py-1.5 font-semibold text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-muted hover:text-muted-foreground transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {tag.name}
                <span className="ml-1 text-gray-600 dark:text-gray-400">{tag.count}</span>
              </span>
            ))
          ) : (
            <DashboardEmptyState icon={icon || <Tags className="size-4" />} className="h-[160px]" />
          )}
        </div>
      </div>
    </div>
  );
}
