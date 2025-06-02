import {GalleryVerticalEnd} from 'lucide-react';

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {LinuxDo} from '@/components/icons/logo';
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form>
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
          <div className="gap-4 my-4">
            <Button variant="outline" type="button" className="w-full flex items-center justify-center">
              <LinuxDo width={24} height={24} />
              使用 Linux Do 登录
            </Button>
          </div>
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or
            </span>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                autoComplete="off"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        点击登录，即表示您同意我们的 <a href="#">服务条款</a> 和{' '}
        <a href="#">隐私政策</a>.
      </div>
    </div>
  );
}
