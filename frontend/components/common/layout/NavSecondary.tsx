'use client';

import * as React from 'react';
import Link from 'next/link';
import {SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from '@/components/ui/sidebar';
import type {LucideIcon} from 'lucide-react';

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const isExternalLink = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                {isExternalLink(item.url) ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                ) : (
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
