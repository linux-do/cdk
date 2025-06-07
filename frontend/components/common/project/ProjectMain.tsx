'use client';

import {useAuth} from '@/hooks/use-auth';
import {CreateDialog} from '@/components/common/project/CreateDialog';
import {PageLoading} from '@/components/loading';

/**
 * 项目主页组件
 * 显示项目列表页面的主要内容，包含标题和创建项目功能
 */
export function ProjectMain() {
  const {isLoading} = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageLoading text="正在加载项目..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的项目</h1>
          <p className="text-muted-foreground mt-1">
            管理您的项目和分发内容
          </p>
        </div>
        <div>
          <CreateDialog />
        </div>
      </div>

      {/* 项目列表区域 - 暂时显示占位内容 */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              暂无项目
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              您还没有创建任何项目，点击上方按钮创建您的第一个项目
            </p>
            <CreateDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
