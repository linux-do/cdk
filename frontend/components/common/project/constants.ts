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
} as const;

/**
 * 默认表单值
 */
export const DEFAULT_FORM_VALUES = {
  RISK_LEVEL: 70 as number,
  TIME_OFFSET_24H: (24 * 60 * 60 * 1000) as number,
} as const;

/**
 * 分发模式名称映射
 */
export const DISTRIBUTION_MODE_NAMES: Record<number, string> = {
  0: '一码一用',
  1: '邀请制',
};

/**
 * 信任等级配置 - 用于下拉选择器
 */
export const TRUST_LEVEL_OPTIONS = [
  {value: TrustLevel.NEW_USER, label: '新用户'},
  {value: TrustLevel.BASIC_USER, label: '基础用户'},
  {value: TrustLevel.USER, label: '普通用户'},
  {value: TrustLevel.ACTIVE_USER, label: '活跃用户'},
  {value: TrustLevel.LEADER, label: '领导者'},
];

/**
 * 信任等级配置 - 用于卡片样式和显示
 */
export const TRUST_LEVEL_CONFIG: Record<number, {name: string; gradient: string}> = {
  0: {name: '新用户', gradient: 'bg-gradient-to-br from-gray-600 to-gray-700'},
  1: {name: '基础用户', gradient: 'bg-gradient-to-br from-emerald-500 to-cyan-500'},
  2: {name: '用户', gradient: 'bg-gradient-to-br from-blue-600 to-purple-700'},
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
 */
export const parseImportContent = (content: string): string[] => {
  let parsed = content.split('\n').filter((item) => item.trim());
  if (parsed.length === 1) {
    parsed = content
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
