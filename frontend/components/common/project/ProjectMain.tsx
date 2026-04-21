'use client';

import {useState, useEffect, useCallback, useRef} from 'react';
import {Skeleton} from '@/components/ui/skeleton';
import {CreateDialog, MineProject} from '@/components/common/project';
import services from '@/lib/services';
import {ProjectListData, ProjectListItem, ListProjectsRequest} from '@/lib/services/project/types';
import {motion} from 'motion/react';

const PAGE_SIZE = 18;

/**
 * 加载骨架屏组件
 */
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({length: PAGE_SIZE}).map((_, index) => (
      <div key={index} className="rounded-[22px] bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-16 rounded-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <Skeleton className="h-5 w-3/5 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>

        <div className="mt-5 flex gap-2">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>

        <div className="mt-3 flex gap-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCache, setPageCache] = useState<Map<string, ProjectListData>>(new Map());
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchKeyword, setTagSearchKeyword] = useState('');
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const latestRequestIdRef = useRef(0);

  /**
   * 获取标签列表
   */
  const fetchTags = useCallback(async () => {
    const result = await services.project.getTagsSafe();
    if (result.success) {
      setTags(result.tags || []);
    }
  }, []);

  /**
   * 获取项目列表
   */
  const fetchProjects = useCallback(
      async (page: number = 1, forceRefresh: boolean = false) => {
        const requestId = ++latestRequestIdRef.current;
        const cacheKey = `${page}-${selectedTags.join(',')}`;

        if (!forceRefresh && pageCache.has(cacheKey) &&
            !(selectedTags || []).length) {
          const cachedData = pageCache.get(cacheKey)!;
          if (requestId === latestRequestIdRef.current) {
            setProjects(cachedData.results || []);
            setTotal(cachedData.total || 0);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        setError('');

        const params: ListProjectsRequest = {
          current: page,
          size: PAGE_SIZE,
          tags: (selectedTags || []).length > 0 ? selectedTags : undefined,
        };

        let hasError = false;

        try {
          const result = await services.project.getMyProjectsSafe(params);
          if (requestId !== latestRequestIdRef.current) {
            return;
          }

          if (result.success && result.data) {
            setProjects(result.data.results || []);
            setTotal(result.data.total || 0);
            if (!(selectedTags || []).length) {
              setPageCache((prev) => new Map(prev.set(cacheKey, result.data!)));
            }
          } else {
            hasError = true;
            setError(result.error || '获取项目列表失败');
            setProjects([]);
            setTotal(0);
          }
        } catch {
          if (requestId !== latestRequestIdRef.current) {
            return;
          }
          hasError = true;
          setError('获取项目列表失败');
          setProjects([]);
          setTotal(0);
        } finally {
          if (requestId !== latestRequestIdRef.current) {
            return;
          }

          if (!hasError) {
            setError('');
          }
          setLoading(false);
        }
      },
      [pageCache, selectedTags],
  );

  /**
   * 处理标签选择
   */
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      const prevTags = prev || [];
      const newTags = tag === '' ? [] :
        prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag];

      setCurrentPage(1);
      return newTags;
    });
  };

  /**
   * 处理页面变化
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  /**
   * 清除所有筛选条件
   */
  const clearAllFilters = () => {
    setSelectedTags([]);
    setTagSearchKeyword('');
    setCurrentPage(1);
  };

  /**
   * 处理新项目创建
   */
  const handleProjectCreated = (newProject: ProjectListItem) => {
    setProjects((prev) => [newProject, ...(prev || [])]);
    setTotal((prev) => prev + 1);
    setPageCache(new Map());

    setProjects((prev) => {
      const projects = prev || [];
      if (projects.length > PAGE_SIZE) {
        return projects.slice(0, PAGE_SIZE);
      }
      return projects;
    });
  };

  /**
   * 重新获取数据
   */
  const handleRetry = () => {
    fetchProjects(currentPage, true);
  };

  /** 获取标签列表 */
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  /** 获取项目列表 */
  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage, fetchProjects, selectedTags]);

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        ease: 'easeOut',
      },
    },
  };

  const itemVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.6, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex items-center justify-between gap-4" variants={itemVariants}>
        <div className="min-w-0">
          <h1 className="text-[30px] font-bold tracking-tight text-foreground">我的项目</h1>
        </div>
        <div className="shrink-0">
          <CreateDialog onProjectCreated={handleProjectCreated} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="h-px w-full bg-black/6 dark:bg-white/[0.06]" />
      </motion.div>

      <motion.div variants={itemVariants}>
        <MineProject
          data={{
            projects,
            total,
            currentPage,
            pageSize: PAGE_SIZE,
            error,
            tags,
            selectedTags,
            tagSearchKeyword,
            isTagFilterOpen,
            loading,
            onTagToggle: handleTagToggle,
            onTagFilterOpenChange: setIsTagFilterOpen,
            onTagSearchKeywordChange: setTagSearchKeyword,
            onClearAllFilters: clearAllFilters,
            onPageChange: handlePageChange,
            onProjectCreated: handleProjectCreated,
            onRetry: handleRetry,
            onProjectsChange: setProjects,
            onTotalChange: setTotal,
            onCacheClear: () => setPageCache(new Map()),
          }}
          LoadingSkeleton={LoadingSkeleton}
        />
      </motion.div>
    </motion.div>
  );
}
