'use client';

import * as React from 'react';
import {
  SquareArrowUpRight,
  BarChartIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ShoppingBag,
  SettingsIcon,
  FileIcon,
  MessageCircleIcon,
  SendIcon,
} from 'lucide-react';

import {NavDocuments} from '@/components/common/layout/nav-documents';
import {NavMain} from '@/components/common/layout/nav-main';
import {NavSecondary} from '@/components/common/layout/nav-secondary';
import {NavUser} from '@/components/common/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {RollingText} from '@/components/animate-ui/text/rolling';
import Link from 'next/link';
import {useAuth} from '@/hooks/use-auth';

/**
 * 主导航栏
 */
const navMain = [
  {
    title: '探索广场',
    url: '/explore',
    icon: LayoutDashboardIcon,
  },
  {
    title: '实时数据',
    url: '/dashboard',
    icon: BarChartIcon,
  },
  {
    title: '我的项目',
    url: '/project',
    icon: FolderIcon,
  },
  {
    title: '我的领取',
    url: '/my-claims',
    icon: ShoppingBag,
  },
];

/**
 * 次导航栏
 */
const navSecondary = [
  {
    title: '账户设置',
    url: '/settings',
    icon: SettingsIcon,
  },
  {
    title: '需求反馈',
    url: 'https://rcnocajpmmaw.feishu.cn/share/base/form/shrcnQnuZp9op9LhOAMI3kVBe2e',
    icon: MessageCircleIcon,
  },
  {
    title: '群组交流',
    url: 'https://t.me/linuxdocdk',
    icon: SendIcon,
  },
];

/**
 * 文档导航栏
 */
const navDocuments = [
  {
    name: '测试数据1',
    url: '#',
    icon: FileIcon,
  },
  {
    name: '测试数据2',
    url: '#',
    icon: FileIcon,
  },
  {
    name: '测试数据3',
    url: '#',
    icon: FileIcon,
  },
];

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  // 使用useAuth钩子获取用户信息和状态
  const {user, isLoading} = useAuth();

  return (
    <Sidebar collapsible="offcanvas" className="hide-scrollbar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/explore">
                <SquareArrowUpRight className="h-5 w-5" />
                <RollingText
                  className="text-base font-semibold"
                  text="Linux Do CDK"
                  loop={true}
                  loopDelay={6000}
                  inViewOnce={false}
                  transition={{duration: 0.5, delay: 0.1, ease: 'easeOut'}}
                />
                <span className="text-xs text-muted-foreground">v 0.0.2 - Beta</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="hide-scrollbar">
        <NavMain items={navMain} />
        <NavDocuments items={navDocuments} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {isLoading && (
          <NavUser
            user={{
              id: 0,
              username: 'Loading...',
              nickname: 'Loading...',
              trust_level: 0,
              avatar: 'Loading...',
            }}
          />
        )}
        {!isLoading && user && (
          <NavUser
            user={{
              id: user.id,
              username: user.username,
              nickname: user.nickname,
              trust_level: user.trust_level,
              avatar: user.avatar_url,
            }}
          />
        )}
        {!isLoading && !user && (
          <NavUser
            user={{
              id: 0,
              username: 'Unknown',
              nickname: 'Unknown',
              trust_level: 0,
              avatar: 'Unknown',
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
