'use client';

import {useState, useEffect, useCallback} from 'react';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {CreateDialog, MineProject} from '@/components/common/project';
import services from '@/lib/services';
import {ProjectListItem, ListProjectsRequest} from '@/lib/services/project/types';

const PAGE_SIZE = 12;

/**
 * 加载骨架屏组件
 */
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({length: 12}).map((_, index) => (
      <div key={index} className="w-full max-w-sm mx-auto">
        <div className="bg-gray-200 dark:bg-gray-800 p-4 sm:p-6 rounded-2xl relative">
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-2">
            <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" />
            <Skeleton className="h-3 w-8 sm:h-4 sm:w-10 rounded" />
          </div>

          <div className="flex flex-col items-center justify-center h-28 sm:h-32">
            <Skeleton className="h-4 sm:h-6 w-2/3 bg-white/30 dark:bg-gray-600 rounded" />
          </div>

          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 bg-white/30 dark:bg-gray-600 rounded" />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 mt-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 sm:h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-12 sm:w-14 rounded-full" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <Skeleton className="h-3 w-8 sm:w-10 rounded-full" />
              <Skeleton className="h-3 w-6 sm:w-8 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 sm:w-20 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * 项目主页组件
 */
export function ProjectMain() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [Loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCache, setPageCache] = useState<Map<number, ProjectListItem[]>>(new Map());
  
  /**
   * 获取项目列表
   */
  const fetchProjects = useCallback(
    async (page: number = 1, forceRefresh: boolean = false) => {
      if (!forceRefresh && pageCache.has(page)) {
        const cachedData = pageCache.get(page)!;
        setProjects(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const params: ListProjectsRequest = {
        current: page,
        size: PAGE_SIZE,
      };

      const result = await services.project.getMyProjectsSafe(params);

      if (result.success && result.data) {
        setProjects(result.data.results);
        setTotal(result.data.total);
        setPageCache((prev) => new Map(prev.set(page, result.data!.results)));
      } else {
        setError(result.error || '获取项目列表失败');
        setProjects([]);
        setTotal(0);
      }

      setLoading(false);
    },
    [pageCache, PAGE_SIZE],
  );

  /**
   * 处理新项目创建
   */
  const handleProjectCreated = (newProject: ProjectListItem) => {
    setProjects((prev) => [newProject, ...prev]);
    setTotal((prev) => prev + 1);
    setPageCache(new Map());

    setProjects((prev) => {
      if (prev.length > PAGE_SIZE) {
        return prev.slice(0, PAGE_SIZE);
      }
      return prev;
    });
  };

  /**
   * 重新获取数据
   */
  const handleRetry = () => {
    fetchProjects(currentPage, true);
  };

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage, fetchProjects]);

  return (
    <div className="space-y-6">
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

      {Loading ? (
        <LoadingSkeleton />
      ) : (
        <MineProject
          data={{
            projects,
            total,
            currentPage,
            pageSize: PAGE_SIZE,
            error,
            onPageChange: setCurrentPage,
            onProjectCreated: handleProjectCreated,
            onRetry: handleRetry,
            onProjectsChange: setProjects,
            onTotalChange: setTotal,
            onCacheClear: () => setPageCache(new Map()),
          }}
        />
      )}
    </div>
  );
}
