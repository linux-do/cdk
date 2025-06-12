'use client';

import {CreateDialog, MineProject} from '@/components/common/project';
import {Separator} from '@/components/ui/separator';
import {useState} from 'react';

/**
 * 项目主页组件
 */
export function ProjectMain() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的项目</h1>
          <p className="text-muted-foreground mt-1">管理您的项目和分发内容</p>
        </div>
        <div>
          <CreateDialog onProjectCreated={handleProjectCreated} />
        </div>
      </div>

      <Separator className="my-8" />

      {/* 项目列表区域 */}
      <MineProject
        key={refreshTrigger}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
