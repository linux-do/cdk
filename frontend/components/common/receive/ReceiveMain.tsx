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
  <div className="max-w-4xl mx-auto space-y-6">
    {/* 返回按钮 */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-16 -ml-2 -mt-8" />
    </div>

    {/* 项目标题和剩余数量 */}
    <div className="flex items-start justify-between gap-4">
      <div className="text-left space-y-4 flex-1">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-10 w-16 ml-auto" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
    </div>

    {/* 项目信息卡片 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>

    {/* 领取按钮或领取成功显示 */}
    <div className="py-4">
      <Skeleton className="h-10 w-full rounded-md" />
    </div>

    {/* 项目描述 */}
    <div className="pt-6 border-t border-gray-200">
      <Skeleton className="h-6 w-24 mb-3" />
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
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
        <motion.div className="space-y-4 max-w-4xl mx-auto" variants={contentVariants}>
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-muted-foreground -ml-2 -mt-8"
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
