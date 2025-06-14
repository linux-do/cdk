import {Suspense} from 'react';
import {ProjectMain} from '@/components/common/project';

export default function ProjectPage() {
  return (
    <div className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense>
        <ProjectMain />
      </Suspense>
    </div>
  );
}
