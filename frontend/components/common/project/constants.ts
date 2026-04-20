import {TrustLevel} from '@/lib/services/core/types';

/**
 * 表单验证常量
 */
export const FORM_LIMITS = {
  PROJECT_NAME_MAX_LENGTH: 32,
  TAG_MAX_LENGTH: 16,
  MAX_TAGS: 10,
  DESCRIPTION_MAX_LENGTH: 1024,
  CONTENT_ITEM_MAX_LENGTH: 1024,
  PRICE_MAX: 99999999.99,
} as const;

/**
 * 平台货币单位
 */
export const CURRENCY_LABEL = 'LDC' as const;

/**
 * 校验价格字符串,返回 null 或错误消息
 */
export const validatePriceString = (value: string): string | null => {
  if (value === '' || value === undefined || value === null) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return '价格最多保留 2 位小数';
  }
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    return '价格必须大于等于 0';
  }
  if (num > FORM_LIMITS.PRICE_MAX) {
    return '价格超出允许范围';
  }
  return null;
};

/**
 * 默认表单值
 */
export const DEFAULT_FORM_VALUES = {
  RISK_LEVEL: 60 as number,
  TIME_OFFSET_24H: (24 * 60 * 60 * 1000) as number,
} as const;

/**
 * 分发模式名称映射
 */
export const DISTRIBUTION_MODE_NAMES: Record<number, string> = {
  0: '一码一用',
  1: '抽奖分发',
  2: '邀请制',
};

/**
 * 信任等级配置 - 用于下拉选择器
 */
export const TRUST_LEVEL_OPTIONS = [
  {value: TrustLevel.NEW_USER, label: '新用户'},
  {value: TrustLevel.BASIC_USER, label: '基本用户'},
  {value: TrustLevel.USER, label: '成员'},
  {value: TrustLevel.ACTIVE_USER, label: '活跃用户'},
  {value: TrustLevel.LEADER, label: '领导者'},
];

/**
 * 信任等级配置 - 用于卡片样式和显示
 */
export const TRUST_LEVEL_CONFIG: Record<number, {name: string; gradient: string}> = {
  0: {name: '新用户', gradient: 'bg-gradient-to-br from-gray-600 to-gray-700'},
  1: {name: '基本用户', gradient: 'bg-gradient-to-br from-emerald-500 to-cyan-500'},
  2: {name: '成员', gradient: 'bg-gradient-to-br from-blue-600 to-purple-700'},
  3: {name: '活跃用户', gradient: 'bg-gradient-to-br from-purple-600 to-pink-600'},
  4: {name: '领导者', gradient: 'bg-gradient-to-br from-orange-500 to-pink-500'},
};

/**
 * 基于项目最低信任等级生成渐变配色
 */
export const getTrustLevelGradient = (trustLevel: number): string => {
  return (
    TRUST_LEVEL_CONFIG[trustLevel]?.gradient || TRUST_LEVEL_CONFIG[0].gradient
  );
};

/**
 * 解析导入的内容文本 - 通用工具函数
 * 支持多种格式：
 * 1. JSON 数组格式：[{}, {}, {}]
 * 2. 每行一个内容
 * 3. 逗号分隔格式（向后兼容）
 */
export const parseImportContent = (content: string): string[] => {
  const trimmedContent = content.trim();

  // 尝试解析为 JSON 数组
  if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
    try {
      const jsonArray = JSON.parse(trimmedContent);
      if (Array.isArray(jsonArray)) {
        return jsonArray
            .map((item) => {
              if (typeof item === 'object' && item !== null) {
                return JSON.stringify(item);
              }
              return String(item);
            })
            .filter((item) => item.trim())
            .map((item) => item.substring(0, FORM_LIMITS.CONTENT_ITEM_MAX_LENGTH));
      }
    } catch {
      // JSON 解析失败，继续使用原有逻辑
    }
  }

  // 原有逻辑：按行分割，如果只有一行则按逗号分割
  let parsed = trimmedContent.split('\n').filter((item) => item.trim());
  if (parsed.length === 1) {
    parsed = trimmedContent
        .replace(/，/g, ',')
        .split(',')
        .filter((item) => item.trim());
  }
  return parsed
      .map((item) =>
        item.trim().substring(0, FORM_LIMITS.CONTENT_ITEM_MAX_LENGTH),
      )
      .filter((item) => item);
};

/**
 * 批量导入分发内容的通用逻辑（带过滤开关）
 */
export const handleBulkImportContentWithFilter = (
    bulkContent: string,
    currentItems: string[],
    allowDuplicates: boolean,
    onSuccess: (
    newItems: string[],
    importedCount: number,
    skippedInfo?: string,
  ) => void,
    onError: (message: string) => void,
) => {
  const trimmedContent = bulkContent.trim();
  if (!trimmedContent) {
    onError('请输入要导入的内容');
    return;
  }

  const rawItems = parseImportContent(trimmedContent);
  if (rawItems.length === 0) {
    onError('未找到有效的内容');
    return;
  }

  if (allowDuplicates) {
    // 不过滤重复内容，直接添加所有内容
    const updatedItems = [...currentItems, ...rawItems];
    onSuccess(updatedItems, rawItems.length);
    return;
  }

  // 过滤重复内容（原有逻辑）
  const uniqueNewItems = [...new Set(rawItems)];
  const selfDuplicateCount = rawItems.length - uniqueNewItems.length;

  const existingSet = new Set(currentItems);
  const finalItems = uniqueNewItems.filter((item) => !existingSet.has(item));
  const existingDuplicateCount = uniqueNewItems.length - finalItems.length;

  if (finalItems.length === 0) {
    const totalDuplicates = selfDuplicateCount + existingDuplicateCount;
    onError(`所有内容都重复，共跳过 ${totalDuplicates} 个重复项`);
    return;
  }

  const updatedItems = [...currentItems, ...finalItems];

  let skippedInfo = '';
  const totalSkipped = selfDuplicateCount + existingDuplicateCount;
  if (totalSkipped > 0) {
    const details = [];
    if (selfDuplicateCount > 0) {
      details.push(`${selfDuplicateCount} 个内容重复`);
    }
    if (existingDuplicateCount > 0) {
      details.push(`${existingDuplicateCount} 个已存在`);
    }
    skippedInfo = `，已跳过 ${details.join('，')}`;
  }

  onSuccess(updatedItems, finalItems.length, skippedInfo);
};

/**
 * 批量导入分发内容的通用逻辑（保持向后兼容）
 */
export const handleBulkImportContent = (
    bulkContent: string,
    currentItems: string[],
    onSuccess: (
    newItems: string[],
    importedCount: number,
    skippedInfo?: string,
  ) => void,
    onError: (message: string) => void,
) => {
  handleBulkImportContentWithFilter(bulkContent, currentItems, false, onSuccess, onError);
};

/**
 * 项目表单验证通用逻辑
 */
export const validateProjectForm = (formData: {
  name: string;
  startTime: Date | null;
  endTime: Date | null;
}): { isValid: boolean; errorMessage?: string } => {
  if (!formData.name.trim()) {
    return {isValid: false, errorMessage: '项目名称不能为空'};
  }

  if (!formData.startTime || !formData.endTime) {
    return {isValid: false, errorMessage: '请选择开始和结束时间'};
  }

  if (formData.endTime <= formData.startTime) {
    return {isValid: false, errorMessage: '结束时间必须晚于开始时间'};
  }

  return {isValid: true};
};
