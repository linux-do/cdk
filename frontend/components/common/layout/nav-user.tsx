'use client';

import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {Badge} from '@/components/ui/badge';
import {useAuth} from '@/hooks/use-auth';
import {TrustLevel} from '@/lib/services/core';

/**
 * 获取信任等级对应的文本描述
 * @param level 信任等级数值
 * @returns 信任等级文本描述
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

export function NavUser({
  user,
}: {
  user: {
    id?: number
    username: string
    nickname: string
    trust_level?: number
    avatar: string
  }
}) {
  const {isMobile} = useSidebar();
  const {logout} = useAuth();

  // 获取信任等级文本
  const trustLevelText = user.trust_level !== undefined ?
    getTrustLevelText(user.trust_level) :
    '未知';

  // 处理登出点击事件
  const handleLogout = () => {
    logout('/login').catch((error) => {
      console.error('登出失败:', error);
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full shrink-0">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden text-left">
                <div className="flex items-center justify-center truncate text-base font-medium">
                  {user.username}
                  <span className="text-muted-foreground text-sm shrink-0 ml-1">({user.nickname})</span>
                </div>
              </div>
              <MoreVerticalIcon className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2.5 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-lg shrink-0">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  {/* 用户名和昵称 */}
                  <div className="font-medium flex items-center gap-1.5 mb-1">
                    <span className="truncate">{user.username}</span>
                    <span className="text-muted-foreground text-xs shrink-0">({user.nickname})</span>
                  </div>

                  {/* 用户标签 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="default" className="text-[10px]">
                      {trustLevelText}
                    </Badge>
                    {user.id && (
                      <Badge variant="outline" className="text-[10px]">
                        ID: {user.id}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="py-2 px-2.5 cursor-pointer">
                <UserCircleIcon className="size-4 mr-2.5"/>
                <span>账户设置</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2 px-2.5 cursor-pointer">
                <CreditCardIcon className="size-4 mr-2.5"/>
                <span>账单管理</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2 px-2.5 cursor-pointer">
                <BellIcon className="size-4 mr-2.5"/>
                <span>通知中心</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="py-2 px-2.5 cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
            >
              <LogOutIcon className="size-4 mr-2.5"/>
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
