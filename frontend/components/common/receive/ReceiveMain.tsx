'use client';

import {useEffect, useState, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/use-auth';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {ArrowLeftIcon, AlertCircle, RefreshCw} from 'lucide-react';
import {ReceiveContent} from '@/components/common/receive';
import {EmptyState} from '@/components/common/layout/EmptyState';
import services from '@/lib/services';
import {GetProjectResponseData} from '@/lib/services/project';
import {motion} from 'motion/react';


/**
 * 加载骨架屏组件
 */
const LoadingSkeleton = () => (
  <div className="mx-auto max-w-5xl space-y-6">
    {/* 返回按钮 */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-16 -ml-2" />
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-3 border-y border-black/6 py-4 dark:border-white/[0.06] sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1" >
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-[22px] bg-muted p-4 sm:p-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-10 w-16" />
        <Skeleton className="mt-2 h-4 w-28" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[18px] bg-background/80 px-3 py-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
          <div className="rounded-[18px] bg-background/80 px-3 py-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        </div>
        <Skeleton className="mt-4 h-9 w-full rounded-full" />
      </div>
    </div>
  </div>
);

/**
 * 项目领取页面主组件
 */
export function ReceiveMain() {
  const router = useRouter();
  const params = useParams();
  const {user} = useAuth();
  const [project, setProject] = useState<GetProjectResponseData | null>(null);
  const [Loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  /**
   * 获取项目详情
   */
  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await services.project.getProjectSafe(projectId);

      if (result.success && result.data) {
        setProject(result.data);
      } else {
        setError(result.error || '获取项目详情失败');
      }
    } catch {
      setError('获取项目详情失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleGoBack = () => {
    if (window.history.length > 1 && document.referrer && document.referrer !== window.location.href) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  useEffect(() => {
    if (project?.name) {
      document.title = `${project.name} - LINUX DO CDK`;
    }
  }, [project?.name]);

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

  const contentVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {Loading ? (
        <motion.div variants={contentVariants}>
          <LoadingSkeleton />
        </motion.div>
      ) : error || !project ? (
        <motion.div className="mx-auto max-w-5xl space-y-4" variants={contentVariants}>
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="-ml-2 text-muted-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回
            </Button>
          </div>
          <EmptyState
            icon={AlertCircle}
            title="获取项目信息失败"
            description={error || '项目不存在或已被删除'}
            className="p-8 h-[400px] flex flex-col items-center justify-center text-center rounded-lg"
          >
            <Button
              onClick={fetchProject}
              variant="secondary"
              className="mt-2 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </Button>
          </EmptyState>
        </motion.div>
      ) : (
        <motion.div variants={contentVariants}>
          <ReceiveContent
            data={{
              project,
              user,
              projectId: projectId || '',
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
