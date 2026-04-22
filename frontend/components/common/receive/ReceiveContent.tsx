'use client';

import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {AvatarGroup, AvatarGroupTooltip} from '@/components/animate-ui/components/animate/avatar-group';
import {CURRENCY_LABEL, DISTRIBUTION_MODE_NAMES, TRUST_LEVEL_OPTIONS} from '@/components/common/project';
import {ArrowLeftIcon, Copy, Gift, Clock, AlertCircle, Package, Coins, Loader2, CalendarRange, Hash} from 'lucide-react';
import ContentRender from '@/components/common/markdown/ContentRender';
import {ReportButton} from '@/components/common/receive/ReportButton';
import {ReceiveVerify, ReceiveVerifyRef} from '@/components/common/receive/ReceiveVerify';
import services from '@/lib/services';
import {BasicUserInfo} from '@/lib/services/core';
import {GetProjectResponseData} from '@/lib/services/project';
import {formatDate, formatDateTimeWithSeconds, copyToClipboard} from '@/lib/utils';
import {motion} from 'motion/react';
import {Separator} from '@/components/ui/separator';
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
  isVerifying,
  onReceive,
}: ReceiveButtonProps) => {
  const now = currentTime;
  const startTime = new Date(project.start_time);
  const endTime = new Date(project.end_time);

  if (now < startTime) {
    const timeRemaining = getTimeRemainingText(startTime, now);
    return (
      <Button disabled className="h-9 w-full cursor-not-allowed rounded-full bg-muted text-muted-foreground shadow-none">
        <Clock className="w-4 h-4 mr-2" />
        时间未到 {timeRemaining ? `(${timeRemaining})` : ''}
      </Button>
    );
  }

  if (now > endTime) {
    return (
      <Button disabled className="h-9 w-full cursor-not-allowed rounded-full bg-muted text-muted-foreground shadow-none">
        <AlertCircle className="w-4 h-4 mr-2" />
        项目已结束
      </Button>
    );
  }

  if (project.available_items_count <= 0) {
    return (
      <Button disabled className="h-9 w-full cursor-not-allowed rounded-full bg-muted text-muted-foreground shadow-none">
        <Package className="w-4 h-4 mr-2" />
        库存已空
      </Button>
    );
  }

  if (!user || user.trust_level < project.minimum_trust_level) {
    return (
      <Button disabled className="h-9 w-full cursor-not-allowed rounded-full bg-muted text-muted-foreground shadow-none">
        <AlertCircle className="w-4 h-4 mr-2" />
        信任等级不足
      </Button>
    );
  }

  if (project.is_completed) {
    return (
      <Button disabled className="h-9 w-full cursor-not-allowed rounded-full bg-muted text-muted-foreground shadow-none">
        <Package className="w-4 h-4 mr-2" />
        项目已完成
      </Button>
    );
  }

  const priceNum = Number(project.price || '0');
  const isPaid = priceNum > 0;

  return (
    <Button
      onClick={onReceive}
      disabled={isVerifying}
      className="h-9 w-full rounded-full shadow-none"
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

function ReceivedContentPanel({receivedContent}: {receivedContent: string}) {
  const contentItems = receivedContent.split('$\n*').filter(Boolean);

  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-medium text-muted-foreground">领取内容</div>
      <div className="space-y-2">
        {contentItems.map((item, index) => (
          <div key={index} className="flex min-w-0 items-center justify-between gap-2 rounded-[18px] bg-background/80 px-3 py-2.5">
            <code className="block break-all text-[13px] font-semibold text-foreground">
              {item}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-7 w-7 flex-shrink-0 rounded-full p-0"
              onClick={() => {
                const cleanContent = item.replace(/^[\u4e00-\u9fa5\w]+\d*:\s*/, '');
                copyToClipboard(cleanContent);
                toast.success('复制成功');
              }}
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VolunteerBanner() {
  const [items, setItems] = useState<VolunteerItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      try {
        const response = await fetch('/heart.json');
        if (!response.ok) return;
        const data = await response.json() as VolunteerItem[];
        if (!cancelled && Array.isArray(data)) {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setItems(shuffled.slice(0, 6));
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      }
    };

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium text-muted-foreground">LINUX DO 公益广告 (Beta)</div>
      <AvatarGroup className="h-10 w-24 -space-x-2">
        {items.map((item) => (
          <Avatar key={item.detailUrl} onClick={() => window.open(item.detailUrl, '_blank')}>
            <AvatarImage src={item.photoUrl} alt={item.name} />
            <AvatarFallback>{item.name.slice(0, 1)}</AvatarFallback>
            <AvatarGroupTooltip>
              <Image src={item.photoUrl} alt={item.name} width={96} height={96} className="h-24 w-24 object-cover" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">{item.categoryName} · {item.name}</span>
                <span className="text-xs text-muted">走失时间：{item.lostDay}</span>
                <span className="text-xs text-muted">走失地点：{item.lostAddress}</span>
                {item.feature && (
                  <>
                    <span className="text-xs text-muted">特征：{item.feature}</span>
                  </>
                )}
              </div>
            </AvatarGroupTooltip>
          </Avatar>
        ))}
      </AvatarGroup>
    </div>
  );
}

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

interface VolunteerItem {
  name: string;
  sex: string;
  birthDay: string;
  lostDay: string;
  lostAddress: string;
  lostHeight: string;
  feature: string;
  photoUrl: string;
  detailUrl: string;
  categoryName: string;
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
  const distributionModeName = DISTRIBUTION_MODE_NAMES[currentProject.distribution_type] || '分发项目';
  const startTime = new Date(currentProject.start_time);
  const endTime = new Date(currentProject.end_time);
  const receivedCount = Math.max(currentProject.total_items - currentProject.available_items_count, 0);
  const projectContentItems = receivedContent?.split('$\n*').filter(Boolean) || [];
  const statusLabel = currentProject.is_completed ?
    '已完成' :
    hasReceived ?
    '已领取' :
    currentTime < startTime ?
      '未开始' :
      currentTime > endTime ?
        '已结束' :
        currentProject.available_items_count <= 0 ?
          '已领完' :
          '进行中';
  const createdAtText = formatDate(currentProject.created_at);
  const metaItems = [
    {
      label: '分发人',
      value: currentProject.creator_nickname || currentProject.creator_username,
      href: `https://linux.do/u/${currentProject.creator_username}/summary`,
    },
    {
      label: '分发模式',
      value: distributionModeName,
    },
    {
      label: '社区分数',
      value: `${100 - currentProject.risk_level}`,
    },
    {
      label: '信任等级',
      value: trustLevelConfig?.label || '无限制',
    },
    {
      label: '消耗 LDC',
      value: Number(currentProject.price || '0') > 0 ? currentProject.price || '0' : '免费',
    },
    {
      label: 'IP 规则',
      value: currentProject.allow_same_ip ? '允许同 IP' : '限制同 IP',
    },
  ];

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
      className="mx-auto max-w-5xl space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex items-center justify-between" variants={headerVariants}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          返回
        </Button>
      </motion.div>

      {isAwaitingPayment && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-[22px] bg-muted px-4 py-3 text-sm text-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>付款处理中,CDK 将在回调成功后自动发放。如长时间未到账,可刷新页面重试。</span>
        </motion.div>
      )}

      <motion.div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]" variants={itemVariants}>
        <div className="min-w-0 space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-[26px] font-bold tracking-tight text-foreground sm:text-[30px]">
                {currentProject.name}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>共 {currentProject.total_items} 项内容</span>
                <span className="text-muted-foreground/50">/</span>
                <span>剩余 {currentProject.available_items_count} 项</span>
                <span className="text-muted-foreground/50">/</span>
                <span>创建于 {createdAtText}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentProject.tags && currentProject.tags.length > 0 ? (
                currentProject.tags.slice(0, 10).map((tag) => (
                  <Badge key={tag} variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium">
                    <Hash className="mr-1 size-3" />
                    {tag}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium">
                  <Hash className="mr-1 size-3" />
                  无标签
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 border-y border-black/6 py-3 dark:border-white/[0.06]">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground">
              项目摘要
            </div>
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {metaItems.map((item) => {
                const content = (
                  <div className="grid grid-cols-[72px_minmax(0,1fr)] items-baseline gap-3 py-1">
                    <div className="text-[11px] font-medium tracking-wide text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="min-w-0 text-[14px] font-semibold leading-5 text-foreground">
                      <span className="block truncate">
                        {item.value}
                        {item.label === '消耗 LDC' && item.value !== '免费' ? ` ${CURRENCY_LABEL}` : ''}
                      </span>
                    </div>
                  </div>
                );

                return item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block min-w-0 transition-colors hover:text-foreground"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={item.label} className="min-w-0">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground">项目内容</div>
            {projectContentItems.length > 0 ? (
              <div className="space-y-2">
                {projectContentItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-[16px] bg-muted/55 px-3 py-2 text-[13px] font-medium text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] bg-muted/45 px-3 py-2 text-[13px] font-medium text-muted-foreground">
                请先领取 CDK
              </div>
            )}
          </div>

          <div className="h-px w-full bg-black/6 dark:bg-white/[0.06]" />

          <div className="space-y-2">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground">项目描述</div>
            <ContentRender
              content={currentProject.description || '暂无项目描述'}
              className="markdown-content text-[14px] leading-6 text-foreground/90"
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-4">
            <div className="space-y-4 rounded-[22px] bg-muted/70 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-muted-foreground">领取状态</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {receivedCount} / {currentProject.total_items}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    已领取 {receivedCount} 项，共 {currentProject.total_items} 项
                  </div>
                </div>
                <Badge variant="secondary" className="h-6 rounded-full px-2.5 text-[11px] font-medium">
                  <CalendarRange className="mr-1 size-3.5" />
                  {statusLabel}
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[18px] bg-background/80 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-muted-foreground">开始时间</div>
                  <div className="mt-1 text-xs font-medium text-foreground">
                    {formatDateTimeWithSeconds(currentProject.start_time)}
                  </div>
                </div>
                <div className="rounded-[18px] bg-background/80 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-muted-foreground">结束时间</div>
                  <div className="mt-1 text-xs font-medium text-foreground">
                    {formatDateTimeWithSeconds(currentProject.end_time)}
                  </div>
                </div>
              </div>

              <Separator className="bg-black/6 dark:bg-white/[0.06]" />

              <div className="space-y-2.5">
                <div className="text-[11px] font-medium text-muted-foreground">领取操作</div>
                <ReceiveButton
                  project={currentProject}
                  user={user}
                  currentTime={currentTime}
                  isVerifying={isVerifying}
                  onReceive={handleReceive}
                />
              </div>

              {hasReceived && receivedContent && (
                <>
                  <Separator className="bg-black/6 dark:bg-white/[0.06]" />
                  <ReceivedContentPanel receivedContent={receivedContent} />
                </>
              )}

              <div className="flex justify-end pt-1">
                <ReportButton
                  projectId={projectId}
                  user={user}
                  hasReported={false}
                  variant="text"
                />
              </div>
            </div>

            <VolunteerBanner />
          </div>
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
