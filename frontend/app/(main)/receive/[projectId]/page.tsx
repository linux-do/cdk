import {Suspense} from 'react';
import {ReceiveMain} from '@/components/common/receive';

export default function ProjectPage() {
  return (
    <div className="min-h-screen container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
      <Suspense>
        <ReceiveMain />
      </Suspense>
    </div>
  );
}
