'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {TRUST_LEVEL_OPTIONS} from '@/components/common/project';
import {ArrowLeftIcon, Copy, Tag, Gift, Clock, AlertCircle, Package} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import services from '@/lib/services';
import {BasicUserInfo} from '@/lib/services/core';
import {GetProjectResponseData} from '@/lib/services/project';
import {formatDateTimeWithSeconds, copyToClipboard} from '@/lib/utils';


/**
 * 计算时间剩余显示文本
 */
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

/**
 * 项目领取按钮组件
 */
const ReceiveButton = ({
  project,
  user,
  currentTime,
  isReceiving,
  hasReceived,
  receivedContent,
  onReceive,
}: {
  project: GetProjectResponseData;
  user: BasicUserInfo | null;
  currentTime: Date;
  isReceiving: boolean;
  hasReceived: boolean;
  receivedContent: string | null;
  onReceive: () => void;
}) => {
  if (hasReceived && receivedContent) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">您的兑换码：</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await copyToClipboard(receivedContent);
                  toast.success('复制成功');
                } catch {
                  toast.error('复制失败');
                }
              }}
              className="h-8 px-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <code className="block font-mono text-lg">{receivedContent}</code>
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
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400">
        <Clock className="w-4 h-4 mr-2" />
        时间未到 {timeRemaining ? `(${timeRemaining})` : ''}
      </Button>
    );
  }

  if (now > endTime) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400">
        <AlertCircle className="w-4 h-4 mr-2" />
        项目已结束
      </Button>
    );
  }

  if (project.available_items_count <= 0) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400">
        <Package className="w-4 h-4 mr-2" />
        库存已空
      </Button>
    );
  }

  if (!user || user.trust_level < project.minimum_trust_level) {
    return (
      <Button disabled className="w-full bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400">
        <AlertCircle className="w-4 h-4 mr-2" />
        信任等级不足
      </Button>
    );
  }

  return (
    <Button
      onClick={onReceive}
      disabled={isReceiving}
      className="w-full bg-black text-white disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-800 dark:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 dark:hover:bg-gray-700"
    >
      <Gift className="w-4 h-4 mr-2" />
      {isReceiving ? '领取中...' : '立即领取'}
    </Button>
  );
};

/**
 * ReceiveContent 组件的 Props 接口
 */
interface ReceiveContentProps {
  data: {
    project: GetProjectResponseData;
    user: BasicUserInfo | null;
    projectId: string;
  };
}

/**
 * 项目接收内容组件
 */
export function ReceiveContent({data}: ReceiveContentProps) {
  const {project, user, projectId} = data;
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isReceiving, setIsReceiving] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);
  const [receivedContent, setReceivedContent] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState(project);

  /**
   * 处理项目领取
   */
  const handleReceive = async () => {
    if (!projectId || isReceiving || hasReceived) return;

    try {
      setIsReceiving(true);

      const result = await services.project.receiveProjectSafe(projectId);

      if (result.success) {
        setCurrentProject((prev) => ({
          ...prev,
          available_items_count: prev.available_items_count - 1,
        }));

        const content = '您的兑换码';
        setHasReceived(true);
        setReceivedContent(content);
        toast.success('领取成功！');
      } else {
        toast.error(result.error || '领取失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '领取失败';
      toast.error(errorMessage);
    } finally {
      setIsReceiving(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1 && document.referrer && document.referrer !== window.location.href) {
      router.back();
    } else {
      router.push('/explore');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const trustLevelConfig = TRUST_LEVEL_OPTIONS.find((option) => option.value === currentProject.minimum_trust_level);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="text-muted-foreground -ml-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          返回
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="text-left space-y-4">
          <div className="text-4xl font-bold">{currentProject.name}</div>
          <div className="flex flex-wrap gap-2">
            {currentProject.tags && currentProject.tags.length > 0 ? (
              currentProject.tags.slice(0, 10).map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Tag className="h-4 w-4 mr-1" />
                  {tag}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">
                <Tag className="h-4 w-4 mr-1" />
                无标签
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDateTimeWithSeconds(currentProject.start_time)} - {formatDateTimeWithSeconds(currentProject.end_time)}
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="text-sm text-muted-foreground">剩余名额</div>
          <div className="text-3xl font-bold">{currentProject.available_items_count}</div>
          <div className="text-sm text-muted-foreground">共 {currentProject.total_items} 个</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">发布人</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentProject.creator_nickname || currentProject.creator_username}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">风险等级</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentProject.risk_level}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">信任等级</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{trustLevelConfig?.label}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">IP 限制</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {currentProject.allow_same_ip ? '允许同一 IP' : '限制同一 IP'}
          </div>
        </div>
      </div>

      <div className="py-4">
        <ReceiveButton
          project={currentProject}
          user={user}
          currentTime={currentTime}
          isReceiving={isReceiving}
          hasReceived={hasReceived}
          receivedContent={receivedContent}
          onReceive={handleReceive}
        />
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="font-medium mb-3">项目描述</h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {currentProject.description ? (
            <div className="text-gray-600 dark:text-gray-300 leading-relaxed markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                  h2: ({children}) => <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{children}</h2>,
                  h3: ({children}) => <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">{children}</h3>,
                  p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                  li: ({children}) => <li className="text-gray-600 dark:text-gray-300">{children}</li>,
                  strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                  em: ({children}) => <em className="italic">{children}</em>,
                  code: ({children}) => <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                  pre: ({children}) => <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto text-sm">{children}</pre>,
                  blockquote: ({children}) => <blockquote className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 italic text-gray-700 dark:text-gray-400 mb-3">{children}</blockquote>,
                  a: ({href, children}) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  table: ({children}) => <div className="overflow-x-auto mb-4"><table className="min-w-full border-collapse border border-gray-400 dark:border-gray-600">{children}</table></div>,
                  thead: ({children}) => <thead className="bg-gray-200 dark:bg-gray-700">{children}</thead>,
                  tbody: ({children}) => <tbody>{children}</tbody>,
                  tr: ({children}) => <tr className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">{children}</tr>,
                  th: ({children}) => <th className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700">{children}</th>,
                  td: ({children}) => <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
                }}
              >
                {currentProject.description}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">该项目没有描述</p>
          )}
        </div>
      </div>
    </div>
  );
}
