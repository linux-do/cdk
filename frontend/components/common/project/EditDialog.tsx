'use client';

import {useState, useEffect, useCallback} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/badge';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {FileUpload} from '@/components/ui/file-upload';
import {TagSelector} from '@/components/ui/tag-selector';
import {DateTimePicker} from '@/components/ui/DateTimePicker';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Checkbox} from '@/components/animate-ui/radix/checkbox';
import {Counter} from '@/components/animate-ui/components/counter';
import {Tabs, TabsList, TabsTrigger, TabsContent, TabsContents} from '@/components/animate-ui/radix/tabs';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/animate-ui/radix/dialog';
import {FORM_LIMITS, TRUST_LEVEL_OPTIONS, handleBulkImportContentWithFilter, validateProjectForm} from '@/components/common/project';
import MarkdownEditor from '@/components/common/markdown/Editor';
import {X, Pencil, CheckCircle, Filter} from 'lucide-react';
import services from '@/lib/services';
import {TrustLevel} from '@/lib/services/core/types';
import {ProjectListItem} from '@/lib/services/project/types';

interface EditDialogProps {
  project: ProjectListItem;
  children?: React.ReactNode;
  onProjectUpdated?: (project: ProjectListItem) => void;
}

/**
 * 编辑项目对话框组件
 */
export function EditDialog({
  project,
  children,
  onProjectUpdated,
}: EditDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    startTime: new Date(project.start_time),
    endTime: new Date(project.end_time),
    minimumTrustLevel: project.minimum_trust_level,
    allowSameIP: project.allow_same_ip,
    riskLevel: project.risk_level,
  });

  const [tags, setTags] = useState<string[]>(project.tags || []);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newItems, setNewItems] = useState<string[]>([]);
  const [bulkContent, setBulkContent] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  /**
   * 获取可用标签列表
   */
  const fetchTags = async () => {
    try {
      const result = await services.project.getTagsSafe();
      if (result.success) {
        setAvailableTags(result.tags);
      } else {
        setAvailableTags([]);
        console.warn('获取标签列表失败:', result.error);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
      setAvailableTags([]);
    }
  };

  /**
   * 重置表单状态
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: project.name,
      description: project.description || '',
      startTime: new Date(project.start_time),
      endTime: new Date(project.end_time),
      minimumTrustLevel: project.minimum_trust_level,
      allowSameIP: project.allow_same_ip,
      riskLevel: project.risk_level,
    });
    setTags(project.tags || []);
    setNewItems([]);
    setActiveTab('basic');
    setBulkContent('');
    setAllowDuplicates(false);
    setUpdateSuccess(false);
    setFileUploadOpen(false);
  }, [project]);

  useEffect(() => {
    if (open) {
      fetchTags();
      resetForm();
    }
  }, [open, resetForm]);

  const removeItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  /**
   * 批量导入分发内容
   */
  const handleBulkImport = () => {
    handleBulkImportContentWithFilter(
        bulkContent,
        newItems,
        allowDuplicates,
        (updatedItems: string[], importedCount: number, skippedInfo?: string) => {
          setNewItems(updatedItems);
          setBulkContent('');
          const message = `成功导入 ${importedCount} 个内容${skippedInfo || ''}`;
          toast.success(message);
        },
        (errorMessage: string) => {
          toast.error(errorMessage);
        },
    );
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.txt')) {
      toast.error('仅支持上传 .txt 格式的文件');
      return;
    }

    // 检查文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        // 按行分割并过滤空行
        const lines = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length === 0) {
          toast.error('文件内容为空');
          return;
        }

        // 执行导入
        handleBulkImportContentWithFilter(
            lines.join('\n'),
            newItems,
            allowDuplicates,
            (updatedItems: string[], importedCount: number, skippedInfo?: string) => {
              setNewItems(updatedItems);
              const message = `从文件成功导入 ${importedCount} 个内容${skippedInfo || ''}`;
              toast.success(message);
              setFileUploadOpen(false);
            },
            (errorMessage: string) => {
              toast.error(errorMessage);
            },
        );
      }
    };

    reader.onerror = () => {
      toast.error('文件读取失败');
    };

    reader.readAsText(file, 'UTF-8');
  };

  /**
   * 表单验证
   */
  const validateForm = (): boolean => {
    const baseValidation = validateProjectForm({
      name: formData.name,
      startTime: formData.startTime,
      endTime: formData.endTime,
    });

    if (!baseValidation.isValid) {
      toast.error(baseValidation.errorMessage!);
      return false;
    }

    return true;
  };

  /**
   * 提交表单更新项目
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_tags: tags.length > 0 ? tags : undefined,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        minimum_trust_level: formData.minimumTrustLevel,
        allow_same_ip: formData.allowSameIP,
        risk_level: formData.riskLevel,
        project_items: newItems.length > 0 ? newItems : undefined,
      };

      const result = await services.project.updateProjectSafe(
          project.id,
          updateData,
      );

      if (!result.success) {
        toast.error(result.error || '更新项目失败');
        return;
      }

      const updatedProject = {
        ...project,
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: tags,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        minimum_trust_level: formData.minimumTrustLevel,
        allow_same_ip: formData.allowSameIP,
        risk_level: formData.riskLevel,
        total_items: project.total_items + newItems.length,
      };

      setUpdateSuccess(true);
      toast.success('项目更新成功！');

      onProjectUpdated?.(updatedProject);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新项目失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-3xl max-h-[90vh]'} overflow-hidden`}
      >
        <DialogHeader>
          <DialogTitle>
            {updateSuccess ? '项目更新成功' : '编辑项目'}
          </DialogTitle>
          <DialogDescription>
            {updateSuccess ? '您的项目已更新成功' : '修改项目信息和设置'}
          </DialogDescription>
        </DialogHeader>

        {updateSuccess ? (
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <div>
                  <h3 className="text-lg font-semibold">项目更新成功</h3>
                  <p className="text-sm text-muted-foreground">
                    项目名称：{formData.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本设置</TabsTrigger>
              <TabsTrigger value="content">追加内容</TabsTrigger>
            </TabsList>

            <TabsContents className="mx-1 mb-1 -mt-2 rounded-sm h-full bg-background">
              <TabsContent
                value="basic"
                className={`space-y-6 py-6 px-1 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">项目名称 *</Label>
                  <Input
                    id="name"
                    placeholder={`请填写此项目的名称（${FORM_LIMITS.PROJECT_NAME_MAX_LENGTH}字符以内）`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({...formData, name: e.target.value})
                    }
                    maxLength={FORM_LIMITS.PROJECT_NAME_MAX_LENGTH}
                  />
                </div>

                <div className="space-y-2">
                  <Label>项目标签</Label>
                  <TagSelector
                    selectedTags={tags}
                    availableTags={availableTags}
                    maxTagLength={FORM_LIMITS.TAG_MAX_LENGTH}
                    maxTags={FORM_LIMITS.MAX_TAGS}
                    onTagsChange={setTags}
                    placeholder="请选择或添加关联标签"
                    isMobile={isMobile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">项目描述</Label>
                  <MarkdownEditor
                    value={formData.description}
                    onChange={(value) =>
                      setFormData({...formData, description: value})
                    }
                    placeholder={`请输入项目描述，支持Markdown格式（${FORM_LIMITS.DESCRIPTION_MAX_LENGTH}字符以内）`}
                    maxLength={FORM_LIMITS.DESCRIPTION_MAX_LENGTH}
                    className="w-full"
                  />
                </div>

                <div
                  className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
                >
                  <DateTimePicker
                    label="开始时间"
                    value={formData.startTime}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        startTime: date || new Date(),
                      })
                    }
                    placeholder="选择开始时间"
                    required
                  />
                  <DateTimePicker
                    label="结束时间"
                    value={formData.endTime}
                    onChange={(date) =>
                      setFormData({...formData, endTime: date || new Date()})
                    }
                    placeholder="选择结束时间"
                    required
                  />
                </div>

                <div
                  className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
                >
                  <div className="space-y-2">
                    <Label>最低信任等级</Label>
                    <Select
                      value={formData.minimumTrustLevel.toString()}
                      onValueChange={(value) =>
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
                        {TRUST_LEVEL_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
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
                        setNumber={(value) =>
                          setFormData({
                            ...formData,
                            riskLevel: value,
                          })
                        }
                        min={0}
                        max={100}
                        step={1}
                        longPressDelay={300}
                        longPressSpeed={80}
                        className="flex w-full justify-between items-center"
                        buttonProps={{
                          variant: 'outline',
                          size: 'sm',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950">
                  <Checkbox
                    id="allowSameIP"
                    checked={formData.allowSameIP}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        allowSameIP: checked === true,
                      })
                    }
                    className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                  />
                  <div className="grid gap-1.5 font-normal">
                    <p className="text-sm leading-none font-medium">IP 管控</p>
                    <p className="text-muted-foreground text-sm">
                      如果开启，则同一个 IP 可以多次领取内容。
                    </p>
                  </div>
                </Label>
              </TabsContent>

              <TabsContent
                value="content"
                className={`space-y-6 py-6 px-1 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        追加分发内容
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        这里添加的内容将追加到现有项目中，不会替换原有内容。当前项目共有{' '}
                        <span className="font-medium">
                          {project.total_items}
                        </span>{' '}
                        个分发内容。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="text-sm font-medium">
                        导入新的分发内容
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer ${
                                   !allowDuplicates ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-muted hover:bg-muted/80'
                                }`}
                                onClick={() => setAllowDuplicates(!allowDuplicates)}
                              >
                                <Filter className="h-3 w-3 mr-1" />
                                {!allowDuplicates ? '已开启过滤' : '辅助过滤'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p className="text-xs">
                                {!allowDuplicates ?
                                   '已开启：自动过滤重复内容' :
                                   '已关闭：允许导入重复内容'
                                }
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                 点击切换过滤模式
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-gray-300"
                          onClick={() => setFileUploadOpen(true)}
                        >
                          TXT导入
                        </Badge>
                        <Badge variant="secondary" className="bg-muted">
                           待添加: {newItems.length}个
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="请输入要追加的分发内容，支持以 逗号分隔（中英文逗号均可）或 每行一个内容 的格式批量导入"
                      value={bulkContent}
                      onChange={(e) => setBulkContent(e.target.value)}
                      className="h-[100px] break-all overflow-x-auto whitespace-pre-wrap"
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
                        className="mt-1 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setBulkContent('')}
                      >
                        清空
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">待添加内容</Label>
                      {newItems.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => setNewItems([])}
                        >
                          清空全部
                        </Button>
                      )}
                    </div>

                    {newItems.length > 0 ? (
                      <div className="space-y-2 h-[150px] overflow-y-auto overflow-x-auto border rounded-md p-2">
                        {newItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
                          >
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0 break-all overflow-x-auto text-sm">{item}</div>
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
                        暂无待添加内容，请在上方导入
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </TabsContents>
          </Tabs>
        )}

        <DialogFooter className="flex-col gap-2">
          {updateSuccess ? (
            <Button
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="w-full"
            >
              关闭
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? '更新中...' : '更新项目'}
            </Button>
          )}
        </DialogFooter>

        {/* 文件上传对话框 */}
        <Dialog open={fileUploadOpen} onOpenChange={setFileUploadOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'max-w-lg'}`}>
            <DialogHeader>
              <DialogTitle>文件导入分发内容</DialogTitle>
              <DialogDescription className="text-xs">
                支持 .txt 格式• 每行一个邀请码 • 空行自动忽略 • 大小限制：5MB
              </DialogDescription>
            </DialogHeader>

            <FileUpload onChange={handleFileUpload} />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFileUploadOpen(false)}
                className="w-full"
              >
                取消
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
