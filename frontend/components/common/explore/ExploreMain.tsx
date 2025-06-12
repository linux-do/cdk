'use client';

import {useState, useEffect, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {Card, CardContent} from '@/components/ui/card';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {InputButton, InputButtonAction, InputButtonProvider, InputButtonSubmit, InputButtonInput} from '@/components/animate-ui/buttons/input';
import {ChevronLeft, ChevronRight, Search, X, Compass, Filter, Check, ChevronDown} from 'lucide-react';
import {ProjectCard} from '@/components/common/project';
import {ExploreBanner} from '@/components/common/explore';
import services from '@/lib/services';
import {ProjectListItem} from '@/lib/services/project/types';

/**
 * 探索广场主组件
 */
export function ExploreMain() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [originalProjects, setOriginalProjects] = useState<ProjectListItem[]>([]);
  const [randomProjects, setRandomProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tagSearchKeyword, setTagSearchKeyword] = useState('');
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [pageCache, setPageCache] = useState<Map<string, {data: ProjectListItem[]; total: number}>>(new Map());

  const pageSize = 96;
  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(tagSearchKeyword.toLowerCase()),
  );
  const totalPages = Math.ceil(total / pageSize);

  const maxVisibleTags = 5;
  const visibleTags = showAllTags ? selectedTags : selectedTags.slice(0, maxVisibleTags);
  const hiddenTagsCount = selectedTags.length - maxVisibleTags;

  /**
   * 更新横幅随机项目
   */
  const updateRandomProjects = useCallback((projectList: ProjectListItem[]) => {
    const now = new Date();
    const activeProjects = projectList.filter((project) => {
      const startTime = new Date(project.start_time);
      const endTime = new Date(project.end_time);
      return now >= startTime && now <= endTime && project.total_items > 0;
    });

    const shuffled = [...activeProjects].sort(() => Math.random() - 0.5);
    setRandomProjects(shuffled.slice(0, 4));
  }, []);

  /**
   * 获取项目列表
   */
  const fetchProjects = useCallback(
      async (page: number = 1, filterTags: string[] = [], forceRefresh: boolean = false) => {
        const cacheKey = `${page}-${filterTags.sort().join(',')}`;

        if (!forceRefresh && pageCache.has(cacheKey)) {
          const cached = pageCache.get(cacheKey)!;
          setOriginalProjects(cached.data);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError('');

        const result = await services.project.getProjectsSafe({
          current: page,
          size: pageSize,
          tags: filterTags.length > 0 ? filterTags : undefined,
        });

        if (result.success && result.data) {
          const results = result.data.results;
          setOriginalProjects(results);

          if (page === 1 && filterTags.length === 0) {
            updateRandomProjects(results);
          }

          setPageCache((prev) => new Map(prev.set(cacheKey, {
            data: results,
            total: results.length,
          })));
        } else {
          setError(result.error || '获取项目列表失败');
          setOriginalProjects([]);
        }

        setLoading(false);
      },
      [pageCache, pageSize, updateRandomProjects],
  );

  /**
   * 获取标签列表
   */
  const fetchTags = useCallback(async () => {
    const result = await services.project.getTagsSafe();
    if (result.success) {
      setTags(result.tags);
    }
  }, []);

  /**
   * 应用搜索过滤
   */
  useEffect(() => {
    if (!originalProjects.length) return;

    let filteredResults = originalProjects;

    if (searchKeyword.trim()) {
      filteredResults = filteredResults.filter((project) =>
        project.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchKeyword.toLowerCase())),
      );
    }

    setProjects(filteredResults);
    setTotal(filteredResults.length);
  }, [originalProjects, searchKeyword]);

  /**
   * 处理标签选择
   */
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag) ?
        prev.filter((t) => t !== tag) :
        [...prev, tag];

      setCurrentPage(1);
      setPageCache(new Map());
      setShowAllTags(false);
      return newTags;
    });
  };

  /**
   * 处理搜索提交
   */
  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  /**
   * 卡片点击事件
   */
  const handleCardClick = (project: ProjectListItem) => {
    router.push(`/receive/${project.id}`);
  };

  /**
   * 清除筛选条件
   */
  const clearAllFilters = () => {
    setSelectedTags([]);
    setSearchKeyword('');
    setCurrentPage(1);
    setPageCache(new Map());
    setShowAllTags(false);
  };

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchProjects(currentPage, selectedTags);
  }, [currentPage, selectedTags, fetchProjects]);

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
          </div>
          <div className="space-y-1.5 sm:space-y-2 mt-3">
            <Skeleton className="h-3 sm:h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * 空状态组件
   */
  const EmptyState = () => (
    <Card className="border-none shadow-none">
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Compass className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-2">暂无项目</h3>
        <p className="text-muted-foreground mb-4 text-xs">
          {selectedTags.length > 0 || searchKeyword ? '没有找到符合条件的项目' : '还没有任何项目'}
        </p>
        {(selectedTags.length > 0 || searchKeyword) && (
          <Button variant="outline" onClick={clearAllFilters} className="text-xs h-8">
            清除搜索/筛选条件
          </Button>
        )}
      </CardContent>
    </Card>
  );

  /**
   * 分页组件
   */
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一页
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages}
        >
          下一页
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ExploreBanner
        randomProjects={randomProjects}
        onProjectClick={handleCardClick}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 items-center max-w-full">
          <InputButtonProvider>
            <InputButton>
              <InputButtonAction className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                <span className="text-xs">搜索...</span>
              </InputButtonAction>
              <InputButtonSubmit onClick={handleSearchSubmit}>
                搜索
              </InputButtonSubmit>
            </InputButton>
            <InputButtonInput
              type="text"
              placeholder="输入项目名称或描述..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />
          </InputButtonProvider>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Popover open={isTagFilterOpen} onOpenChange={setIsTagFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                {selectedTags.length > 0 ? `已选 ${selectedTags.length} 个标签` : '筛选标签'}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="搜索标签..."
                    value={tagSearchKeyword}
                    onChange={(e) => setTagSearchKeyword(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>

                {(selectedTags.length > 0 || filteredTags.length > 1) && (
                  <>
                    <div className="flex gap-2">
                      {selectedTags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTags([]);
                            setCurrentPage(1);
                            setPageCache(new Map());
                            setShowAllTags(false);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          清除全部
                        </Button>
                      )}
                      {filteredTags.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTags([...filteredTags]);
                            setCurrentPage(1);
                            setPageCache(new Map());
                            setShowAllTags(false);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          全选
                        </Button>
                      )}
                    </div>
                  </>
                )}

                <div className="max-h-48 overflow-y-auto">
                  {filteredTags.length > 0 ? (
                    <div className="space-y-1">
                      {filteredTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <div
                            key={tag}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                              isSelected ? 'bg-primary/10 border border-primary/20' : ''
                            }`}
                            onClick={() => handleTagToggle(tag)}
                          >
                            <span className={`text-xs font-medium ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}>
                              {tag}
                            </span>
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">
                        {tagSearchKeyword ? '未找到匹配的标签' : '暂无标签'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {selectedTags.length > 0 && (
            <>
              {visibleTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs h-6 pl-2 pr-1"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagToggle(tag);
                    }}
                    className="ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}

              {hiddenTagsCount > 0 && !showAllTags && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTags(true)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  +{hiddenTagsCount} 更多
                </Button>
              )}

              {showAllTags && selectedTags.length > maxVisibleTags && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTags(false)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  收起
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button
              onClick={() => fetchProjects(currentPage, selectedTags, true)}
              className="mt-4"
            >
              重试
            </Button>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleCardClick(project)}
              />
            ))}
          </div>
          <Pagination />
        </>
      )}
    </div>
  );
}
