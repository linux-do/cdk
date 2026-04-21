import {Suspense} from 'react';
import {ProjectMain} from '@/components/common/project';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: '我的项目',
};

export default function ProjectPage() {
  return (
    <div className="container mx-auto flex min-h-0 flex-1 flex-col px-4 pt-8 sm:px-6 lg:max-w-7xl lg:px-8">
      <Suspense>
        <ProjectMain />
      </Suspense>
    </div>
  );
}
