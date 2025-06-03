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
 * 只检查cookie存在性，具体的用户验证交给组件层处理
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

  // 保护的路由只检查cookie存在性
  if (isProtectedRoute(pathname)) {
    if (!hasSessionCookie(request)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // 有cookie就放行，让组件层验证cookie有效性
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
