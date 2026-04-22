'use client';

import {ManagementBar} from '@/components/common/layout/ManagementBar';
import {memo} from 'react';

const MemoizedManagementBar = memo(ManagementBar);

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MemoizedManagementBar />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col px-4 pt-12 py-8 sm:px-6 md:px-8 lg:px-12">
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 md:gap-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
