'use client';

import {GalleryVerticalEnd, Loader2} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import {useState} from 'react';

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {LinuxDo} from '@/components/icons/logo';
import {useAuth} from '@/hooks/use-auth';

/**
 * 登录表单组件属性
 */
export type LoginFormProps = React.ComponentProps<'div'>;

/**
 * 登录表单组件
 * 提供Linux Do OAuth2登录功能
 */
export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  // 使用组件内部状态控制按钮加载状态，而不是依赖useAuth中的isLoading
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const {login, error, clearError} = useAuth();
  const searchParams = useSearchParams();

  /**
   * 处理登录按钮点击
   */
  const handleLogin = async () => {
    clearError(); // 清除之前的错误
    setIsButtonLoading(true); // 设置按钮为加载状态

    try {
      // 获取重定向路径，直接传递给登录函数
      const redirectPath = searchParams.get('redirect');
      const validRedirectPath = redirectPath && redirectPath !== '/' && redirectPath !== '/login' ?
        redirectPath :
        '/explore'; // 默认跳转到explore

      await login(validRedirectPath);
    } catch {
      // 发生错误时重置按钮状态
      setIsButtonLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Linux Do CDK</span>
            </a>
            <h1 className="text-xl font-bold">欢迎使用 Linux Do CDK.</h1>
          </div>

          {/* 错误信息显示 */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="gap-4 my-4">
            <Button
              variant="outline"
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogin}
              disabled={isButtonLoading}
            >
              {isButtonLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LinuxDo width={24} height={24} />
              )}
              {isButtonLoading ? '正在跳转...' : '使用 Linux Do 登录'}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance">
        <span className="[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
          点击登录，即表示您同意我们的 <a href="#">服务条款</a> 和{' '}
          <a href="#">隐私政策</a>
        </span>
      </div>
    </div>
  );
}
