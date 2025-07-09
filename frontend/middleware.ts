import {NextRequest, NextResponse} from 'next/server';
import CryptoJS from 'crypto-js';

const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';
const HCAPTCHA_SECRET_KEY = process.env.HCAPTCHA_SECRET_KEY || 'your-hcaptcha-secret-key';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// PoW 配置
const POW_DIFFICULTY = 18;
const POW_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const TARGET_PREFIX = '0'.repeat(POW_DIFFICULTY);

interface HCaptchaResponse {
  success: boolean;
  'error-codes'?: string[];
}

interface ProjectData {
  data?: {
    start_time: string;
    end_time: string;
  };
}

interface ReceiveRequestBody {
  captcha_token?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface ChallengeStore {
  [key: string]: {
    timestamp: number;
    used: boolean;
  };
}

// 内存存储 challenge，生产环境可以使用 Redis
const challengeStore: ChallengeStore = {};

// 定期清理过期的 challenge
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of Object.entries(challengeStore)) {
    if (now - value.timestamp > POW_EXPIRY) {
      delete challengeStore[key];
    }
  }
}, 60000); // 每分钟清理一次

/**
 * 生成 PoW 挑战
 */
function generateChallenge(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * 验证 PoW 解决方案
 */
function verifyPOW(challenge: string, nonce: number): boolean {
  // 检查 challenge 是否存在且未过期
  const challengeData = challengeStore[challenge];
  if (!challengeData) {
    return false;
  }

  const now = Date.now();
  if (now - challengeData.timestamp > POW_EXPIRY) {
    delete challengeStore[challenge];
    return false;
  }

  // 检查是否已被使用（防重放攻击）
  if (challengeData.used) {
    return false;
  }

  // 标记为已使用
  challengeData.used = true;

  // 验证 PoW
  const input = `${challenge}:${nonce}`;
  // eslint-disable-next-line new-cap
  const hash = CryptoJS.SHA256(input).toString();

  return hash.startsWith(TARGET_PREFIX);
}

/**
 * 处理项目列表请求的 PoW 验证
 */
async function handleProjectListPoW(request: NextRequest): Promise<NextResponse | null> {
  const challenge = request.headers.get('x-pow-challenge');
  const nonceStr = request.headers.get('x-pow-nonce');

  // 如果没有 PoW 头部，返回 challenge
  if (!challenge || !nonceStr) {
    const newChallenge = generateChallenge();
    const expiresAt = Date.now() + POW_EXPIRY;

    // 存储 challenge
    challengeStore[newChallenge] = {
      timestamp: Date.now(),
      used: false,
    };

    return NextResponse.json(
        {
          error_msg: 'POW challenge required',
          data: {
            challenge: newChallenge,
            expires_at: Math.floor(expiresAt / 1000),
          },
        },
        {status: 401},
    );
  }

  // 验证 PoW
  const nonce = parseInt(nonceStr, 10);
  if (isNaN(nonce) || !verifyPOW(challenge, nonce)) {
    return NextResponse.json(
        {
          error_msg: 'Invalid POW solution',
          data: null,
        },
        {status: 401},
    );
  }

  // 验证通过，转发请求到后端
  const backendUrl = `${BACKEND_BASE_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': 'CDK-Frontend-Middleware',
      },
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
        {
          error_msg: formatErrorMessage(error, '服务器暂时不可用，请稍后重试'),
          data: null,
        },
        {status: 500},
    );
  }
}

/**
 * 处理 PoW challenge 请求
 */
function handlePOWChallenge(): NextResponse {
  const challenge = generateChallenge();
  const expiresAt = Date.now() + POW_EXPIRY;

  // 存储 challenge
  challengeStore[challenge] = {
    timestamp: Date.now(),
    used: false,
  };

  return NextResponse.json({
    error_msg: '',
    data: {
      challenge,
      expires_at: Math.floor(expiresAt / 1000),
    },
  });
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
 * 验证项目时间有效性
 */
async function validateProjectTime(projectId: string, request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  try {
    const projectCheckUrl = `${BACKEND_BASE_URL}/api/v1/projects/${projectId}`;

    // 使用 AbortController 实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const projectResponse = await fetch(projectCheckUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': 'CDK-Frontend-Middleware',
      },
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!projectResponse.ok) {
      if (projectResponse.status === 404) {
        return {valid: false, error: '项目不存在或已被删除'};
      }
      if (projectResponse.status === 403) {
        return {valid: false, error: '无权访问此项目'};
      }
      return {valid: false, error: `获取项目信息失败 (${projectResponse.status})，请稍后重试`};
    }

    const projectData: ProjectData = await projectResponse.json();

    if (!projectData.data) {
      return {valid: false, error: '项目不存在'};
    }

    const now = new Date();
    const startTime = new Date(projectData.data.start_time);
    const endTime = new Date(projectData.data.end_time);

    if (now < startTime) {
      return {valid: false, error: '项目尚未开始'};
    }

    if (now > endTime) {
      return {valid: false, error: '项目已结束'};
    }

    return {valid: true};
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {valid: false, error: '验证超时，请稍后重试'};
    }

    return {valid: false, error: formatErrorMessage(error, '服务器暂时无法验证项目信息，请稍后重试')};
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

    // 提取项目ID并验证时间
    const pathParts = pathname.split('/');
    const projectId = pathParts[4]; // /api/v1/projects/{id}/receive

    if (projectId) {
      const timeValidation = await validateProjectTime(projectId, request);
      if (!timeValidation.valid) {
        return NextResponse.json(
            {error_msg: timeValidation.error},
            {status: 400},
        );
      }
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
 * 检查是否为项目列表请求
 */
function isProjectListRequest(pathname: string, method: string): boolean {
  return pathname === '/api/v1/projects' && method === 'GET';
}

/**
 * 检查是否为 PoW challenge 请求
 */
function isPOWChallengeRequest(pathname: string, method: string): boolean {
  return pathname === '/api/v1/projects/pow/challenge' && method === 'GET';
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

  // 处理 PoW challenge 请求
  if (isPOWChallengeRequest(pathname, request.method)) {
    return handlePOWChallenge();
  }

  // 处理项目列表请求的 PoW 验证
  if (isProjectListRequest(pathname, request.method)) {
    return await handleProjectListPoW(request);
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
