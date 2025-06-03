/**
 * Session Cookie名称（需要与后端配置一致）
 */
export const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'linux_do_cdk_session_123123123';

/**
 * 获取Cookie值
 * @param name Cookie名称
 * @returns Cookie值，如果不存在返回null
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // 服务端环境
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  
  return null;
}

/**
 * 删除Cookie
 * @param name Cookie名称
 * @param path Cookie路径
 * @param domain Cookie域名
 */
export function deleteCookie(name: string, path = '/', domain?: string): void {
  if (typeof document === 'undefined') {
    return; // 服务端环境
  }

  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * 检查是否有有效的Session Cookie
 * @returns 是否有session cookie
 */
export function hasSessionCookie(): boolean {
  const sessionCookie = getCookie(SESSION_COOKIE_NAME);
  return !!sessionCookie;
}

/**
 * 清除Session Cookie
 */
export function clearSessionCookie(): void {
  deleteCookie(SESSION_COOKIE_NAME);
} 