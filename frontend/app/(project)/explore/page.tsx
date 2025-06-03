'use client';

import {useAuth} from '@/hooks/use-auth';
import {Loader2} from 'lucide-react';

export default function ExplorePage() {
  const {isLoading} = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">


      {/* 主要内容 */}
      <main className="container mx-auto py-10">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">🎉 探索页面</h1>

          <p className="text-xl text-muted-foreground">
            测试登陆成功
          </p>

        </div>
      </main>
    </div>
  );
}
