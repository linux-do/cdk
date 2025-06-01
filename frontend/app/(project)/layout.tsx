import { AppSidebar } from "@/components/common/layout/app-sidebar"
import { SiteHeader } from "@/components/common/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 px-6 md:gap-6 md:py-6 md:px-8">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 