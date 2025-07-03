'use client';

import Link from 'next/link';
import {SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from '@/components/ui/sidebar';
import {type LucideIcon} from 'lucide-react';

export interface NavDocumentItem {
  name: string;
  url: string;
  icon: LucideIcon;
  /** 是否在新标签页打开链接，默认为 false */
  openInNewTab?: boolean;
}

export interface NavDocumentsProps {
  items: NavDocumentItem[];
}

export function NavDocuments({items}: NavDocumentsProps) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        {items.map((item) => {
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
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
