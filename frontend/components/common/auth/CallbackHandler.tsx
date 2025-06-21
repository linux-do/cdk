'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {BackgroundLines} from "@/components/ui/background-lines";
import {LiquidButton} from '@/components/animate-ui/buttons/liquid';
import {GalleryVerticalEnd, CheckCircle2, AlertCircle} from 'lucide-react';
import services from '@/lib/services';
import {cn} from '@/lib/utils';

/**
 * 回调处理组件属性
 */
export type CallbackHandlerProps = React.ComponentProps<'div'>;

/**
 * OAuth回调处理组件
 */
export function CallbackHandler({
  className,
  ...props
}: CallbackHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');


  useEffect(() => {
    /**
     * 处理OAuth回调
     */
    const handleCallback = async () => {
      try {
        const state = searchParams.get('state');
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          throw new Error(`OAuth认证失败: ${errorParam}`);
        }

        if (!state || !code) {
          throw new Error('缺少必要的认证参数');
        }

        await services.auth.handleCallback({state, code});

        const redirectTo = sessionStorage.getItem('oauth_redirect_to');
        const targetPath = redirectTo || '/explore';

        setStatus('success');

        sessionStorage.removeItem('oauth_redirect_to');

        setTimeout(() => {
          window.location.href = targetPath;
        }, 1000);
      } catch (err) {
        console.error('回调处理错误:', err);

        let errorMessage = '登录处理失败';

        if (err instanceof Error) {
          if (err.message.includes('redis: nil')) {
            errorMessage = '登录会话已过期，请重新登录';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <BackgroundLines className="fixed inset-0 flex items-center justify-center w-full h-screen overflow-hidden">
      <div className={cn('flex flex-col gap-6 w-full max-w-md px-6 py-8 rounded-2xl max-h-screen overflow-y-auto', className)} {...props}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <h1 className="text-xl font-bold">欢迎使用 Linux Do CDK.</h1>
          </div>
          <div className="flex flex-col items-center gap-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-medium">正在验证</h2>
                  <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div className="absolute top-0 h-full w-1/3 bg-primary rounded-full animate-[slide_1.5s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            )}
            {status === 'success' && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <h2 className="text-lg font-medium text-green-500">验证成功</h2>
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div className="text-center space-y-3 w-full">
                  <h2 className="text-md font-medium text-destructive">验证失败 ｜{error}</h2>
                  <LiquidButton
                    className="w-full mt-4"
                    onClick={() => router.push('/login')}
                  >
                    重新登录
                  </LiquidButton>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-muted-foreground text-center text-xs text-balance">
          <span className="[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
            Linux Do CDK - 让资源共享更简单.
          </span>
        </div>
      </div>
    </BackgroundLines>
  );
}
