import {useState, useEffect} from 'react';
import {FloatingDock} from '@/components/ui/floating-dock';
import {
  MessageCircleIcon,
  SendIcon,
  BarChartIcon,
  FolderIcon,
  ShoppingBag,
  PlusCircle,
  Github,
  ExternalLinkIcon,
  User,
  LogOutIcon,
} from 'lucide-react';
import {useThemeUtils} from '@/hooks/use-theme-utils';
import {useAuth} from '@/hooks/use-auth';
import {CreateDialog} from '@/components/common/project/CreateDialog';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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

export function ManagementBar() {
  const themeUtils = useThemeUtils();
  const {user, isLoading, logout} = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        <Dialog>
          <DialogTrigger asChild>
            <div className="w-full h-full flex items-center justify-center cursor-pointer rounded transition-colors">
              <User className="h-4 w-4" />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>个人信息</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!isLoading && user && (
                <>
                  {/* 用户信息卡片 */}
                  <div className="bg-muted/20 rounded-lg p-4 space-y-4">
                    {/* 用户基本信息和登出按钮 */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 rounded-full ring-2 ring-background">
                          <AvatarImage src={user.avatar_url} alt={user.username} />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium">CN</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">
                            {user.username}
                          </div>
                          {user.nickname && (
                            <div className="text-sm text-muted-foreground truncate">
                              {user.nickname}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{user.trust_level !== undefined ? getTrustLevelText(user.trust_level) : '未知'}</span>
                            <span>•</span>
                            <span>{user.id}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleLogout}
                        variant="destructive"
                        size="sm"
                        className="shrink-0"
                      >
                        <LogOutIcon className="w-4 h-4 mr-1" />
                        登出
                      </Button>
                    </div>

                  </div>

                  {/* 用户分数 */}
                  {user.score !== undefined && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">社区分数</h4>
                      <div className="text-lg font-bold text-primary flex items-center gap-2">
                        <BarChartIcon className="h-4 w-4 text-primary" />
                        <CountingNumber
                          number={user.score || 0}
                          fromNumber={0}
                          inView={true}
                          transition={{stiffness: 200, damping: 25}}
                        />
                      </div>
                    </div>
                  )}

                </>
              )}

              {/* 主题设置 */}
              {mounted && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">主题设置</h4>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={themeUtils.toggle}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors"
                    >
                      {themeUtils.getIcon('h-4 w-4')}
                      <span className="text-sm">{themeUtils.getAction()}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 快速链接区域 */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">快速链接</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="https://linux.do"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                      <ExternalLinkIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">Linux Do 社区</span>
                  </Link>
                  <Link
                    href="https://github.com/linux-do/cdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-500/10 group-hover:bg-gray-500/20 transition-colors">
                      <Github className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-sm font-medium">GitHub 仓库</span>
                  </Link>
                  <Link
                    href="https://github.com/linux-do/cdk/issues/new/choose"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <MessageCircleIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">功能反馈</span>
                  </Link>
                  <Link
                    href="https://t.me/linuxdocdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <SendIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium">群组交流</span>
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">关于 LINUX DO CDK</h4>
                <div className='space-y-2'>
                  <div className="text-xs text-muted-foreground font-light">版本: 1.1.0</div>
                  <div className="text-xs text-muted-foreground font-light">构建时间: 2025-09-27</div>
                  <div className="text-xs text-muted-foreground font-light">LINUX DO CDK 是一个为 Linux Do 社区打造的内容分发工具平台，旨在提供快速、安全、便捷的 CDK 分享服务。平台支持多种分发方式，具备完善的用户权限管理和风险控制机制。</div>
                </div>
              </div>

              {!isLoading && !user && (
                <div className="text-center text-muted-foreground">
                  未登录用户
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
