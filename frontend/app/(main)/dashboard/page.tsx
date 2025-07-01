'use client';

import {Suspense} from 'react';
import {DashboardMain} from '@/components/common/dashboard';

export default function DashboardPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense>
        <DashboardMain />
      </Suspense>
    </div>
  );
}
