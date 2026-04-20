'use client';

import React, {useState, useEffect, useRef} from 'react';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {CURRENCY_LABEL, TRUST_LEVEL_OPTIONS} from '@/components/common/project';
import {ArrowLeftIcon, Copy, Tag, Gift, Clock, AlertCircle, Package, Coins, Loader2} from 'lucide-react';
import ContentRender from '@/components/common/markdown/ContentRender';
import {ReportButton} from '@/components/common/receive/ReportButton';
import {ReceiveVerify, ReceiveVerifyRef} from '@/components/common/receive/ReceiveVerify';
import services from '@/lib/services';
import {BasicUserInfo} from '@/lib/services/core';
import {GetProjectResponseData} from '@/lib/services/project';
import {formatDateTimeWithSeconds, copyToClipboard} from '@/lib/utils';
import {motion} from 'motion/react';


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
 * 项目领取按钮组件的 Props 接口
 */
interface ReceiveButtonProps {
  project: GetProjectResponseData;
  user: BasicUserInfo | null;
  currentTime: Date;
  hasReceived: boolean;
  receivedContent: string | null;
  isVerifying: boolean;
  onReceive: () => void;
}

/**
 * 项目领取按钮组件
 */
const ReceiveButton = ({
  project,
  user,
  currentTime,
  hasReceived,
  receivedContent,
  isVerifying,
  onReceive,
}: ReceiveButtonProps) => {
  if (hasReceived && receivedContent) {
    const contentItems = receivedContent.split('$\n*');

    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg -mt-4">
        <div className="text-xs text-muted-foreground mb-2">分发内容</div>
        <div className="space-y-2">
          {contentItems.map((item, index) => (
            <div key={index} className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <code className="block text-sm font-bold text-gray-900 dark:text-gray-100 break-all">
                {item}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="ml-3 flex-shrink-0 h-7 w-7 p-0"
                onClick={() => {
                  const cleanContent = item.replace(/^[\u4e00-\u9fa5\w]+\d*:\s*/, '');
                  copyToClipboard(cleanContent);
                  toast.success('复制成功');
                }}
              >
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          ))}
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

  const priceNum = Number(project.price || '0');
  const isPaid = priceNum > 0;

  return (
    <Button
      onClick={onReceive}
      disabled={isVerifying}
      className="w-full"
    >
      {isVerifying ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2" />
          验证中...
        </>
      ) : isPaid ? (
        <>
          <Coins className="w-4 h-4 mr-2" />
          支付 {priceNum} {CURRENCY_LABEL} 并领取
        </>
      ) : (
        <>
          <Gift className="w-4 h-4 mr-2" />
          立即领取
        </>
      )}
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
  const searchParams = useSearchParams();
  const incomingTradeNo = searchParams.get('trade_no') || '';
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasReceived, setHasReceived] = useState(project.is_received);
  const [receivedContent, setReceivedContent] = useState<string | null>(project.received_content || null);
  const [currentProject, setCurrentProject] = useState(project);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(Boolean(incomingTradeNo) && !project.is_received);
  const verifyRef = useRef<ReceiveVerifyRef>(null);

  /**
   * 检查项目是否可以领取（时间限制）
   */
  const isProjectAvailable = () => {
    const startTime = new Date(currentProject.start_time);
    const endTime = new Date(currentProject.end_time);
    return currentTime >= startTime && currentTime <= endTime;
  };

  /**
   * 处理项目领取（触发验证）
   */
  const handleReceive = () => {
    if (!projectId || hasReceived || isVerifying) return;

    // 检查项目时间
    if (!isProjectAvailable()) {
      const startTime = new Date(currentProject.start_time);
      const endTime = new Date(currentProject.end_time);

      if (currentTime < startTime) {
        toast.error('项目尚未开始，请等待开始时间');
      } else if (currentTime > endTime) {
        toast.error('项目已结束');
      }
      return;
    }

    // 触发验证
    verifyRef.current?.execute();
  };

  /**
   * 验证成功后处理
   */
  const handleVerifySuccess = async (token: string) => {
    // 调用领取接口
    const result = await services.project.receiveProjectSafe(projectId, token);

    if (!result.success) {
      toast.error(result.error || '领取失败');
      throw new Error(result.error || '领取失败');
    }

    // 付费项目:后端返回支付跳转 URL,浏览器直接跳转
    if (result.data?.require_payment && result.data.pay_url) {
      toast.info('正在跳转支付页面...');
      window.location.href = result.data.pay_url;
      return;
    }

    const content = result.data?.itemContent || '领取成功，但未获取到兑换内容';

    setCurrentProject((prev) => ({
      ...prev,
      available_items_count: prev.available_items_count - 1,
      is_received: true,
      received_content: content,
    }));

    setHasReceived(true);
    setReceivedContent(content);
    toast.success('领取成功！');
  };

  /**
   * 验证开始回调
   */
  const handleVerifyStart = () => {
    setIsVerifying(true);
  };

  /**
   * 验证结束回调
   */
  const handleVerifyEnd = () => {
    setIsVerifying(false);
  };

  const handleGoBack = () => {
    if (window.history.length > 1 && document.referrer && document.referrer !== window.location.href) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 从支付系统回跳后,轮询项目详情直到发放到账或超时
  useEffect(() => {
    if (!isAwaitingPayment || !projectId) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15; // ~30 秒
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      const res = await services.project.getProjectSafe(projectId);
      if (cancelled) return;
      if (res.success && res.data?.is_received) {
        setCurrentProject(res.data);
        setHasReceived(true);
        setReceivedContent(res.data.received_content || null);
        setIsAwaitingPayment(false);
        toast.success('付款完成,CDK 已发放');
        return;
      }
      if (attempts >= maxAttempts) {
        setIsAwaitingPayment(false);
        toast.info('付款处理中,稍后请手动刷新查看');
        return;
      }
      setTimeout(tick, 2000);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [isAwaitingPayment, projectId]);

  const trustLevelConfig = TRUST_LEVEL_OPTIONS.find((option) => option.value === currentProject.minimum_trust_level);

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

  const itemVariants = {
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

  const headerVariants = {
    hidden: {opacity: 0, y: 15},
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex items-center justify-between" variants={headerVariants}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="text-muted-foreground -ml-2 -mt-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          返回
        </Button>
      </motion.div>

      {isAwaitingPayment && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-900 px-4 py-3 text-sm text-blue-900 dark:text-blue-200"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>付款处理中,CDK 将在回调成功后自动发放。如长时间未到账,可刷新页面重试。</span>
        </motion.div>
      )}

      <motion.div className="flex items-start justify-between gap-4" variants={itemVariants}>
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
          <div className="text-4xl font-bold">{currentProject.available_items_count}</div>
          <div className="text-sm text-muted-foreground">共 {currentProject.total_items} 个</div>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3" variants={itemVariants}>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">发布人</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Link
              href={`https://linux.do/u/${currentProject.creator_username}/summary`}
              target='_blank'
              rel='noopener noreferrer'
            >
              {currentProject.creator_nickname || currentProject.creator_username}
            </Link>
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">最低用户分数</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{100 - currentProject.risk_level}</div>
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
      </motion.div>

      <motion.div className="py-4" variants={itemVariants}>
        <ReceiveButton
          project={currentProject}
          user={user}
          currentTime={currentTime}
          hasReceived={hasReceived}
          receivedContent={receivedContent}
          isVerifying={isVerifying}
          onReceive={handleReceive}
        />
      </motion.div>

      <motion.div className="pt-6 border-t border-gray-200" variants={itemVariants}>
        <h3 className="font-medium mb-3">项目描述</h3>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ContentRender
            content={currentProject.description}
            className="text-gray-700 dark:text-gray-200 leading-relaxed markdown-content"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <hr className="border-t border-gray-200 dark:border-gray-700" />
        <div className="pt-4">
          <ReportButton
            projectId={projectId}
            user={user}
            hasReported={false}
            variant="text"
          />
        </div>
      </motion.div>

      {/* 验证组件 */}
      <ReceiveVerify
        ref={verifyRef}
        onVerify={handleVerifySuccess}
        onVerifyStart={handleVerifyStart}
        onVerifyEnd={handleVerifyEnd}
      />
    </motion.div>
  );
}
