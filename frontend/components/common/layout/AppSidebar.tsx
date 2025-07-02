'use client';

import * as React from 'react';
import Link from 'next/link';
import {RollingText} from '@/components/animate-ui/text/rolling';
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from '@/components/ui/sidebar';
import {SquareArrowUpRight, BarChartIcon, FolderIcon, LayoutDashboardIcon, ShoppingBag, ExternalLinkIcon} from 'lucide-react';
import {NavDocuments} from '@/components/common/layout/NavDocuments';
import {NavMain} from '@/components/common/layout/NavMain';
import {NavUser} from '@/components/common/layout/NavUser';
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
    url: '/received',
    icon: ShoppingBag,
  },
];

/**
 * 文档导航栏
 */
const navDocuments = [
  {
    name: '前往社区',
    url: 'https://linux.do',
    icon: ExternalLinkIcon,
  },
];

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
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
      </SidebarContent>
      <SidebarFooter>
        <NavDocuments items={navDocuments} />
        {isLoading && (
          <NavUser
            user={{
              id: 1,
              username: 'Loading...',
              nickname: 'Loading...',
              trust_level: 0,
              avatar: '/LinuxDo.png',
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
              id: 1,
              username: 'Unknown',
              nickname: 'Unknown',
              trust_level: 0,
              avatar: '/LinuxDo.png',
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
