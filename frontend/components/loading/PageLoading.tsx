'use client';

import {LoaderCircle} from '@/components/animate-ui/icons/loader-circle';
import {cn} from '@/lib/utils';

export interface PageLoadingProps {
  /** 加载文本，默认为"加载中..." */
  text?: string;
  /** 额外的样式类名 */
  className?: string;
  /** 是否显示全屏覆盖，默认为 false */
  fullscreen?: boolean;
  /** 图标大小，默认为 24 */
  iconSize?: number;
}

/**
 * 页面加载组件
 * 使用旋转的圆形加载图标和可自定义的加载文本
 */
export function PageLoading({
  text = '加载中...',
  className,
  fullscreen = false,
  iconSize = 24,
}: PageLoadingProps = {}) {
  const containerClasses = cn(
      'flex flex-col items-center justify-center gap-3',
      fullscreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
      !fullscreen && 'py-12',
      className,
  );

  return (
    <div className={containerClasses}>
      <LoaderCircle
        size={iconSize}
        className="text-primary animate-spin"
        animation="default"
      />
      <p className="text-sm text-muted-foreground font-medium">
        {text}
      </p>
    </div>
  );
}

export default PageLoading;
