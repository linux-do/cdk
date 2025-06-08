import {Suspense} from 'react';
import {ReceivedMain} from '@/components/common/received';

export default function ReceivedPage() {
  return (
    <div className="min-h-screen container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense>
        <ReceivedMain />
      </Suspense>
    </div>
  );
}
