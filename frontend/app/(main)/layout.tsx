'use client';

import {AppSidebar} from '@/components/common/layout/AppSidebar';
import {ManagementBar} from '@/components/common/layout/ManagementBar';
import {SidebarInset, SidebarProvider} from '@/components/ui/sidebar';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <ManagementBar />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-6 py-6 md:gap-6 ">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
