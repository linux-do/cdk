'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Trash2,
  Pencil,
  Filter,
  X,
  Users,
} from 'lucide-react';
import {EditDialog, ProjectCard} from '@/components/common/project';
import {ReceiverDialog} from '@/components/common/project/ReceiverDialog';
import {EmptyState} from '@/components/common/layout/EmptyState';
import {TagFilterPopover} from '@/components/ui/tag-filter-popover';
import services from '@/lib/services';
import {ProjectListItem} from '@/lib/services/project/types';
import {motion} from 'motion/react';

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
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * 处理项目更新
   */
  const handleProjectUpdated = (updatedProject: ProjectListItem) => {
    onProjectsChange(
        (projects || []).map((p) =>
        p.id === updatedProject.id ? updatedProject : p,
        ),
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
        onProjectsChange(
            (projects || []).filter((p) => p.id !== projectToDelete.id),
        );
        onTotalChange(total - 1);

        const remainingProjects = (projects || []).length - 1;
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
  const isEmptyState = ((!(projects || []).length && !loading) || !!error);

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

  /** 渲染内容 */
  const renderContent = () => {
    if ((!(projects || []).length && !loading) || error) {
      return (
        <div className="flex h-full min-h-0 flex-1 items-center justify-center rounded-[22px] bg-muted px-6 py-12 text-center">
          <EmptyState
            icon={FolderOpen}
            title="暂无分发项目"
            description={
              (selectedTags || []).length > 0 ?
                '未找到符合条件的分发项目' :
                '点击右上方按钮创建您的第一个分发项目'
            }
            className="flex w-full flex-col items-center justify-center p-12 text-center"
          >
            {(selectedTags || []).length > 0 && (
              <Button
                variant="ghost"
                onClick={onClearAllFilters}
                className="h-8 rounded-full bg-white/70 px-3 text-xs text-foreground hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                清除筛选条件
              </Button>
            )}
          </EmptyState>
        </div>
      );
    }

    if (loading) {
      return <LoadingSkeleton />;
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(projects || []).map((project, index) => (
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
                  className="flex gap-1"
                >
                  <ReceiverDialog
                    projectId={project.id}
                    projectName={project.name}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 rounded-full p-0 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                    >
                      <Users className="size-[13px]" />
                    </Button>
                  </ReceiverDialog>
                  <EditDialog
                    project={project}
                    onProjectUpdated={handleProjectUpdated}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 rounded-full p-0 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                    >
                      <Pencil className="size-[13px]" />
                    </Button>
                  </EditDialog>
                </div>
              }
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-7 flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
            <div className="order-2 text-xs text-muted-foreground sm:order-1">
              共 {total} 个项目，第 {currentPage} / {totalPages} 页
            </div>
            <div className="order-1 flex items-center gap-2 sm:order-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="size-8 rounded-full bg-muted p-0 hover:bg-muted/80 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="size-8 rounded-full bg-muted p-0 hover:bg-muted/80 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
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
      className={`flex min-h-0 flex-1 flex-col gap-4 ${isEmptyState ? 'overflow-hidden' : ''}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="flex items-center justify-between gap-3"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-medium text-foreground">所有项目</h2>
          <div className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {total}
          </div>
        </div>

        <TagFilterPopover
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full bg-muted px-3 text-xs text-foreground hover:bg-muted/80"
            >
              <Filter className="h-4 w-4" />
              筛选标签
            </Button>
          }
          tags={tags}
          selectedTags={selectedTags}
          tagSearchKeyword={tagSearchKeyword}
          isOpen={isTagFilterOpen}
          onTagToggle={onTagToggle}
          onClearAllTags={onClearAllFilters}
          onTagSearchKeywordChange={onTagSearchKeywordChange}
          onOpenChange={onTagFilterOpenChange}
        />
      </motion.div>

      {(selectedTags || []).length > 0 && (
        <motion.div
          className="flex flex-wrap items-center gap-2"
          variants={itemVariants}
        >
          <span className="text-xs text-muted-foreground">已筛选</span>
          {(selectedTags || []).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-7 cursor-pointer rounded-full bg-muted px-2.5 py-0 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/80"
              onClick={() => onTagToggle(tag)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted/80"
            onClick={onClearAllFilters}
          >
            清除全部
          </Button>
        </motion.div>
      )}

      {/* 内容区域 */}
      <motion.div className={`flex min-h-0 flex-1 flex-col ${isEmptyState ? 'overflow-hidden' : ''}`} variants={itemVariants}>
        {renderContent()}
      </motion.div>

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
    </motion.div>
  );
}
