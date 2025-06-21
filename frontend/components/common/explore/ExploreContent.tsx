'use client';

import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '@/components/ui/carousel';
import {InputButton, InputButtonAction, InputButtonProvider, InputButtonSubmit, InputButtonInput} from '@/components/animate-ui/buttons/input';
import {ChevronLeft, ChevronRight, Search, Compass, Filter, Check, X} from 'lucide-react';
import {ProjectCard} from '@/components/common/project';
import {ProjectListItem} from '@/lib/services/project/types';
import {EmptyState} from '@/components/common/layout/EmptyState';
import {motion} from 'motion/react';

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

  /** 计算衍生状态 */
  const filteredTags = (tags || []).filter((tag) =>
    tag.toLowerCase().includes(tagSearchKeyword.toLowerCase()),
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /** 快捷操作 */
  const handleClearAllTags = () => {
    (selectedTags || []).forEach(onTagToggle);
  };

  const handleSelectAllTags = () => {
    filteredTags.forEach((tag) => {
      if (!(selectedTags || []).includes(tag)) {
        onTagToggle(tag);
      }
    });
  };

  /** 分页组件 */
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const handlePrevPage = () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    const handleNextPage = () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          共 {total} 个项目，第 {currentPage} / {totalPages} 页
        </div>
        <div className="flex items-center space-x-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
          上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
          下一页
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const containerVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        ease: 'easeOut',
      },
    },
  };

  const itemVariants = {
    hidden: {opacity: 0, y: 15},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.5, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 搜索区域 */}
      <motion.div
        className="flex items-center justify-center"
        variants={itemVariants}
      >
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

        {/* 标签筛选器 */}
        <Popover open={isTagFilterOpen} onOpenChange={onTagFilterOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full w-10 h-10 ml-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 space-y-3">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">标签筛选</span>
                  {(selectedTags || []).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleClearAllTags}
                    >
                      清除全部
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="搜索标签..."
                    value={tagSearchKeyword}
                    onChange={(e) => onTagSearchKeywordChange(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="max-h-[220px] overflow-y-auto">
                {filteredTags.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs text-muted-foreground">
                        {`${filteredTags.length} 个标签${tagSearchKeyword ? '匹配' : ''}`}
                      </span>
                      {filteredTags.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary"
                          onClick={handleSelectAllTags}
                        >
                          全选
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1 mt-1">
                      {filteredTags.map((tag) => {
                        const isSelected = (selectedTags || []).includes(tag);
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
                  </>
                  ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">
                      {tagSearchKeyword ? '未找到匹配的标签' : '暂无标签'}
                    </p>
                  </div>
                  )}
              </div>

              {(selectedTags || []).length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">已选择的标签</span>
                    <span className="text-xs text-muted-foreground">
                      {(selectedTags || []).length} 个标签
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedTags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="px-2 py-0 h-6 bg-primary/5 text-xs text-primary border-primary/20 flex items-center gap-1"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTagToggle(tag);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* 即将开始 */}
      {upcomingProjects.length > 0 && (
        <motion.div
          className="space-y-6 relative"
          variants={itemVariants}
        >
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
              {upcomingProjects.map((project, index) => (
                <CarouselItem key={project.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <ProjectCard
                    project={project}
                    delay={index * 0.05}
                    onClick={() => onCardClick(project)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-top-12 right-12 left-auto translate-y-0" />
            <CarouselNext className="-top-12 right-2 left-auto translate-y-0" />
          </Carousel>
        </motion.div>
      )}

      {/* 所有项目 */}
      <motion.div
        className="flex items-center justify-between mt-12"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">所有项目</h2>
          <Badge variant="secondary" className="text-xs font-bold">
            {total}
          </Badge>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {loading ? (
        <LoadingSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="暂无分发项目"
          description={(selectedTags || []).length > 0 || searchKeyword ? '未找到符合条件的分发项目' : '请前往 我的项目创建 或 尝试刷新页面'}
          className="p-12 text-center"
        >
          {((selectedTags || []).length > 0 || searchKeyword) && (
            <Button variant="outline" onClick={onClearAllFilters} className="text-xs h-8">
              清除搜索/筛选条件
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                delay={index * 0.05}
                onClick={() => onCardClick(project)}
              />
            ))}
          </div>
          <Pagination />
        </>
      )}
      </motion.div>
    </motion.div>
  );
}
