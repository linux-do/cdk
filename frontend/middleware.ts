import {NextResponse} from 'next/server';

/**
 * 领取请求的 hCaptcha 校验已移至后端（与领取凭证在同一请求内校验），
 * 这里不再拦截，/api/* 统一由 next.config.ts 的 rewrites 代理到后端。
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
