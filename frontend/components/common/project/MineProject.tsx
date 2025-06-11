'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {ChevronLeft, ChevronRight, FolderOpen, Trash2} from 'lucide-react';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from "@/components/ui/alert-dialog";
import {toast} from 'sonner';
import {CreateDialog} from '@/components/common/project/CreateDialog';
import {ProjectCard} from '@/components/common/project/ProjectCard';
import services from '@/lib/services';
import {ProjectListItem, ListProjectsRequest} from '@/lib/services/project/types';

export function MineProject() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageCache, setPageCache] = useState<Map<number, ProjectListItem[]>>(new Map());
  const pageSize = 12;

  /** 获取项目列表 */
  const fetchProjects = async (page: number = 1, forceRefresh: boolean = false) => {
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
      size: pageSize,
    };

    const result = await services.project.getMyProjectsSafe(params);

    if (result.success && result.data) {
      setProjects(result.data.results);
      setTotal(result.data.total);
      
      setPageCache(prev => new Map(prev.set(page, result.data!.results)));
    } else {
      setError(result.error || '获取项目列表失败');
      setProjects([]);
      setTotal(0);
    }

    setLoading(false);
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
      const result = await services.project.deleteProjectSafe(projectToDelete.id);

      if (result.success) {
        toast.success('项目删除成功');
        
        setPageCache(new Map());
        
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        setTotal(prev => prev - 1);
        
        const remainingProjects = projects.length - 1;
        if (remainingProjects === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else if (remainingProjects === 0) {
          fetchProjects(1, true);
        }
      } else {
        toast.error(result.error || '删除项目失败');
      }
    } catch (error) {
      toast.error('删除项目失败');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  /** 编辑项目 */
  const handleEditProject = (project: ProjectListItem) => {
    toast.info(`编辑功能正在开发中：${project.name}`);
    console.log('编辑项目:', project);
  };

  /** 点击卡片跳转到项目页面 */
  const handleCardClick = (project: ProjectListItem) => {
    router.push(`/receive/${project.id}`);
  };

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage]);

  const totalPages = Math.ceil(total / pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
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
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              暂无项目
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              您还没有创建任何项目，点击下方按钮创建您的第一个项目
            </p>
            <CreateDialog />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onClick={handleCardClick}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (deleting && !open) return;
        setDeleteDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              确认删除项目
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除项目 "<span className="font-medium">{projectToDelete?.name}</span>" 吗？
              <br />
              <span className="text-red-600 font-medium">此操作无法撤销，项目的所有数据将被永久删除。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
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