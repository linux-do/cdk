'use client';

import Link from 'next/link';
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from '@/components/ui/sidebar';
import {motion} from 'motion/react';
import {useEffect, useState, useMemo} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {type LucideIcon, BarChart2} from 'lucide-react';

export interface NavDocumentItem {
  name: string;
  url: string;
  icon: LucideIcon;
  /** 是否在新标签页打开链接，默认为 false */
  openInNewTab?: boolean;
}

export interface NavDocumentsProps {
  items: NavDocumentItem[];
  /** 用户分数，如果提供则显示分数按钮 */
  userScore?: number;
}

export function NavDocuments({items, userScore}: NavDocumentsProps) {
  const [showScore, setShowScore] = useState(false);

  const documentItems = useMemo(() => {
    return items.map((item) => {
      const shouldOpenInNewTab = item.openInNewTab ?? false;

      return (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton asChild>
            <Link
              href={item.url}
              target={shouldOpenInNewTab ? '_blank' : undefined}
              rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
            >
              <item.icon />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  }, [items]);

  useEffect(() => {
    if (userScore !== undefined) {
      const timer = requestAnimationFrame(() => {
        setShowScore(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [userScore]);

  const scoreItem = useMemo(() => {
    if (userScore === undefined) return null;

    const scoreContent = (
      <div className="flex flex-col space-y-1">
        <h4 className="text-sm font-semibold">我的分数</h4>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">
            <CountingNumber
              number={userScore || 0}
              fromNumber={0}
              inView={true}
              transition={{stiffness: 200, damping: 25}}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            基于社区贡献和活跃度，每日更新
          </div>
        </div>
      </div>
    );

    return (
      <motion.div
        initial={{opacity: 0, scale: 0.8, y: 10}}
        animate={showScore ? {opacity: 1, scale: 1, y: 0} : {opacity: 0, scale: 0.8, y: 10}}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.2,
        }}
        layout={false}
      >
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton>
                <BarChart2 className="h-4 w-4" />
                <span>我的分数</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-48" side="bottom" align="start" sideOffset={8}>
              {scoreContent}
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </motion.div>
    );
  }, [userScore, showScore]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        {documentItems}
        {scoreItem}
      </SidebarMenu>
    </SidebarGroup>
  );
}
