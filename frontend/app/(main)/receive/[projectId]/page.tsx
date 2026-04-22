import {Suspense} from 'react';
import {ReceiveMain} from '@/components/common/receive';

export default function ProjectPage() {
  return (
    <Suspense>
      <ReceiveMain />
    </Suspense>
  );
}
