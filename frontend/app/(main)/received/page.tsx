import {Suspense} from 'react';
import {ReceivedMain} from '@/components/common/received';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: '我的领取',
};

export default function ReceivedPage() {
  return (
    <Suspense>
      <ReceivedMain />
    </Suspense>
  );
}
