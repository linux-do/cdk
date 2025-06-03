import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {SESSION_COOKIE_NAME} from './lib/utils/cookies';

/**
 * 需要登录的路由前缀
 */
const PROTECTED_ROUTES = ['/explore', '/dashboard', '/project', '/my-claims', '/settings'];

/**
 * API路由前缀
 */
const API_ROUTES = ['/api'];

/**
 * 检查是否有session cookie
 * 注意：中间件只能检查cookie是否存在，无法验证其有效性
 * 有效性验证会在API请求时由后端进行
 */
function hasSessionCookie(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  return !!sessionCookie?.value;
}

/**
 * 检查路径是否需要认证
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * 检查路径是否是公开路由
 */
function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return pathname.startsWith('/login') || pathname.startsWith('/callback');
}

/**
 * 检查路径是否是API路由
 */
function isAPIRoute(pathname: string): boolean {
  return API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * 检查是否是静态资源
 */
function isStaticResource(pathname: string): boolean {
  return pathname.startsWith('/_next/') ||
         pathname.startsWith('/favicon.ico') ||
         pathname.startsWith('/images/') ||
         pathname.startsWith('/static/');
}

/**
 * Next.js中间件
 * 中间件层只检查cookie存在性，详细的用户验证由API层和组件层处理
 *
 * 注意：中间件无法执行复杂的cookie有效性验证，因为：
 * 1. 中间件运行在Edge Runtime环境，无法访问完整的Node.js API
 * 2. 中间件无法执行后端API调用以验证会话有效性
 *
 * 因此，在登出流程中，前端必须确保：
 * 1. 调用后端登出API清除服务器端会话
 * 2. 删除前端的session cookie
 */
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // 静态资源和API路由直接放行
  if (isStaticResource(pathname) || isAPIRoute(pathname)) {
    return NextResponse.next();
  }

  // 公开路由直接放行
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 保护的路由检查cookie存在性
  if (isProtectedRoute(pathname)) {
    if (!hasSessionCookie(request)) {
      // 重定向到登录页，并保存原始URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // 有cookie就放行，实际的cookie有效性验证会在组件内部通过API调用完成
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
