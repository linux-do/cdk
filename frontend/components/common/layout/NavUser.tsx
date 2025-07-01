'use client';

import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {SidebarMenu, SidebarMenuItem} from '@/components/ui/sidebar';
import {FlipButton} from '@/components/animate-ui/buttons/flip';
import {LogOutIcon} from 'lucide-react';
import {useAuth} from '@/hooks/use-auth';
import {TrustLevel} from '@/lib/services/core';

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
  const {logout} = useAuth();

  const trustLevelText = user.trust_level !== undefined ?
    getTrustLevelText(user.trust_level) :
    '未知';

  const handleLogout = () => {
    logout('/login').catch((error) => {
      console.error('登出失败:', error);
    });
  };

  const frontContent = (
    <div className="flex items-center gap-2 px-4 w-full">
      <Avatar className="h-7 w-7 rounded-full shrink-0">
        <AvatarImage src={user.avatar} alt={user.username} />
        <AvatarFallback className="rounded-lg text-xs">CN</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <div className="text-left text-xs font-medium truncate">
          {user.username}
          {user.nickname && (
            <span className="text-muted-foreground ml-1">({user.nickname})</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Badge variant="default" className="text-[8px] px-1 py-0 h-4">
            {trustLevelText}
          </Badge>
          {user.id && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
              ID: {user.id}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  const backContent = (
    <div className="flex items-center justify-center gap-2 w-full">
      <LogOutIcon className="size-4" />
      <span className="text-sm font-medium">退出登录</span>
    </div>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <FlipButton
          frontContent={frontContent}
          backContent={backContent}
          from="left"
          onClick={handleLogout}
          className="w-full h-[42px]"
          frontClassName="text-foreground"
          backClassName="bg-destructive"
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
