'use client';

import {useState, useEffect} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {LiquidButton} from '@/components/animate-ui/buttons/liquid';
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '@/components/animate-ui/radix/accordion';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/animate-ui/radix/dialog';
import {GalleryVerticalEnd, LoaderCircle} from 'lucide-react';
import {LinuxDo} from '@/components/icons/logo';
import {useAuth} from '@/hooks/use-auth';
import {cn} from '@/lib/utils';

/**
 * 登录表单组件属性
 */
export type LoginFormProps = React.ComponentProps<'div'>;

/**
 * 登录表单组件
 */
export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const {login, error, clearError, user, isAuthenticated} = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

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

  /**
   * 处理已登录用户点击头像区域
   */
  const handleUserClick = () => {
    router.push('/explore');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center w-full h-screen overflow-hidden">
      <div className={cn('flex flex-col gap-6 w-full max-w-md px-6 py-8 rounded-2xl max-h-screen overflow-y-auto', className)} {...props}>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-6 transition-all duration-500 ease-in-out">
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md m-4">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <h1 className="text-xl font-bold">欢迎使用 Linux Do CDK.</h1>
            </div>

            {/* 登出成功提示 */}
            {logoutMessage && (
              <div className="text-success text-sm mt-2 rounded-md text-center">
                {logoutMessage}
              </div>
            )}

            {/* 错误信息显示 */}
            {error && (
              <div className="text-destructive text-sm mt-2 rounded-md text-center">
                {error}
              </div>
            )}

            {/* 已登录用户信息 */}
            <div className={cn(
                'transition-all duration-500 ease-in-out overflow-hidden',
            isAuthenticated && user ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0',
            )}>
              <div className="mx-4 transform transition-all duration-500 ease-out">
                <div
                  className="flex items-center justify-center gap-3 py-2 cursor-pointer hover:bg-muted rounded-lg transition-all duration-200 w-full group"
                  onClick={handleUserClick}
                >
                  <Avatar className="size-15 transition-transform duration-200 group-hover:scale-105">
                    <AvatarImage src={user?.avatar_url} alt={user?.username} />
                    <AvatarFallback>
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start transition-transform duration-200 group-hover:translate-x-1">
                    <span className="text-base font-medium">{user?.username}</span>
                    <span className="text-xs text-muted-foreground">已登录，点击进入</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-4 flex justify-center">
              <LiquidButton
                className="items-center justify-center w-full"
                onClick={handleLogin}
                disabled={isButtonLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isButtonLoading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <LinuxDo width={24} height={24} />
                  )}
                  </div>
                  <span className="transition-all duration-300">
                    {isButtonLoading ?
                    '正在跳转...' :
                    isAuthenticated ?
                      '使用其他 Linux Do 账户登录' :
                      '使用 Linux Do 账户登录'
                    }
                  </span>
                </div>
              </LiquidButton>
            </div>
          </div>
        </form>

        <div className="text-muted-foreground text-center text-xs text-balance mt-2">
          <span className="[&_button]:underline [&_button]:underline-offset-4 [&_button:hover]:text-primary">
          登录即表示您同意我们的{' '}
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-inherit bg-transparent border-none p-0 cursor-pointer">
                服务条款
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>服务条款</DialogTitle>
                  <DialogDescription>
                  请仔细阅读以下服务条款，使用本服务即表示您同意这些条款。
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="general">
                      <AccordionTrigger>1. 一般条款</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>本服务条款（以下简称&ldquo;条款&rdquo;）规定了您使用 Linux Do CDK 服务的条件。</p>
                          <p>通过访问或使用我们的服务，您同意受这些条款的约束。如果您不同意这些条款，请不要使用我们的服务。</p>
                          <p>我们保留随时修改这些条款的权利。修改后的条款将在发布后立即生效。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="usage">
                      <AccordionTrigger>2. 使用规则</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>您同意以合法和负责任的方式使用我们的服务，严格遵守中华人民共和国相关法律法规。</p>
                          <p>禁止的行为包括但不限于：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>发布非法、有害、威胁、辱骂、骚扰、诽谤或其他令人反感的内容</li>
                            <li>尝试未经授权访问我们的系统或其他用户的账户</li>
                            <li>干扰或破坏服务的正常运行</li>
                            <li>违反任何适用的法律法规</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="content">
                      <AccordionTrigger>3. 内容规范</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>为维护健康的网络环境，严格禁止分发以下类型的内容：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>色情内容</strong>：任何包含色情、淫秽、暴露或性暗示的内容</li>
                            <li><strong>推广内容</strong>：商业广告、营销推广、垃圾信息或其他商业性质的内容</li>
                            <li><strong>违法内容</strong>：违反中华人民共和国法律法规的任何内容</li>
                            <li><strong>有害信息</strong>：暴力、恐怖主义、极端主义或危害国家安全的内容</li>
                            <li><strong>虚假信息</strong>：谣言、虚假新闻或误导性信息</li>
                            <li><strong>侵权内容</strong>：侵犯他人知识产权、隐私权或其他合法权益的内容</li>
                          </ul>
                          <p>一旦发现违规内容，我们将立即删除并可能终止相关账户。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="legal">
                      <AccordionTrigger>4. 法律合规</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>本服务严格遵守中华人民共和国相关法律法规，包括但不限于：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>《中华人民共和国网络安全法》</li>
                            <li>《中华人民共和国数据安全法》</li>
                            <li>《中华人民共和国个人信息保护法》</li>
                            <li>《互联网信息服务管理办法》</li>
                            <li>《网络信息内容生态治理规定》</li>
                          </ul>
                          <p>用户在使用服务时，必须遵守上述法律法规及其他相关规定。</p>
                          <p>对于违反法律法规的行为，我们将配合相关部门进行调查和处理。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="account">
                      <AccordionTrigger>5. 账户责任</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>您负责维护账户信息的准确性和安全性。</p>
                          <p>您对使用您账户进行的所有活动承担责任。</p>
                          <p>如果您发现任何未经授权的使用，请立即通知我们。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="intellectual">
                      <AccordionTrigger>6. 知识产权</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>服务中的所有内容，包括文本、图形、徽标、图像和软件，均受版权和其他知识产权法保护。</p>
                          <p>未经我们明确书面许可，您不得复制、修改、分发或以其他方式使用这些内容。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="limitation">
                      <AccordionTrigger>7. 责任限制</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>在法律允许的最大范围内，我们不对任何间接、偶然、特殊或后果性损害承担责任。</p>
                          <p>我们的总责任不超过您在过去12个月内为服务支付的金额。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </DialogContent>
            </Dialog>
            {' '}和{' '}
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-inherit bg-transparent border-none p-0 cursor-pointer">
                隐私政策
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>隐私政策</DialogTitle>
                  <DialogDescription>
                  我们重视您的隐私，本政策说明我们如何收集、使用和保护您的个人信息。
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="collection">
                      <AccordionTrigger>1. 信息收集</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>我们收集以下类型的信息：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>账户信息：通过 Linux Do OAuth 获取的用户名、头像等公开信息</li>
                            <li>使用数据：您如何使用我们服务的信息</li>
                            <li>技术信息：IP地址、设备信息、浏览器类型等</li>
                            <li>日志信息：服务器日志和错误报告</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="usage-info">
                      <AccordionTrigger>2. 信息使用</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>我们使用收集的信息用于：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>提供和维护我们的服务</li>
                            <li>改善用户体验</li>
                            <li>防止欺诈和滥用</li>
                            <li>遵守法律义务</li>
                            <li>发送重要通知</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="sharing">
                      <AccordionTrigger>3. 信息共享</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>我们不会出售、交换或出租您的个人信息给第三方。</p>
                          <p>在以下情况下，我们可能会共享您的信息：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>经您明确同意</li>
                            <li>法律要求或政府请求</li>
                            <li>保护我们的权利和财产</li>
                            <li>与可信的服务提供商合作（受保密协议约束）</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="security">
                      <AccordionTrigger>4. 数据安全</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>我们采用业界标准的安全措施保护您的信息：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>数据传输加密（HTTPS/TLS）</li>
                            <li>数据库访问控制和加密</li>
                            <li>定期安全审计和漏洞扫描</li>
                            <li>员工访问权限管理</li>
                          </ul>
                          <p>但请注意，没有任何数据传输或存储方法是100%安全的。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="retention">
                      <AccordionTrigger>5. 数据保留</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>我们仅在必要的时间内保留您的个人信息：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>账户信息：账户存在期间</li>
                            <li>使用日志：90天</li>
                            <li>安全日志：1年</li>
                          </ul>
                          <p>您可以随时要求删除您的账户和相关数据。</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="rights">
                      <AccordionTrigger>6. 您的权利</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>您对您的个人信息享有以下权利：</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>访问权：查看我们持有的关于您的信息</li>
                            <li>更正权：更正不准确的信息</li>
                            <li>删除权：要求删除您的个人信息</li>
                            <li>限制处理权：限制我们处理您信息的方式</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </DialogContent>
            </Dialog>
          </span>
        </div>
      </div>
    </div>
  );
}
