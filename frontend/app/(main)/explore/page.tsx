import {Suspense} from 'react';
import {ExploreMain} from '@/components/common/explore';

export default function ExplorePage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Suspense>
        <ExploreMain />
      </Suspense>
    </div>
  );
}
