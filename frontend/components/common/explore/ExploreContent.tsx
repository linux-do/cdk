'use client';

import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '@/components/ui/carousel';
import {InputButton, InputButtonAction, InputButtonProvider, InputButtonSubmit, InputButtonInput} from '@/components/animate-ui/buttons/input';
import {ChevronLeft, ChevronRight, Search, Compass, Filter, Check} from 'lucide-react';
import {ProjectCard} from '@/components/common/project';
import {ProjectListItem} from '@/lib/services/project/types';
import {EmptyState} from '@/components/common/layout/EmptyState';

const PAGE_SIZE = 96;

interface ExploreContentProps {
  data: {
    projects: ProjectListItem[];
    upcomingProjects: ProjectListItem[];
    total: number;
    currentPage: number;
    tags: string[];
    selectedTags: string[];
    searchKeyword: string;
    tagSearchKeyword: string;
    isTagFilterOpen: boolean;
    showAllTags: boolean;
    loading: boolean;
    onPageChange: (page: number) => void;
    onTagToggle: (tag: string) => void;
    onSearchSubmit: () => void;
    onCardClick: (project: ProjectListItem) => void;
    onClearAllFilters: () => void;
    onSearchKeywordChange: (keyword: string) => void;
    onTagSearchKeywordChange: (keyword: string) => void;
    onTagFilterOpenChange: (open: boolean) => void;
    onShowAllTagsChange: (show: boolean) => void;
  };
  LoadingSkeleton: React.ComponentType;
}

/**
 * 探索页面内容组件
 */
export function ExploreContent({data, LoadingSkeleton}: ExploreContentProps) {
  const {
    projects,
    upcomingProjects,
    total,
    currentPage,
    tags,
    selectedTags,
    searchKeyword,
    tagSearchKeyword,
    isTagFilterOpen,
    loading,
    onPageChange,
    onTagToggle,
    onSearchSubmit,
    onCardClick,
    onClearAllFilters,
    onSearchKeywordChange,
    onTagSearchKeywordChange,
    onTagFilterOpenChange,
  } = data;

  // 计算衍生状态
  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(tagSearchKeyword.toLowerCase()),
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 快捷操作
  const handleClearAllTags = () => {
    selectedTags.forEach(onTagToggle);
  };

  const handleSelectAllTags = () => {
    filteredTags.forEach((tag) => {
      if (!selectedTags.includes(tag)) {
        onTagToggle(tag);
      }
    });
  };

  // 分页组件
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      if (totalPages <= 5) return Array.from({length: totalPages}, (_, i) => i + 1);

      if (currentPage <= 3) return [1, 2, 3, 4, 5];
      if (currentPage >= totalPages - 2) return Array.from({length: 5}, (_, i) => totalPages - 4 + i);

      return Array.from({length: 5}, (_, i) => currentPage - 2 + i);
    };

    return (
      <div className="flex items-center justify-center gap-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一页
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
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
      {/* 搜索区域 */}
      <div className="flex justify-center">
        <InputButtonProvider>
          <InputButton>
            <InputButtonAction className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              <span className="text-xs">搜索项目</span>
            </InputButtonAction>
            <InputButtonSubmit onClick={onSearchSubmit}>搜索</InputButtonSubmit>
          </InputButton>
          <InputButtonInput
            placeholder="输入项目名称或描述..."
            value={searchKeyword}
            onChange={(e) => onSearchKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          />
        </InputButtonProvider>
      </div>

      {/* 即将开始 */}
      {upcomingProjects.length > 0 && (
        <div className="space-y-6 relative">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">即将开始</h2>
            <Badge variant="secondary" className="text-xs font-bold">
              {upcomingProjects.length}
            </Badge>
          </div>
          <Carousel
            opts={{
              align: 'start',
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {upcomingProjects.map((project) => (
                <CarouselItem key={project.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <ProjectCard
                    project={project}
                    onClick={() => onCardClick(project)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-top-12 right-12 left-auto translate-y-0" />
            <CarouselNext className="-top-12 right-2 left-auto translate-y-0" />
          </Carousel>
        </div>
      )}

      {/* 所有项目 */}
      <div className="flex items-center justify-between mt-12">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">所有项目</h2>
          <Badge variant="secondary" className="text-xs font-bold">
            {total}
          </Badge>
        </div>

        <Popover open={isTagFilterOpen} onOpenChange={onTagFilterOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full w-8 h-8 mr-1.5"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="搜索标签..."
                    value={tagSearchKeyword}
                    onChange={(e) => onTagSearchKeywordChange(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>

                {(selectedTags.length > 0 || filteredTags.length > 1) && (
                  <div className="flex justify-end gap-3 text-xs">
                    {filteredTags.length > 1 && (
                      <button
                        onClick={handleSelectAllTags}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                          全选
                      </button>
                    )}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={handleClearAllTags}
                        className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                          清除全部
                      </button>
                    )}
                  </div>
                )}
              </div>

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
                            onClick={() => onTagToggle(tag)}
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
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="暂无分发项目"
          description={selectedTags.length > 0 || searchKeyword ? '未找到符合条件的分发项目' : '请前往 我的项目创建 或 尝试刷新页面'}
          className="p-12 text-center"
        >
          {(selectedTags.length > 0 || searchKeyword) && (
            <Button variant="outline" onClick={onClearAllFilters} className="text-xs h-8">
              清除搜索/筛选条件
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onCardClick(project)}
              />
            ))}
          </div>
          <Pagination />
        </>
      )}
    </div>
  );
}
