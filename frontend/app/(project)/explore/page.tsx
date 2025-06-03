'use client';

import {useAuth} from '@/hooks/use-auth';

export default function ExplorePage() {
  const {user} = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* 主要内容 */}
      <main className="container mx-auto py-10">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">🎉 探索页面</h1>

          <p className="text-xl text-muted-foreground">
            欢迎回来，{user?.nickname || user?.username || '用户'}！
          </p>

          <div className="mt-6 p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-3">用户信息</h2>
            <div className="text-left max-w-md mx-auto">
              <p><span className="font-medium">ID:</span> {user?.id}</p>
              <p><span className="font-medium">用户名:</span> {user?.username}</p>
              <p><span className="font-medium">昵称:</span> {user?.nickname}</p>
              <p><span className="font-medium">信任等级:</span> {user?.trust_level}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
