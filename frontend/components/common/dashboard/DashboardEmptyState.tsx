'use client';

import {ReactNode} from 'react';

interface DashboardEmptyStateProps {
  icon?: ReactNode;
  className?: string;
}

export function DashboardEmptyState({
  icon,
  className = 'h-full min-h-[220px]',
}: DashboardEmptyStateProps) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-3 text-center ${className}`}>
      {icon && (
        <div className="flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="flex size-4 items-center justify-center">
            {icon}
          </div>
        </div>
      )}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        暂无数据
      </span>
    </div>
  );
}
