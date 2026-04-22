import {Suspense} from 'react';
import {ProjectMain} from '@/components/common/project';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: '我的项目',
};

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectMain />
    </Suspense>
  );
}
