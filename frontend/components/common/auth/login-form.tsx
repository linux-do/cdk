'use client';

import {GalleryVerticalEnd, LoaderCircle} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import {useState, useEffect} from 'react';

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
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const {login, error, clearError} = useAuth();
  const searchParams = useSearchParams();

  // 检测是否是从登出操作重定向过来的
  useEffect(() => {
    const isLoggedOut = searchParams.get('logout') === 'true';
    if (isLoggedOut) {
      setLogoutMessage('您已成功登出平台');
    } else {
      setLogoutMessage('');
    }
  }, [searchParams]);

  /**
   * 处理登录按钮点击
   */
  const handleLogin = async () => {
    clearError(); // 清除之前的错误
    setLogoutMessage(''); // 清除登出信息
    setIsButtonLoading(true); // 设置按钮为加载状态

    try {
      // 获取重定向路径，直接传递给登录函数
      const redirectPath = searchParams.get('redirect');
      const validRedirectPath = redirectPath && redirectPath !== '/' && redirectPath !== '/login' ?
        redirectPath :
        '/explore';

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

          {/* 登出成功提示 */}
          {logoutMessage && (
            <div className="bg-success/10 text-success text-sm p-3 rounded-md text-center">
              {logoutMessage}
            </div>
          )}

          {/* 错误信息显示 */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
              {error}
            </div>
          )}

          <div className="gap-4 my-2">
            <Button
              variant="outline"
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogin}
              disabled={isButtonLoading}
            >
              <div className="flex items-center justify-center gap-2 w-44">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isButtonLoading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <LinuxDo width={24} height={24} />
                  )}
                </div>
                <span>
                  {isButtonLoading ? '正在跳转...' : '使用 Linux Do 登录'}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance mt-2">
        <span className="[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
          点击登录，即表示您同意我们的 <a href="#">服务条款</a> 和{' '}
          <a href="#">隐私政策</a>
        </span>
      </div>
    </div>
  );
}
