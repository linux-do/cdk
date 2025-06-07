'use client';

import {useState, useCallback} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {Button} from '@/components/ui/button';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/animate-ui/radix/dialog';
import {Tabs, TabsList, TabsTrigger, TabsContent, TabsContents} from '@/components/animate-ui/radix/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/animate-ui/radix/checkbox';
import {DateTimePicker} from '@/components/ui/DateTimePicker';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {X, Plus, User, Lock, Copy, ExternalLink, CheckCircle} from 'lucide-react';
import {toast} from 'sonner';
import {useAuth} from '@/hooks/use-auth';
import services from '@/lib/services';
import {TrustLevel} from '@/lib/services/core/types';
import {DistributionType} from '@/lib/services/project/types';
import {Counter} from '@/components/animate-ui/components/counter';

/** 表单验证常量 */
const FORM_LIMITS = {
  PROJECT_NAME_MAX_LENGTH: 32,
  TAG_MAX_LENGTH: 16,
  MAX_TAGS: 10,
  DESCRIPTION_MAX_LENGTH: 1024,
  CONTENT_ITEM_MAX_LENGTH: 1024,
} as const;

/** 默认表单值 */
const DEFAULT_FORM_VALUES = {
  RISK_LEVEL: 80 as number,
  TIME_OFFSET_24H: 24 * 60 * 60 * 1000 as number,
} as const;

/** 项目信息类型 */
interface ProjectInfo {
  id: string;
  name: string;
}

/**
 * 创建项目对话框组件
 * 提供创建新项目的表单界面，包含基本设置和分发内容两个标签页
 * 
 * @returns 创建项目的对话框组件
 */
export function CreateDialog() {
  const {user} = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  /** 创建成功状态 */
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<ProjectInfo | null>(null);

  /** 主表单数据状态 */
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + DEFAULT_FORM_VALUES.TIME_OFFSET_24H), 
    minimumTrustLevel: TrustLevel.NEW_USER,
    allowSameIP: false,
    riskLevel: DEFAULT_FORM_VALUES.RISK_LEVEL,
    distributionType: DistributionType.ONE_FOR_EACH,
  });

  /** 标签相关状态 */
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  /** 分发内容相关状态 */
  const [items, setItems] = useState<string[]>([]);
  const [bulkContent, setBulkContent] = useState('');
  
  /** 界面状态 */
  const [activeTab, setActiveTab] = useState('basic');

  /**
   * 重置表单为初始状态
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(Date.now() + DEFAULT_FORM_VALUES.TIME_OFFSET_24H),
      minimumTrustLevel: TrustLevel.NEW_USER,
      allowSameIP: false,
      riskLevel: DEFAULT_FORM_VALUES.RISK_LEVEL,
      distributionType: DistributionType.ONE_FOR_EACH,
    });
    setTags([]);
    setNewTag('');
    setItems([]);
    setActiveTab('basic');
    setBulkContent('');
    setCreateSuccess(false);
    setCreatedProject(null);
  }, []);

  /**
   * 添加项目标签
   */
  const addTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < FORM_LIMITS.MAX_TAGS) {
      setTags(prev => [...prev, trimmedTag]);
      setNewTag('');
    }
  }, [newTag, tags]);

  /**
   * 删除指定标签
   */
  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  /**
   * 删除指定索引的分发内容
   */
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /**
   * 解析导入的内容文本
   * @param content - 原始内容文本
   * @returns 解析后的内容数组
   */
  const parseImportContent = useCallback((content: string): string[] => {
    let parsed = content.split('\n').filter(item => item.trim());
    if (parsed.length === 1) {
      parsed = content.replace(/，/g, ',').split(',').filter(item => item.trim());
    }
    return parsed
      .map(item => item.trim().substring(0, FORM_LIMITS.CONTENT_ITEM_MAX_LENGTH))
      .filter(item => item);
  }, []);

  /**
   * 构建导入成功消息
   */
  const buildImportMessage = useCallback((
    finalCount: number, 
    selfDuplicates: number, 
    existingDuplicates: number
  ): string => {
    let message = `成功导入 ${finalCount} 个内容`;
    const totalSkipped = selfDuplicates + existingDuplicates;
    
    if (totalSkipped > 0) {
      const details = [];
      if (selfDuplicates > 0) details.push(`${selfDuplicates} 个内容重复`);
      if (existingDuplicates > 0) details.push(`${existingDuplicates} 个已存在`);
      message += `，已跳过 ${details.join('，')}`;
    }
    return message;
  }, []);

  /**
   * 批量导入分发内容
   * 支持换行分隔和逗号分隔(中英文)的格式，自动过滤重复内容
   */
  const handleBulkImport = useCallback(() => {
    const trimmedContent = bulkContent.trim();
    if (!trimmedContent) {
      toast.error('请输入要导入的内容');
      return;
    }

    const rawItems = parseImportContent(trimmedContent);
    if (rawItems.length === 0) {
      toast.error('未找到有效的内容');
      return;
    }

    const uniqueNewItems = [...new Set(rawItems)];
    const selfDuplicateCount = rawItems.length - uniqueNewItems.length;

    const existingSet = new Set(items);
    const finalItems = uniqueNewItems.filter(item => !existingSet.has(item));
    const existingDuplicateCount = uniqueNewItems.length - finalItems.length;

    if (finalItems.length === 0) {
      const totalDuplicates = selfDuplicateCount + existingDuplicateCount;
      toast.error(`所有内容都重复，共跳过 ${totalDuplicates} 个重复项`);
      return;
    }

    setItems(prev => [...prev, ...finalItems]);
    setBulkContent('');
    
    const message = buildImportMessage(finalItems.length, selfDuplicateCount, existingDuplicateCount);
    toast.success(message);
  }, [bulkContent, items, parseImportContent, buildImportMessage]);

  /**
   * 表单验证
   * @returns 验证是否通过
   */
  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      toast.error('项目名称不能为空');
      return false;
    }
    
    if (!formData.startTime || !formData.endTime) {
      toast.error('请选择开始和结束时间');
      return false;
    }

    if (formData.distributionType === DistributionType.ONE_FOR_EACH && items.length === 0) {
      toast.error('至少需要添加一个分发内容');
      setActiveTab('distribution');
      return false;
    }

    return true;
  }, [formData, items.length]);

  /**
   * 构建项目创建请求数据
   */
  const buildProjectData = useCallback(() => ({
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    project_tags: tags.length > 0 ? tags : undefined,
    start_time: formData.startTime.toISOString(),
    end_time: formData.endTime.toISOString(),
    minimum_trust_level: formData.minimumTrustLevel,
    allow_same_ip: formData.allowSameIP,
    risk_level: formData.riskLevel,
    distribution_type: formData.distributionType,
    project_items: formData.distributionType === DistributionType.ONE_FOR_EACH 
      ? items 
      : ['手动邀请模式'],
  }), [formData, tags, items]);

  /**
   * 提交表单创建项目
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const projectData = buildProjectData();
      const result = await services.project.createProjectSafe(projectData);

      if (!result.success) {
        toast.error(result.error || '创建项目失败');
        return;
      }

      const projectId = (result as {data?: {id?: string}})?.data?.id || `project_${Date.now()}`;
      setCreateSuccess(true);
      setCreatedProject({id: projectId, name: formData.name.trim()});
      toast.success('项目创建成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建项目失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [validateForm, buildProjectData, formData.name]);

  /** 信任等级选项列表 */
  const trustLevelOptions = [
    {value: TrustLevel.NEW_USER, label: '新用户'},
    {value: TrustLevel.BASIC_USER, label: '基础用户'},
    {value: TrustLevel.USER, label: '普通用户'},
    {value: TrustLevel.ACTIVE_USER, label: '活跃用户'},
    {value: TrustLevel.LEADER, label: '领导者'},
  ];

  /**
   * 获取项目领取链接
   * @param projectId - 项目ID
   * @returns 完整的领取链接
   */
  const getReceiveLink = useCallback((projectId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || window.location.origin;
    return `${baseUrl}/receive/${projectId}`;
  }, []);

  /**
   * 复制链接到剪贴板
   * @param link - 要复制的链接
   */
  const copyLink = useCallback(async (link: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('链接已复制到剪贴板');
    } catch (err) {
      // 复制失败时提供备选方案
      toast.error('复制失败，请手动复制');
      console.warn('Clipboard API failed:', err);
    }
  }, []);

  /**
   * 在新标签页中打开链接
   * @param link - 要打开的链接
   */
  const openLink = useCallback((link: string): void => {
    window.open(link, '_blank', 'noopener,noreferrer');
  }, []);

  if (!user) {
    return null;
  }

  /**
   * 渲染项目创建对话框
   */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建项目
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-3xl max-h-[90vh]'} overflow-hidden`}>
        <DialogHeader>
          <DialogTitle>{createSuccess ? '项目创建成功' : '创建新项目'}</DialogTitle>
          <DialogDescription>
            {createSuccess 
              ? '您的项目已创建成功，可以开始分发内容了'
              : '创建一个新的项目来管理和分发您的内容'
            }
          </DialogDescription>
        </DialogHeader>

        {createSuccess && createdProject ? (
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <div>
                  <h3 className="text-lg font-semibold">项目创建成功</h3>
                  <p className="text-sm text-muted-foreground">项目名称：{createdProject.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-sm font-medium">项目领取链接</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  用户可以通过此链接领取您分发的内容
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <Input value={getReceiveLink(createdProject.id)} readOnly className="bg-transparent border-none text-sm" />
                  </div>
                  <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                    <Button size="sm" variant="outline" onClick={() => copyLink(getReceiveLink(createdProject.id))} className={isMobile ? 'w-full' : ''}>
                      <Copy className="h-4 w-4 mr-1" />
                      复制链接
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openLink(getReceiveLink(createdProject.id))} className={isMobile ? 'w-full' : ''}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      前往查看
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本设置</TabsTrigger>
              <TabsTrigger value="distribution">分发内容</TabsTrigger>
            </TabsList>

            <TabsContents className="mx-1 mb-1 -mt-2 rounded-sm h-full bg-background">
              {/* ===== 基本设置标签页 ===== */}
              <TabsContent value="basic" className={`space-y-6 py-6 px-1 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}>
                {/* 项目名称 */}
                <div className="space-y-2">
                  <Label htmlFor="name">项目名称 *</Label>
                  <Input
                    id="name"
                    placeholder={`请填写此项目的名称（${FORM_LIMITS.PROJECT_NAME_MAX_LENGTH}字符以内）`}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    maxLength={FORM_LIMITS.PROJECT_NAME_MAX_LENGTH}
                  />
                </div>

                {/* 项目标签 */}
                <div className="space-y-2">
                  <Label>项目标签</Label>
                  <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                    <Input
                      placeholder={`请选择或添加关联标签（${FORM_LIMITS.TAG_MAX_LENGTH}字符以内，最多${FORM_LIMITS.MAX_TAGS}个标签）`}
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addTag()}
                      maxLength={FORM_LIMITS.TAG_MAX_LENGTH}
                    />
                    <Button type="button" variant="outline" onClick={addTag} className={isMobile ? 'w-full' : ''}>
                      添加
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 项目描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description">项目描述</Label>
                  <Textarea
                    id="description"
                    placeholder={`请输入项目描述，支持Markdown格式（${FORM_LIMITS.DESCRIPTION_MAX_LENGTH}字符以内）`}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="resize-none h-48"
                    maxLength={FORM_LIMITS.DESCRIPTION_MAX_LENGTH}
                    rows={4}
                  />
                </div>

                {/* 开始时间、结束时间 */}
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  <DateTimePicker
                    label="开始时间"
                    value={formData.startTime}
                    onChange={(date) => setFormData({...formData, startTime: date || new Date()})}
                    placeholder="选择开始时间"
                    required
                  />
                  <DateTimePicker
                    label="结束时间"
                    value={formData.endTime}
                    onChange={(date) => setFormData({...formData, endTime: date || new Date()})}
                    placeholder="选择结束时间"
                    required
                  />
                </div>

                {/* 最低信任等级、最低风险系数 */}
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  <div className="space-y-2">
                    <Label>最低信任等级</Label>
                    <Select
                      value={formData.minimumTrustLevel.toString()}
                      onValueChange={value =>
                        setFormData({
                          ...formData,
                          minimumTrustLevel: parseInt(value) as TrustLevel,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {trustLevelOptions.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">最低风险系数</Label>
                    <div className="flex items-center w-full">
                      <Counter
                        number={formData.riskLevel}
                        setNumber={(value) => setFormData({...formData, riskLevel: Math.max(0, Math.min(100, value))})}
                        className="flex w-full justify-between items-center"
                        buttonProps={{
                          variant: "outline",
                          size: "sm"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* IP 管控 */}
                <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                  <Checkbox
                    id="allowSameIP"
                    checked={formData.allowSameIP}
                    onCheckedChange={(checked) => setFormData({...formData, allowSameIP: checked === true})}
                    className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                  />
                  <div className="grid gap-1.5 font-normal">
                    <p className="text-sm leading-none font-medium">
                      IP 管控
                    </p>
                    <p className="text-muted-foreground text-sm">
                      如果开启，则同一个 IP 只能领取一次。
                    </p>
                  </div>
                </Label>
              </TabsContent>

              {/* ===== 分发内容标签页 ===== */}
              <TabsContent value="distribution" className={`space-y-6 py-6 px-1 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}>
                {/* 选择分发模式 */}
                <div className="space-y-3">
                  <Label>分发模式</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 一码一用 */}
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        formData.distributionType === DistributionType.ONE_FOR_EACH
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData({...formData, distributionType: DistributionType.ONE_FOR_EACH})}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          formData.distributionType === DistributionType.ONE_FOR_EACH
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">一码一用</h3>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            邀请码仅供一人使用
                          </p>
                        </div>
                        {formData.distributionType === DistributionType.ONE_FOR_EACH && (
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>

                    {/* 手动邀请 */}
                    <div
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        formData.distributionType === DistributionType.INVITE
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData({...formData, distributionType: DistributionType.INVITE})}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          formData.distributionType === DistributionType.INVITE
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Lock className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">手动邀请</h3>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            用户填写内容后发放
                          </p>
                        </div>
                        {formData.distributionType === DistributionType.INVITE && (
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 分发模式内容 */}
                {formData.distributionType === DistributionType.ONE_FOR_EACH ? (
                  <div className="space-y-4">
                    {/* 标题栏 */}
                    <div className="flex items-center">
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="text-sm font-medium">导入分发内容</div>
                        <Badge variant="secondary" className="bg-muted">
                          已添加: {items.length}个
                        </Badge>
                      </div>
                    </div>

                    {/* 批量导入部分 */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="请输入分发内容，支持以 逗号分隔（中英文逗号均可）或 每行一个内容 的格式批量导入"
                        value={bulkContent}
                        onChange={e => setBulkContent(e.target.value)}
                        className="h-[100px]"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleBulkImport}
                          size="sm"
                          className="mt-1 text-sm"
                        >
                          导入
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1 text-sm bg-gray-100 text-muted-foreground hover:text-destructive hover:bg-transparent rounded-sm"
                          onClick={() => setBulkContent('')}
                        >
                          清空
                        </Button>
                      </div>
                    </div>

                    {/* 内容预览 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">已添加内容</Label>
                        {items.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => setItems([])}
                          >
                            清空全部
                          </Button>
                        )}
                      </div>
                      
                      {items.length > 0 ? (
                        <div className="space-y-2 h-[150px] overflow-y-auto border rounded-md p-2">
                          {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                                {index + 1}
                              </div>
                              <div className="flex-1 truncate">{item}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-[150px] flex items-center justify-center py-8 text-sm text-center border rounded-md text-muted-foreground">
                          暂无分发内容，请在上方导入
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="text-lg font-medium text-muted-foreground mb-2">
                        敬请期待
                      </div>
                      <p className="text-sm text-muted-foreground">
                        手动邀请功能正在开发中
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </TabsContents>
          </Tabs>
        )}

        <DialogFooter className="flex-col gap-2">
          {createSuccess ? (
            <Button onClick={() => { setOpen(false); resetForm(); }} className="w-full">
              关闭
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="w-full">
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? '创建中...' : '创建'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 