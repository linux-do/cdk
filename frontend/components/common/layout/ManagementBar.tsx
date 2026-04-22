import {useState, useEffect, useRef, useCallback} from 'react';
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
  ChevronRight,
} from 'lucide-react';
import {useThemeUtils} from '@/hooks/use-theme-utils';
import {useAuth} from '@/hooks/use-auth';
import {CreateDialog} from '@/components/common/project/CreateDialog';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {PaymentSettingsDialog} from '@/components/common/payment';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {
  Dialog,
  DialogBody,
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

const DOCK_STORAGE_KEY = 'linux-do-cdk:dock-position';
const DOCK_TIP_STORAGE_KEY = 'linux-do-cdk:dock-tip-dismissed';
const DOCK_MARGIN = 16;
const DOCK_LONG_PRESS_MS = 180;
const DOCK_CLICK_SUPPRESS_MS = 220;
const DOCK_INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,[role="button"],[data-dock-no-drag="true"]';

type DockViewport = 'desktop' | 'mobile';

type DockPosition = {
  x: number;
  y: number;
};

type DockPositions = Partial<Record<DockViewport, DockPosition>>;

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
  const [dockViewport, setDockViewport] = useState<DockViewport>('desktop');
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [dockPosition, setDockPosition] = useState<DockPosition | null>(null);
  const [showDockTip, setShowDockTip] = useState(false);
  const [dockTipStep, setDockTipStep] = useState(0);
  const dockRef = useRef<HTMLDivElement>(null);
  const dockViewportRef = useRef<DockViewport>('desktop');
  const dragOffsetRef = useRef({x: 0, y: 0});
  const dockPressTimerRef = useRef<number | null>(null);
  const pressStartRef = useRef({x: 0, y: 0});
  const isDraggingRef = useRef(false);
  const suppressClickUntilRef = useRef(0);

  const getViewport = useCallback((): DockViewport => (window.innerWidth >= 768 ? 'desktop' : 'mobile'), []);

  const readDockPositions = useCallback((): DockPositions => {
    if (typeof window === 'undefined') return {};

    try {
      const raw = window.localStorage.getItem(DOCK_STORAGE_KEY);
      return raw ? JSON.parse(raw) as DockPositions : {};
    } catch {
      return {};
    }
  }, []);

  const writeDockPosition = useCallback((viewport: DockViewport, position: DockPosition) => {
    if (typeof window === 'undefined') return;

    const nextPositions = {
      ...readDockPositions(),
      [viewport]: position,
    };

    window.localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(nextPositions));
  }, [readDockPositions]);

  const getDockRect = useCallback(() => {
    const rect = dockRef.current?.getBoundingClientRect();
    return {
      width: rect?.width ?? (dockViewportRef.current === 'desktop' ? 420 : 52),
      height: rect?.height ?? (dockViewportRef.current === 'desktop' ? 88 : 52),
    };
  }, []);

  const clampDockPosition = useCallback((position: DockPosition): DockPosition => {
    if (typeof window === 'undefined') return position;

    const {width, height} = getDockRect();
    const maxX = Math.max(DOCK_MARGIN, window.innerWidth - width - DOCK_MARGIN);
    const maxY = Math.max(DOCK_MARGIN, window.innerHeight - height - DOCK_MARGIN);

    return {
      x: Math.min(Math.max(position.x, DOCK_MARGIN), maxX),
      y: Math.min(Math.max(position.y, DOCK_MARGIN), maxY),
    };
  }, [getDockRect]);

  const getDefaultDockPosition = useCallback((viewport: DockViewport): DockPosition => {
    if (typeof window === 'undefined') return {x: DOCK_MARGIN, y: DOCK_MARGIN};

    const {width, height} = getDockRect();
    const basePosition = viewport === 'desktop' ?
      {
        x: (window.innerWidth - width) / 2,
        y: window.innerHeight - height - DOCK_MARGIN,
      } :
      {
        x: window.innerWidth - width - DOCK_MARGIN,
        y: window.innerHeight - height - DOCK_MARGIN,
      };

    return clampDockPosition(basePosition);
  }, [clampDockPosition, getDockRect]);

  const syncDockPosition = useCallback((nextViewport?: DockViewport) => {
    if (typeof window === 'undefined') return;

    const viewport = nextViewport ?? getViewport();
    dockViewportRef.current = viewport;
    setDockViewport(viewport);

    const savedPosition = readDockPositions()[viewport];
    const nextPosition = clampDockPosition(savedPosition ?? getDefaultDockPosition(viewport));
    setDockPosition(nextPosition);
  }, [clampDockPosition, getDefaultDockPosition, getViewport, readDockPositions]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const dismissed = window.localStorage.getItem(DOCK_TIP_STORAGE_KEY) === 'true';
    if (!dismissed) {
      setShowDockTip(true);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const frameId = window.requestAnimationFrame(() => {
      syncDockPosition();
    });

    const handleResize = () => {
      window.requestAnimationFrame(() => {
        const viewport = getViewport();
        const savedPosition = readDockPositions()[viewport];

        dockViewportRef.current = viewport;
        setDockViewport(viewport);
        setDockPosition((current) => clampDockPosition(savedPosition ?? current ?? getDefaultDockPosition(viewport)));
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [clampDockPosition, getDefaultDockPosition, getViewport, mounted, readDockPositions, syncDockPosition]);

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

  const handleDismissDockTip = useCallback(() => {
    setShowDockTip(false);
    setDockTipStep(0);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DOCK_TIP_STORAGE_KEY, 'true');
    }
  }, []);

  const dockTipSteps = dockViewport === 'mobile' ?
    [
      '菜单栏已调整至此处，点击即可展开。',
      '长按菜单栏空白区域可自定义拖动位置。',
      '展开后，倒数第二个按钮用于快速创建项目。',
      '展开后，倒数第一个按钮用于访问基础设置与账户信息。',
    ] :
    [
      '菜单栏已调整至此处，长按空白区域可自定义拖动位置。',
      '右侧第二个按钮用于快速创建项目。',
      '右侧第一个按钮用于访问基础设置与账户信息。',
    ];

  const handleNextDockTip = useCallback(() => {
    setDockTipStep((current) => {
      if (current >= dockTipSteps.length - 1) {
        handleDismissDockTip();
        return current;
      }
      return current + 1;
    });
  }, [dockTipSteps.length, handleDismissDockTip]);

  const clearDockPressTimer = useCallback(() => {
    if (dockPressTimerRef.current !== null) {
      window.clearTimeout(dockPressTimerRef.current);
      dockPressTimerRef.current = null;
    }
  }, []);

  const beginDockDrag = useCallback((clientX: number, clientY: number) => {
    if (!dockPosition || typeof window === 'undefined') return;

    const viewport = getViewport();
    dockViewportRef.current = viewport;
    dragOffsetRef.current = {
      x: clientX - dockPosition.x,
      y: clientY - dockPosition.y,
    };
    isDraggingRef.current = true;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextPosition = clampDockPosition({
        x: moveEvent.clientX - dragOffsetRef.current.x,
        y: moveEvent.clientY - dragOffsetRef.current.y,
      });

      setDockPosition(nextPosition);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const nextPosition = clampDockPosition({
        x: upEvent.clientX - dragOffsetRef.current.x,
        y: upEvent.clientY - dragOffsetRef.current.y,
      });

      setDockPosition(nextPosition);
      writeDockPosition(dockViewportRef.current, nextPosition);
      isDraggingRef.current = false;
      suppressClickUntilRef.current = Date.now() + DOCK_CLICK_SUPPRESS_MS;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }, [clampDockPosition, dockPosition, getViewport, writeDockPosition]);

  const handleDockPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dockPosition || event.button !== 0) return;
    if ((event.target as HTMLElement).closest(DOCK_INTERACTIVE_SELECTOR)) return;

    pressStartRef.current = {x: event.clientX, y: event.clientY};
    clearDockPressTimer();
    dockPressTimerRef.current = window.setTimeout(() => {
      beginDockDrag(pressStartRef.current.x, pressStartRef.current.y);
      dockPressTimerRef.current = null;
    }, DOCK_LONG_PRESS_MS);
  }, [beginDockDrag, clearDockPressTimer, dockPosition]);

  const handleDockPointerEnd = useCallback(() => {
    if (!isDraggingRef.current) {
      clearDockPressTimer();
    }
  }, [clearDockPressTimer]);

  const handleDockClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() > suppressClickUntilRef.current) return;

    event.preventDefault();
    event.stopPropagation();
  }, []);

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
              className="max-w-[520px]"
            >
              <DialogHeader>
                <DialogTitle>个人信息</DialogTitle>
                <DialogDescription>
                  管理账户信息、主题偏好和支付设置
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="max-h-[min(72vh,560px)]">
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
              </DialogBody>
            </DialogContent>
          </Dialog>
          <PaymentSettingsDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
        </>
      ),
    },
  ];

  return (
    <div
      ref={dockRef}
      className="fixed z-50 select-none touch-none"
      onPointerDown={handleDockPointerDown}
      onPointerUp={handleDockPointerEnd}
      onPointerCancel={handleDockPointerEnd}
      onClickCapture={handleDockClickCapture}
      style={dockPosition ? {left: dockPosition.x, top: dockPosition.y} : {visibility: 'hidden'}}
    >
      {showDockTip && (
        <div
          data-dock-no-drag="true"
          className="pointer-events-auto absolute bottom-full right-0 mb-2 w-[min(15rem,calc(100vw-2.5rem))] rounded-2xl border border-border/60 bg-background/95 px-2.5 py-2 text-left shadow-[0_18px_40px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.03] backdrop-blur-sm md:left-1/2 md:right-auto md:mb-2.5 md:w-[17rem] md:-translate-x-1/2 md:px-3 dark:bg-background dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)] dark:ring-white/[0.04]"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium leading-4 text-foreground md:text-[11px]">
              菜单栏引导
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground md:text-[11px]">
              {dockTipSteps[dockTipStep]}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {dockTipSteps.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${index === dockTipStep ? 'w-4 bg-foreground/75' : 'w-1.5 bg-muted-foreground/25'}`}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 rounded-full px-1 text-[10px] text-muted-foreground md:h-6 md:px-1.5 md:text-[11px]"
                onClick={handleNextDockTip}
              >
                <ChevronRight className="size-3 md:size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <FloatingDock
        items={dockItems}
        desktopClassName="bg-background/70 backdrop-blur-md border border-border/40 shadow-lg shadow-black/10 dark:shadow-white/5 h-16 pb-3 px-4 gap-2"
        mobileButtonClassName="bg-background/70 backdrop-blur-md border border-border/40 shadow-lg shadow-black/10 dark:shadow-white/5 h-12 w-12"
      />
    </div>
  );
}
