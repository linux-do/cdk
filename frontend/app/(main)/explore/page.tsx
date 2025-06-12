import {Suspense} from 'react';
import {ExploreMain} from '@/components/common/explore';
import {Skeleton} from '@/components/ui/skeleton';

function ExploreFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-18" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({length: 8}).map((_, index) => (
          <div key={index} className="w-full max-w-sm mx-auto">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="space-y-2 mt-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<ExploreFallback />}>
        <ExploreMain />
      </Suspense>
    </div>
  );
}
