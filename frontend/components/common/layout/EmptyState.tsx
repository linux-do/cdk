import React from 'react';
import {LucideIcon} from 'lucide-react';

/**
 * 空状态组件的Props接口
 */
interface EmptyStateProps {
  /** 图标组件 */
  icon?: LucideIcon;
  /** 主标题 */
  title: string;
  /** 描述文本 */
  description?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义按钮或操作 */
  children?: React.ReactNode;
}

/**
 * 通用空状态组件
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className = 'flex flex-col items-center justify-center text-center p-8 h-full',
  children,
}: EmptyStateProps) {
  return (
    <div className={className}>
      {Icon && (
        <div className="mx-auto w-15 h-15 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <div className="mb-2 text-base font-bold">{title}</div>
      {description && (
        <div className="mb-4 text-xs text-muted-foreground">{description}</div>
      )}
      {children}
    </div>
  );
}
