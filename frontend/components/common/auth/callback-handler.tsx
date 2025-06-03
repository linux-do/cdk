'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {GalleryVerticalEnd, LoaderCircle, CheckCircle, XCircle} from 'lucide-react';
import services from '@/lib/services';
import {cn} from '@/lib/utils';
import {LiquidButton} from '@/components/animate-ui/buttons/liquid';

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

        // 设置成功状态
        setStatus('success');

        // 登录成功，立即跳转到指定页面
        console.log('登录成功，准备跳转到:', targetPath);

        // 清除存储的重定向路径
        sessionStorage.removeItem('oauth_redirect_to');

        // 设置一个短暂延迟，确保UI更新
        setTimeout(() => {
          // 直接使用location进行导航，绕过Next.js路由系统的潜在问题
          window.location.href = targetPath;
        }, 500);
      } catch (err) {
        console.error('回调处理错误:', err);

        // 处理特定错误类型
        let errorMessage = '登录处理失败';

        if (err instanceof Error) {
          // 特别处理Redis相关错误
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
              <LoaderCircle className="h-10 w-10 animate-spin" />
              <h2 className="text-lg font-semibold">正在处理验证</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <h2 className="text-lg font-semibold text-green-500">欢迎回来</h2>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">登录失败</h2>
              <p className="text-muted-foreground text-center text-sm">
                {error}
              </p>
              <LiquidButton
                className="mt-2 w-full"
                onClick={() => router.push('/login')}
              >
                重新登录
              </LiquidButton>
            </>
          )}
        </div>
      </div>
      <div className="text-muted-foreground text-center text-xs text-balance">
        <span className="[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
          Linux Do CDK - 让资源共享更简单.
        </span>
      </div>
    </div>
  );
}
