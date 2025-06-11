import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期为可读的字符串
 * @param dateString - ISO日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * 格式化日期时间为可读的字符串
 * @param dateString - ISO日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * 格式化日期时间为精确到秒的字符串
 * @param dateString - ISO日期字符串
 * @returns 格式化后的日期时间字符串（精确到秒）
 */
export function formatDateTimeWithSeconds(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}
