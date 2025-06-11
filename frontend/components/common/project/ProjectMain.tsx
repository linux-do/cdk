'use client';

import {CreateDialog} from '@/components/common/project/CreateDialog';
import {MineProject} from '@/components/common/project/MineProject';
import {Separator} from '@/components/ui/separator';

/**
 * 项目主页组件
 */
export function ProjectMain() {

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

      <Separator className="my-8" />

      {/* 项目列表区域 */}
      <MineProject />
    </div>
  );
}
