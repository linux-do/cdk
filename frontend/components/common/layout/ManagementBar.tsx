import {useState, useEffect} from 'react';
import {SidebarTrigger} from '@/components/ui/sidebar';
import {FloatingDock} from '@/components/ui/floating-dock';
import {
  MoonIcon,
  MenuIcon,
  HomeIcon,
  MessageCircleIcon,
  SendIcon,
} from 'lucide-react';
import {useThemeUtils} from '@/hooks/use-theme-utils';

const IconOptions = {
  className: 'h-3 w-3',
} as const;

export function ManagementBar() {
  const themeUtils = useThemeUtils();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dockItems = [
    {
      title: '侧边栏',
      icon: <MenuIcon className="h-3 w-3" />,
      onClick: () => {
        const trigger = document.querySelector(
            '[data-sidebar="trigger"]',
        ) as HTMLButtonElement;
        trigger?.click();
      },
    },
    {
      title: '主页',
      icon: <HomeIcon {...IconOptions} />,
      href: '/explore',
    },
    {
      title: '主题切换',
      tooltip: mounted ? themeUtils.getAction() : '主题切换',
      icon: mounted ? (
        themeUtils.getIcon(IconOptions.className)
      ) : (
        <MoonIcon {...IconOptions} />
      ),
      onClick: themeUtils.toggle,
    },
    {
      title: '需求反馈',
      icon: <MessageCircleIcon {...IconOptions} />,
      href: 'https://github.com/linux-do/cdk/issues/new/choose',
    },
    {
      title: '群组交流',
      icon: <SendIcon {...IconOptions} />,
      href: 'https://t.me/linuxdocdk',
    },
  ];

  return (
    <div className="fixed bottom-4 ml-2 z-50 flex">
      <SidebarTrigger className="hidden" data-sidebar="trigger" />

      <div className="flex justify-center">
        <FloatingDock
          items={dockItems}
          desktopClassName="bg-background/70 backdrop-blur-md border border-border/40 shadow-lg shadow-black/10 dark:shadow-white/5"
          mobileButtonClassName="bg-background/70 backdrop-blur-md border border-border/40 shadow-lg shadow-black/10 dark:shadow-white/5"
        />
      </div>
    </div>
  );
}
