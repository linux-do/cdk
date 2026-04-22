import {Suspense} from 'react';
import {DashboardMain} from '@/components/common/dashboard';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: '实时数据',
};

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardMain />
    </Suspense>
  );
}
