import {useState, useEffect} from 'react';
import {FloatingDock} from '@/components/ui/floating-dock';
import {
  MessageCircleIcon,
  SendIcon,
  BarChartIcon,
  FolderIcon,
  ShoppingBag,
  PlusCircle,
  User,
  LogOutIcon,
  Wallet,
  LinkIcon,
  FolderGit2Icon,
  Book,
} from 'lucide-react';
import {useThemeUtils} from '@/hooks/use-theme-utils';
import {useAuth} from '@/hooks/use-auth';
import {CreateDialog} from '@/components/common/project/CreateDialog';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {PaymentSettingsDialog} from '@/components/common/payment';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/animate-ui/radix/dialog';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {TrustLevel} from '@/lib/services/core';

const IconOptions = {
  className: 'h-4 w-4',
} as const;

/**
 * 获取信任等级对应的文本描述
 */
function getTrustLevelText(level: number): string {
  switch (level) {
    case TrustLevel.NEW_USER:
      return '新用户';
    case TrustLevel.BASIC_USER:
      return '基本用户';
    case TrustLevel.USER:
      return '成员';
    case TrustLevel.ACTIVE_USER:
      return '活跃用户';
    case TrustLevel.LEADER:
      return '领导者';
    default:
      return '未知';
  }
}

function getTrustLevelShort(level: number): string | null {
  if (level <= TrustLevel.NEW_USER) return null;
  return `TL${level}`;
}

const SystemTheme = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export function ManagementBar() {
  const themeUtils = useThemeUtils();
  const {user, isLoading, logout} = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOpenPaymentSettings = () => {
      setProfileOpen(false);
      setPaymentOpen(true);
    };

    window.addEventListener('linux-do-cdk:open-payment-settings', handleOpenPaymentSettings);
    return () => {
      window.removeEventListener('linux-do-cdk:open-payment-settings', handleOpenPaymentSettings);
    };
  }, []);

  const handleLogout = () => {
    logout('/login').catch((error) => {
      console.error('登出失败:', error);
    });
  };

  const dockItems = [
    {
      title: '实时数据',
      icon: <BarChartIcon {...IconOptions} />,
      href: '/dashboard',
    },
    {
      title: '我的项目',
      icon: <FolderIcon {...IconOptions} />,
      href: '/project',
    },
    {
      title: '我的领取',
      icon: <ShoppingBag {...IconOptions} />,
      href: '/received',
    },
    {
      title: 'divider',
      icon: <div />,
    },
    {
      title: '快速创建',
      icon: <PlusCircle {...IconOptions} />,
      customComponent: (
        <CreateDialog>
          <div className="w-full h-full flex items-center justify-center cursor-pointer rounded transition-colors">
            <PlusCircle className="h-4 w-4" />
          </div>
        </CreateDialog>
      ),
    },
    {
      title: '个人信息',
      icon: <User {...IconOptions} />,
      customComponent: (
        <>
          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogTrigger asChild>
              <div className="w-full h-full flex items-center justify-center cursor-pointer rounded transition-colors">
                <User className="h-4 w-4" />
              </div>
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="max-w-[520px] rounded-[24px] border border-border/50 bg-background/95 p-0 shadow-[0_24px_60px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.03] dark:bg-background dark:shadow-[0_24px_60px_rgba(0,0,0,0.42)] dark:ring-white/[0.04]"
            >
              <DialogHeader className="px-5 pt-4">
                <DialogTitle className="text-lg font-semibold tracking-tight">个人信息</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  管理账户信息、主题偏好和支付设置
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[min(72vh,560px)]">
                <div className="space-y-5 px-5 pb-4">
                  {!isLoading && user && (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="size-12 rounded-full">
                              <AvatarImage src={user.avatar_url} alt={user.username} />
                              <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">
                                {user.username?.slice(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-[15px] font-semibold text-foreground">
                                {user.nickname || user.username}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                @{user.username}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {user.trust_level !== undefined && getTrustLevelShort(user.trust_level) && (
                                  <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                                    {getTrustLevelShort(user.trust_level)}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                                  {user.trust_level !== undefined ? getTrustLevelText(user.trust_level) : '未知'}
                                </Badge>
                                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                                  ID {user.id}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={handleLogout}
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full"
                          >
                            <LogOutIcon className="size-3.5" />
                          </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="text-[11px] font-medium text-muted-foreground">社区分数</div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2">
                              <BarChartIcon className="size-3.5 text-foreground/60" />
                              <span className="text-xs font-medium text-foreground">分数</span>
                              <span className="text-xs font-medium text-foreground">
                                <CountingNumber
                                  number={user.score || 0}
                                  fromNumber={0}
                                  inView={true}
                                  transition={{stiffness: 200, damping: 25}}
                                />
                              </span>
                            </div>
                          </div>
                        </div>

                        {mounted && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-medium text-muted-foreground">系统设置</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={themeUtils.toggle}
                                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                              >
                                <div className="flex items-center gap-2">
                                  {themeUtils.getIcon('size-3.5 text-foreground/60')}
                                  <span className="text-xs font-medium text-foreground">
                                    {themeUtils.getSystemTheme() === SystemTheme.LIGHT ? '浅色模式' : '深色模式'}
                                  </span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                              >
                                <div className="flex items-center gap-2">
                                  <Wallet className="size-3.5 text-foreground/60" />
                                  <span className="text-xs font-medium text-foreground">
                                    商户配置
                                  </span>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-muted-foreground">快速链接</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="https://linux.do"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <LinkIcon className="size-3.5 text-foreground/60" />
                          <span className="text-xs font-medium text-foreground">LINUX DO</span>
                        </div>
                      </Link>
                      <Link
                        href="https://credit.linux.do"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="size-3.5 text-foreground/60" />
                          <span className="text-xs font-medium text-foreground">Credit</span>
                        </div>
                      </Link>
                      <Link
                        href="https://wiki.linux.do"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <Book className="size-3.5 text-foreground/60" />
                          <span className="text-xs font-medium text-foreground">Wiki</span>
                        </div>
                      </Link>
                      <Link
                        href="https://github.com/linux-do/cdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <FolderGit2Icon className="size-3.5 text-foreground/60" />
                          <span className="text-xs font-medium text-foreground">GitHub</span>
                        </div>
                      </Link>
                      <Link
                        href="https://github.com/linux-do/cdk/issues/new/choose"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircleIcon className="size-3.5 text-foreground/60" />
                          <span className="text-xs font-medium text-foreground">Issues</span>
                        </div>
                      </Link>
                      <Link
                        href="https://t.me/linuxdocdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <SendIcon className="size-3.5 text-foreground/60" />
                          <span className="text-xs font-medium text-foreground">Telegram</span>
                        </div>
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-xs font-medium">关于 LINUX DO CDK</div>
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-light text-muted-foreground">Version 1.2.3, Build At 2026-04-22</div>
                      <div className="text-[11px] font-light leading-5 text-muted-foreground">
                      LINUX DO CDK 是一个为 Linux Do 社区打造的内容分发工具平台，旨在提供快速、安全、便捷的 CDK 分享服务。平台支持多种分发方式，具备完善的用户权限管理和风险控制机制。
                      </div>
                    </div>
                  </div>

                  {!isLoading && !user && (
                    <div className="rounded-2xl bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
                      未登录用户
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <PaymentSettingsDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
        </>
      ),
    },
  ];

  return (
    <div className="fixed z-50 bottom-4 right-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto">
      <FloatingDock
        items={dockItems}
        desktopClassName="bg-background/70 backdrop-blur-md border border-border/40 shadow-lg shadow-black/10 dark:shadow-white/5 h-16 pb-3 px-4 gap-2"
        mobileButtonClassName="bg-background/70 backdrop-blur-md border border-border/40 shadow-lg shadow-black/10 dark:shadow-white/5 h-12 w-12"
      />
    </div>
  );
}
