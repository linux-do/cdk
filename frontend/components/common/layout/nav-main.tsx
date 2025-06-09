'use client';

import {Github, PlusCircle, type LucideIcon} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {CreateDialog} from '@/components/common/project/CreateDialog';

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <CreateDialog>
              <SidebarMenuButton
                tooltip="快速创建"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear w-full"
              >
                <PlusCircle/>
                <span className="font-semibold">快速创建</span>
              </SidebarMenuButton>
            </CreateDialog>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 hover:bg-transparent"
              variant="outline"
              asChild
            >
              <Link href="https://github.com/linux-do/cdk" target="_blank">
                <Github className="size-4"/>
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
