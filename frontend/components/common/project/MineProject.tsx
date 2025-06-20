'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {ChevronLeft, ChevronRight, FolderOpen, Trash2, Pencil, Filter, Check, Search, X} from 'lucide-react';
import {EditDialog, ProjectCard} from '@/components/common/project';
import {EmptyState} from '@/components/common/layout/EmptyState';
import services from '@/lib/services';
import {ProjectListItem} from '@/lib/services/project/types';

interface MineProjectProps {
  data: {
    projects: ProjectListItem[];
    total: number;
    currentPage: number;
    pageSize: number;
    error: string;
    tags: string[];
    selectedTags: string[];
    tagSearchKeyword: string;
    isTagFilterOpen: boolean;
    loading: boolean;
    onTagToggle: (tag: string) => void;
    onTagFilterOpenChange: (open: boolean) => void;
    onTagSearchKeywordChange: (keyword: string) => void;
    onClearAllFilters: () => void;
    onPageChange: (page: number) => void;
    onProjectCreated: (project: ProjectListItem) => void;
    onRetry: () => void;
    onProjectsChange: (projects: ProjectListItem[]) => void;
    onTotalChange: (total: number) => void;
    onCacheClear: () => void;
  };
  LoadingSkeleton: React.ComponentType;
}

export function MineProject({data, LoadingSkeleton}: MineProjectProps) {
  const {
    projects,
    total,
    currentPage,
    pageSize,
    error,
    tags,
    selectedTags,
    tagSearchKeyword,
    isTagFilterOpen,
    loading,
    onTagToggle,
    onTagFilterOpenChange,
    onTagSearchKeywordChange,
    onClearAllFilters,
    onPageChange,
    onRetry,
    onProjectsChange,
    onTotalChange,
    onCacheClear,
  } = data;

  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * 处理项目更新
   */
  const handleProjectUpdated = (updatedProject: ProjectListItem) => {
    onProjectsChange(
        projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
    );
    onCacheClear();
  };

  /** 删除项目 */
  const handleDeleteProject = async (project: ProjectListItem) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  /** 确认删除 */
  const confirmDeleteProject = async () => {
    if (!projectToDelete || deleting) return;

    setDeleting(true);

    try {
      const result = await services.project.deleteProjectSafe(
          projectToDelete.id,
      );

      if (result.success) {
        toast.success('项目删除成功');

        onCacheClear();
        onProjectsChange(projects.filter((p) => p.id !== projectToDelete.id));
        onTotalChange(total - 1);

        const remainingProjects = projects.length - 1;
        if (remainingProjects === 0 && currentPage > 1) {
          onPageChange(currentPage - 1);
        } else if (remainingProjects === 0) {
          onRetry();
        }

        setDeleting(false);
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } else {
        toast.error(result.error || '删除项目失败');
        setDeleting(false);
      }
    } catch {
      toast.error('删除项目失败');
      setDeleting(false);
    }
  };

  /** 点击卡片跳转到项目页面 */
  const handleCardClick = (project: ProjectListItem) => {
    router.push(`/receive/${project.id}`);
  };

  const totalPages = Math.ceil(total / pageSize);

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

  /** 标签过滤相关逻辑 */
  const filteredTags = (tags || []).filter((tag) =>
    tag.toLowerCase().includes(tagSearchKeyword.toLowerCase()),
  );

  /** 快捷操作 */
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

  /** 渲染内容 */
  const renderContent = () => {
    if ((!projects.length && !loading) || error) {
      return (
        <Card className="border-none shadow-none">
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={FolderOpen}
              title="暂无分发项目"
              description={selectedTags.length > 0 ? '未找到符合条件的分发项目' : '点击右上方按钮创建您的第一个分发项目'}
              className="p-12 text-center"
            >
              {selectedTags.length > 0 && (
                <Button variant="outline" onClick={onClearAllFilters} className="text-xs h-8">
                  清除筛选条件
                </Button>
              )}
            </EmptyState>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return <LoadingSkeleton />;
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleCardClick}
              onDelete={handleDeleteProject}
              delay={index * 0.05}
              editButton={
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <EditDialog
                    project={project}
                    onProjectUpdated={handleProjectUpdated}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </EditDialog>
                </div>
              }
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* 标题和标签过滤器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">所有项目</h2>
          <Badge variant="secondary" className="text-xs font-bold">
            {total}
          </Badge>
        </div>

        {/* 标签筛选器 */}
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
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">标签筛选</span>
                  {selectedTags.length > 0 && (
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
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">
                      {tagSearchKeyword ? '未找到匹配的标签' : '暂无标签'}
                    </p>
                  </div>
                )}
              </div>

              {selectedTags.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">已选择的标签</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedTags.length} 个标签
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTags.map((tag) => (
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
      </div>

      {/* 当前选择的标签展示 */}
      {selectedTags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">筛选条件:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="px-2 py-0 h-6 bg-primary/5 text-primary border-primary/20 cursor-pointer"
              onClick={() => onTagToggle(tag)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={onClearAllFilters}
          >
            清除全部
          </Button>
        </div>
      )}

      {/* 内容区域 */}
      {renderContent()}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (deleting && !open) return;
          setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              确认删除项目
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除项目 &quot;
              <span className="font-medium">{projectToDelete?.name}</span>&quot;
              吗？
              <br />
              <span className="text-red-600 font-medium">
                此操作无法撤销，项目的所有数据将被永久删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteProject();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
