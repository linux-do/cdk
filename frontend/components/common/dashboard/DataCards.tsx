'use client';

import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {StatCardProps, CardListProps, TagsDisplayProps, ListItemData} from '@/lib/services/dashboard/types';

/**
 * 统计卡片组件
 */
export function StatCard({title, value, icon, desc, descColor}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : (typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : null);

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-600 dark:text-gray-400">{title}</div>
        <div className="text-gray-600 dark:text-gray-400 w-4 h-4 flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {numericValue !== null ? (
          <CountingNumber
            number={numericValue}
            inView={true}
            transition={{stiffness: 100, damping: 30}}
          />
        ) : (
          value
        )}
      </div>
      {desc && (
        <div className={`text-xs font-medium ${descColor}`}>
          {desc}
        </div>
      )}
    </div>
  );
}

/**
 * 卡片列表组件
 */
export function CardList({title, icon, list, type}: Omit<CardListProps, 'iconBg'>) {
  /**
   * 渲染列表项头像或序号
   */
  const renderItemAvatar = (item: ListItemData) => {
    if ((type === 'creator' || type === 'receiver') && 'avatar' in item && item.avatar) {
      return (
        <Avatar className="h-6 w-6 rounded-full flex-shrink-0">
          <AvatarImage src={item.avatar} />
          <AvatarFallback>
            {item.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      );
    }

    return null;
  };

  /**
   * 渲染列表项内容
   */
  const renderItemContent = (item: ListItemData) => {
    const getMainText = () => {
      return item.name;
    };

    const getProjectTags = () => {
      if (type === 'project' && 'tags' in item && item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
        const displayTags = item.tags.slice(0, 3);
        const remainingCount = item.tags.length - displayTags.length;
        return displayTags.join('、') + (remainingCount > 0 ? ` +${remainingCount}` : '');
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
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
            {mainText}
          </span>
          {projectTags && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {projectTags}
            </span>
          )}
        </div>
        {subText && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {subText}
          </p>
        )}
      </div>
    );
  };

  /**
   * 渲染列表项指标
   */
  const renderItemMetric = (item: ListItemData) => {
    const getValue = () => {
      switch (type) {
        case 'project':
          return 'receiveCount' in item ? item.receiveCount : '';
        case 'creator':
          return 'projectCount' in item ? item.projectCount : '';
        case 'receiver':
          return 'receiveCount' in item ? item.receiveCount : '';
        default:
          return '';
      }
    };

    const getTitle = () => {
      switch (type) {
        case 'project':
          return 'receiveCount' in item ? `领取数: ${item.receiveCount}` : '';
        case 'creator':
          return 'projectCount' in item ? `项目数: ${item.projectCount}` : '';
        case 'receiver':
          return 'receiveCount' in item ? `领取数: ${item.receiveCount}` : '';
        default:
          return '';
      }
    };

    return (
      <div
        className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0 tabular-nums"
        title={getTitle()}
      >
        {getValue()}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="text-gray-600 dark:text-gray-400 w-4 h-4 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {title}
          </div>
        </div>
      </div>

      <div className="p-4 pt-2">
        <div className="space-y-3">
          {list?.map((item, index) => (
            <div
              key={`${type}-${item.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
            >
              {renderItemAvatar(item)}
              {renderItemContent(item)}
              {renderItemMetric(item)}
            </div>
          ))}

          {/* 空数据状态 */}
          {(!list || list.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              暂无数据
            </div>
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
            <span className="text-gray-500 dark:text-gray-400 text-sm">暂无标签数据</span>
          )}
        </div>
      </div>
    </div>
  );
}


