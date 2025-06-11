'use client';

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/use-auth';
import services from '@/lib/services';
import {GetProjectResponseData} from '@/lib/services/project';
import {TrustLevel} from '@/lib/services/core';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {ArrowLeftIcon, Copy, Tag, Gift, Clock, AlertCircle, Package} from 'lucide-react';
import {toast} from 'sonner';

/**
 * 项目领取状态
 */
interface ReceiveState {
  isReceiving: boolean;
  hasReceived: boolean;
  receivedContent: string | null;
  receivedAt: string | null;
}

/** 信任等级选项列表 */
const trustLevelOptions = [
  {value: TrustLevel.NEW_USER, label: '新用户'},
  {value: TrustLevel.BASIC_USER, label: '基础用户'},
  {value: TrustLevel.USER, label: '普通用户'},
  {value: TrustLevel.ACTIVE_USER, label: '活跃用户'},
  {value: TrustLevel.LEADER, label: '领导者'},
];

/** 获取时间剩余文本 */
const getTimeRemainingText = (startTime: Date, currentTime: Date): string | null => {
  const diff = startTime.getTime() - currentTime.getTime();
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) return `还剩${days}天${hours}小时`;
  if (hours > 0) return `还剩${hours}小时${minutes}分钟`;
  if (minutes > 0) return `还剩${minutes}分${seconds}秒`;
  return `还剩${seconds}秒`;
};

/** 格式化日期时间 */
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('复制成功');
  } catch {
    toast.error('复制失败');
  }
};

/** 项目数据获取Hook */
const useProjectData = (projectId: string | undefined, isAuthenticated: boolean, authLoading: boolean) => {
  const [project, setProject] = useState<GetProjectResponseData | null>(null);
  const [receiveStatus, setReceiveStatus] = useState<ReceiveState>({
    isReceiving: false,
    hasReceived: false,
    receivedContent: null,
    receivedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetails = async () => {
    if (!projectId || !isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await services.project.getProjectSafe(projectId);
      
      if (result.success && result.data) {
        setProject(result.data);
        
        // TODO: 后端字段增加后，从 API 获取用户的领取状态

      } else {
        setError(result.error || '获取项目详情失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取项目详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && projectId) {
      fetchProjectDetails();
    }
  }, [authLoading, isAuthenticated, projectId]);

  return {
    project,
    receiveStatus,
    setReceiveStatus,
    isLoading,
    error,
    refetch: fetchProjectDetails,
    setProject,
  };
};

/** 项目领取Hook */
const useReceiveProject = (
  projectId: string | undefined,
  setProject: React.Dispatch<React.SetStateAction<GetProjectResponseData | null>>,
  setReceiveStatus: (status: ReceiveState) => void,
) => {
  const [receiveState, setReceiveState] = useState<ReceiveState>({
    isReceiving: false,
    hasReceived: false,
    receivedContent: null,
    receivedAt: null,
  });

  const handleReceive = async () => {
    if (!projectId || receiveState.isReceiving) return;

    try {
      setReceiveState(prev => ({...prev, isReceiving: true}));

      const result = await services.project.receiveProjectSafe(projectId);

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          available_items_count: prev.available_items_count - 1,
        } : null);
        
        // TODO: 后端字段增加后，使用实际返回的内容
        const receivedContent = '您的兑换码'; // result.data?.content
        
        setReceiveState({
          isReceiving: false,
          hasReceived: true,
          receivedContent,
          receivedAt: new Date().toISOString(),
        });
        
        setReceiveStatus({
          isReceiving: false,
          hasReceived: true,
          receivedContent,
          receivedAt: new Date().toISOString(),
        });
        
        toast.success('领取成功！');
      } else {
        setReceiveState(prev => ({...prev, isReceiving: false}));
        toast.error(result.error || '领取失败');
      }
    } catch (err) {
      setReceiveState(prev => ({...prev, isReceiving: false}));
      const errorMessage = err instanceof Error ? err.message : '领取失败';
      toast.error(errorMessage);
    }
  };

  return {receiveState, handleReceive};
};

const ReceiveButton = ({
  project,
  user,
  currentTime,
  receiveState,
  receiveStatus,
  onReceive,
}: {
  project: GetProjectResponseData;
  user: any;
  currentTime: Date;
  receiveState: ReceiveState;
  receiveStatus: ReceiveState;
  onReceive: () => void;
}) => {
  if (receiveStatus.hasReceived || receiveState.hasReceived) {
    const content = receiveStatus.receivedContent || receiveState.receivedContent;
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">您的兑换码：</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(content!)}
              className="h-8 px-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <code className="block font-mono text-lg">{content}</code>
        </div>
      </div>
    );
  }

  const now = currentTime;
  const startTime = new Date(project.start_time);
  const endTime = new Date(project.end_time);

  if (now < startTime) {
    const timeRemaining = getTimeRemainingText(startTime, now);
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
        <Clock className="w-4 h-4 mr-2" />
        时间未到无法领取 {timeRemaining ? `(${timeRemaining})` : ''}
      </Button>
    );
  }

  if (now > endTime) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
        <AlertCircle className="w-4 h-4 mr-2" />
        项目已结束
      </Button>
    );
  }

  if (project.available_items_count <= 0) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
        <Package className="w-4 h-4 mr-2" />
        库存已空
      </Button>
    );
  }

  if (user.trust_level < project.minimum_trust_level) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed">
        <AlertCircle className="w-4 h-4 mr-2" />
        信任等级不足
      </Button>
    );
  }

  return (
    <Button
      onClick={onReceive}
      disabled={receiveState.isReceiving}
      className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
    >
      <Gift className="w-4 h-4 mr-2" />
      {receiveState.isReceiving ? '领取中...' : '立即领取'}
    </Button>
  );
};

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

const ErrorState = ({error, onRetry, onBack}: {error: string; onRetry: () => void; onBack: () => void}) => (
  <div className="max-w-4xl mx-auto p-6">
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="mb-6 text-gray-600 hover:text-gray-900"
    >
      <ArrowLeftIcon className="h-4 w-4 mr-2" />
      返回
    </Button>
    
    <div className="text-center py-12">
      <h2 className="text-lg font-medium text-gray-900 mb-2">获取项目信息失败</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <Button onClick={onRetry} variant="outline">
        重试
      </Button>
    </div>
  </div>
);

export function ReceiveMain() {
  const router = useRouter();
  const params = useParams();
  const {isAuthenticated, user, isLoading: authLoading} = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  
  const {
    project,
    receiveStatus,
    setReceiveStatus,
    isLoading,
    error,
    refetch,
    setProject,
  } = useProjectData(projectId, isAuthenticated, authLoading);
  
  const {receiveState, handleReceive} = useReceiveProject(
    projectId,
    setProject,
    setReceiveStatus,
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && projectId) {
      router.push(`/login?redirect=/receive/${projectId}`);
    }
  }, [authLoading, isAuthenticated, projectId, router]);

  if (!authLoading && !isAuthenticated) return null;
  if (authLoading || isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} onBack={() => router.back()} />;
  if (!project) return <ErrorState error="项目不存在" onRetry={refetch} onBack={() => router.back()} />;

  const trustLevelConfig = trustLevelOptions.find(option => option.value === project.minimum_trust_level);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground -ml-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          返回
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="text-left space-y-4">
          <div className="text-4xl font-bold text-black">{project.name}</div>
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 10).map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag className="h-4 w-4 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDateTime(project.start_time)} - {formatDateTime(project.end_time)}
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="text-sm text-muted-foreground">剩余名额</div>
          <div className="text-3xl font-bold text-black">{project.available_items_count}</div>
          <div className="text-sm text-muted-foreground">共 {project.total_items} 个</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">发布人</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{project.creator_nickname}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">风险等级</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{project.risk_level}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">信任等级</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{trustLevelConfig?.label}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">IP 限制</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {project.allow_same_ip ? '允许同一 IP' : '限制同一 IP'}
          </div>
        </div>
      </div>

      <div className="py-4">
        <ReceiveButton
          project={project}
          user={user}
          currentTime={currentTime}
          receiveState={receiveState}
          receiveStatus={receiveStatus}
          onReceive={handleReceive}
        />
      </div>

      {project.description && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-medium mb-2">项目描述</h3>
          <p className="text-gray-600 leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
} 