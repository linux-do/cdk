import React from 'react';
import {Package} from 'lucide-react';

/**
 * 空状态组件的Props接口
 */
interface EmptyStateProps {
  /** 图标组件 */
  icon?: React.ComponentType<{className?: string}>;
  /** 主标题 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 通用空状态组件
 */
export function EmptyState({
  icon: Icon = Package,
  title = '暂无数据',
  description = '当前没有可显示的内容',
  className = 'p-8 h-full flex flex-col items-center justify-center text-center',
}: EmptyStateProps) {
  return (
    <div className={className}>
      <div className="mx-auto w-15 h-15 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="mb-2 text-base font-bold">{title}</div>
      <div className="mb-4 text-xs text-muted-foreground">{description}</div>
    </div>
  );
} 