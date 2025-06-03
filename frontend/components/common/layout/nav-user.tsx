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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-10 w-10 rounded-lg -ml-2">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="truncate font-medium">
                  {user.username}
                  <span className="text-muted-foreground text-xs ml-2">
                    ({user.nickname})
                  </span>
                </div>
                <span className="text-muted-foreground text-xs mt-1">
                  <Badge variant="default" className="text-[10px]">
                    {trustLevelText}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] ml-2">
                    ID: {user.id}
                  </Badge>
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="truncate font-medium">
                    {user.username}
                    <span className="text-muted-foreground text-xs ml-2">
                      ({user.nickname})
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs mt-1">
                    <Badge variant="default" className="text-[10px]">
                      {trustLevelText}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] ml-2">
                      ID: {user.id}
                    </Badge>
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserCircleIcon className="size-4"/>
                账户
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon className="size-4"/>
                账单
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon className="size-4"/>
                通知
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon className="size-4"/>
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
