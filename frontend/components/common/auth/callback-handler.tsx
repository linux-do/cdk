'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {GalleryVerticalEnd, Loader2, CheckCircle, XCircle} from 'lucide-react';
import services from '@/lib/services';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';

/**
 * 回调处理组件属性
 */
export type CallbackHandlerProps = React.ComponentProps<'div'>;

/**
 * OAuth回调处理组件
 * 处理Linux Do OAuth认证后的回调，完成登录流程
 */
export function CallbackHandler({
  className,
  ...props
}: CallbackHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [, setRedirectPath] = useState<string>('/explore');

  useEffect(() => {
    /**
     * 处理OAuth回调
     */
    const handleCallback = async () => {
      try {
        const state = searchParams.get('state');
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        // 检查是否有OAuth错误
        if (errorParam) {
          throw new Error(`OAuth认证失败: ${errorParam}`);
        }

        // 检查必要参数
        if (!state || !code) {
          throw new Error('缺少必要的认证参数');
        }

        // 调用后端回调接口
        await services.auth.handleCallback({state, code});

        // 从sessionStorage获取重定向信息
        const redirectTo = sessionStorage.getItem('oauth_redirect_to');
        const targetPath = redirectTo || '/explore';
        setRedirectPath(targetPath);

        // 设置成功状态
        setStatus('success');

        // 登录成功，延迟跳转到指定页面
        setTimeout(() => {
          sessionStorage.removeItem('oauth_redirect_to');
          router.push(targetPath);
        }, 1000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '登录处理失败';
        setError(errorMessage);
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <h1 className="text-xl font-bold">欢迎使用 Linux Do CDK.</h1>
        </div>
        <div className="flex flex-col items-center gap-4 py-2">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h2 className="text-lg font-semibold">正在处理登录</h2>
              <p className="text-muted-foreground text-center text-sm">
                请稍候，我们正在验证您的身份...
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <h2 className="text-lg font-semibold text-green-500">登录成功</h2>
              <p className="text-muted-foreground text-center text-sm">
                正在前往 Linux Do CDK 平台，请稍候...
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">登录失败</h2>
              <p className="text-muted-foreground text-center text-sm">
                {error}
              </p>
              <Button
                variant="default"
                className="w-full mt-2"
                onClick={() => router.push('/login')}
              >
                重新登录
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="text-muted-foreground text-center text-xs text-balance">
        <span className="[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
          {status === 'success' ?
            '将在几秒后自动跳转，感谢您的等待.' :
            'Linux Do CDK - 让资源共享更简单.'}
        </span>
      </div>
    </div>
  );
}
