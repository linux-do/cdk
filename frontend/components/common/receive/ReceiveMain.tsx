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


/**
 * 加载骨架屏组件
 */
const LoadingSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-20" />
    </div>

    <div className="flex items-start justify-between gap-4">
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-10 w-10 ml-auto" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>

    <div className="py-4">
      <Skeleton className="h-10 w-full" />
    </div>

    <div className="pt-6 border-t border-gray-200">
      <Skeleton className="h-6 w-24 mb-2" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
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
      router.push('/explore');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  return (
    <div className="space-y-6">
      {Loading ? (
        <LoadingSkeleton />
      ) : error || !project ? (
        <div className="space-y-4">
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回
            </Button>
          </div>
          <EmptyState
            icon={AlertCircle}
            title="获取项目信息失败"
            description={error || '项目不存在'}
            className="p-8 h-[400px] flex flex-col items-center justify-center text-center"
          >
            <Button onClick={fetchProject} variant="secondary" className="h-8 w-20 hover:bg-gray-200">
              <RefreshCw className="h-4 w-4" /> 重试
            </Button>
          </EmptyState>
        </div>
      ) : (
        <ReceiveContent
          data={{
            project,
            user,
            projectId: projectId || '',
          }}
        />
      )}
    </div>
  );
}
