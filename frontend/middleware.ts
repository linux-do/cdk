import {NextRequest, NextResponse} from 'next/server';

const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';
const HCAPTCHA_SECRET_KEY = process.env.HCAPTCHA_SECRET_KEY || 'your-hcaptcha-secret-key';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

interface HCaptchaResponse {
  success: boolean;
  'error-codes'?: string[];
}

interface ReceiveRequestBody {
  captcha_token?: string;

  [key: string]: string | number | boolean | null | undefined;
}

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}

/**
 * 格式化错误信息
 */
function formatErrorMessage(error: unknown, fallbackMessage: string): string {
  if (IS_DEVELOPMENT && error instanceof Error) {
    return `${fallbackMessage}: ${error.message}`;
  }
  return fallbackMessage;
}

/**
 * 验证hCaptcha令牌
 */
async function verifyCaptcha(token: string, remoteip?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET_KEY,
        response: token,
        remoteip: remoteip || '',
      }),
    });

    if (!response.ok) {
      return {success: false, error: 'hCaptcha服务暂时不可用，请稍后重试'};
    }

    const data: HCaptchaResponse = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];

      // 根据错误代码返回用户友好的错误信息
      if (errorCodes.includes('missing-input-response')) {
        return {success: false, error: '请完成人机验证'};
      }
      if (errorCodes.includes('invalid-input-response')) {
        return {success: false, error: '验证码无效，请重新验证'};
      }
      if (errorCodes.includes('timeout-or-duplicate')) {
        return {success: false, error: '验证已过期，请重新验证'};
      }
      if (errorCodes.includes('invalid-input-secret')) {
        return {success: false, error: '验证服务配置错误，请联系管理员'};
      }

      return {success: false, error: '人机验证失败，请重新验证'};
    }

    return {success: true};
  } catch (error) {
    return {success: false, error: formatErrorMessage(error, '验证服务连接失败，请检查网络后重试')};
  }
}

/**
 * 处理领取请求
 */
async function handleReceiveRequest(request: NextRequest, pathname: string): Promise<NextResponse> {
  const clientIP = getClientIP(request);

  try {
    // 解析请求体
    const body: ReceiveRequestBody = await request.json().catch(() => ({}));

    // 验证必要参数
    if (!body.captcha_token) {
      return NextResponse.json(
          {error_msg: '缺少必要的验证信息'},
          {status: 400},
      );
    }

    // 验证hCaptcha
    const captchaResult = await verifyCaptcha(body.captcha_token, clientIP);
    if (!captchaResult.success) {
      return NextResponse.json(
          {error_msg: captchaResult.error || '人机验证失败，请重新验证'},
          {status: 400},
      );
    }

    // 准备转发到后端的请求
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const {captcha_token: _captchaToken, ...backendBody} = body;
    const backendUrl = `${BACKEND_BASE_URL}${pathname}`;

    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIP,
        'X-Original-Host': request.headers.get('host') || '',
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': 'CDK-Frontend-Middleware',
        'Referer': request.headers.get('referer') || '',
        'Origin': request.headers.get('origin') || '',
      },
      body: Object.keys(backendBody).length > 0 ? JSON.stringify(backendBody) : undefined,
      credentials: 'include',
    });

    const backendData = await backendResponse.json();

    return NextResponse.json(backendData, {
      status: backendResponse.status,
      headers: {
        'Set-Cookie': backendResponse.headers.get('Set-Cookie') || '',
      },
    });
  } catch (error) {
    return NextResponse.json(
        {error_msg: formatErrorMessage(error, '服务器内部错误，请稍后重试')},
        {status: 500},
    );
  }
}

/**
 * 检查是否为领取请求
 */
function isReceiveRequest(pathname: string, method: string): boolean {
  return pathname.includes('/receive') && method === 'POST';
}

/**
 * 中间件主函数
 */
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 处理领取请求
  if (isReceiveRequest(pathname, request.method)) {
    return handleReceiveRequest(request, pathname);
  }

  // 其他请求直接通过
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
