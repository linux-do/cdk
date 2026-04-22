'use client';

import {useState, useEffect, useCallback} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {useProjectForm} from '@/hooks/use-project-form';
import {useProjectTags} from '@/hooks/use-project-tags';
import {useBulkImport} from '@/hooks/use-bulk-import';
import {useFileUpload} from '@/hooks/use-file-upload';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tabs, TabsList, TabsTrigger, TabsContent, TabsContents} from '@/components/animate-ui/radix/tabs';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/animate-ui/radix/dialog';
import {validateProjectForm, validatePriceString, CURRENCY_LABEL} from '@/components/common/project';
import {ProjectBasicForm} from '@/components/common/project/ProjectBasicForm';
import {BulkImportSection} from '@/components/common/project/BulkImportSection';
import {Pencil, CheckCircle} from 'lucide-react';
import services from '@/lib/services';
import {DistributionType, ProjectListItem, UpdateProjectRequest} from '@/lib/services/project/types';

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
  const [activeTab, setActiveTab] = useState('basic');

  const {formData, setFormData, resetForm: resetProjectForm} = useProjectForm({
    mode: 'edit',
    project,
  });

  const {tags, setTags, availableTags, fetchTags, resetTags} = useProjectTags(
      project.tags || [],
  );

  const {
    items: newItems,
    setItems: setNewItems,
    bulkContent,
    setBulkContent,
    allowDuplicates,
    setAllowDuplicates,
    handleBulkImport,
    removeItem,
    clearItems: clearNewItems,
    resetBulkImport,
  } = useBulkImport();

  const {
    fileUploadOpen,
    setFileUploadOpen,
    handleFileUpload: handleFileUploadBase,
    closeFileUpload,
    confirmationOpen,
    setConfirmationOpen,
    pendingFile,
    handleConfirmUpload,
    handleCancelUpload,
  } = useFileUpload();


  const resetForm = useCallback(() => {
    resetProjectForm();
    resetTags(project.tags || []);
    resetBulkImport();
    setActiveTab('basic');
    setUpdateSuccess(false);
    closeFileUpload();
  }, [project, resetProjectForm, resetTags, resetBulkImport, closeFileUpload]);

  useEffect(() => {
    if (open) {
      fetchTags();
      resetForm();
    }
  }, [open, resetForm, fetchTags]);


  const handleFileUpload = (files: File[]) => {
    handleFileUploadBase(files, newItems, allowDuplicates, setNewItems);
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

    const priceError = validatePriceString(formData.price);
    if (priceError) {
      toast.error(priceError);
      return false;
    }
    const priceNum = Number(formData.price || '0');
    if (priceNum > 0 && project.distribution_type !== DistributionType.ONE_FOR_EACH) {
      toast.error(`仅"一码一用"分发支持设置 ${CURRENCY_LABEL} 金额`);
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
      const priceNum = Number(formData.price || '0');
      if (priceNum > 0) {
        const cfgResult = await services.payment.getConfigSafe();
        if (!cfgResult.success) {
          toast.error(cfgResult.error || '无法获取支付配置');
          setLoading(false);
          return;
        }
        if (!cfgResult.data?.payment_enabled) {
          toast.error('平台支付功能当前未启用');
          setLoading(false);
          return;
        }
        if (!cfgResult.data?.has_config) {
          toast.error('请先在"支付设置"中配置 clientID 与 clientSecret');
          setLoading(false);
          return;
        }
      }

      const updateData: UpdateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_tags: tags.length > 0 ? tags : undefined,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        minimum_trust_level: formData.minimumTrustLevel,
        allow_same_ip: formData.allowSameIP,
        risk_level: formData.riskLevel,
        price: formData.price || '0',
        // 只有非抽奖项目才允许更新项目内容
        ...(project.distribution_type !== DistributionType.LOTTERY && {
          project_items: newItems.length > 0 ? newItems : undefined,
          enable_filter: !allowDuplicates, // 如果不允许重复，则启用过滤
        }),
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
        total_items: project.distribution_type === DistributionType.LOTTERY ?
          project.total_items :
          project.total_items + newItems.length,
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
        showCloseButton={false}
        className={`${isMobile ? 'max-w-[92vw] max-h-[82vh]' : 'max-w-2xl max-h-[78vh]'} overflow-hidden rounded-[24px] border border-border/50 bg-background/95 p-0 shadow-[0_24px_60px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.03] dark:bg-background dark:shadow-[0_24px_60px_rgba(0,0,0,0.42)] dark:ring-white/[0.04]`}
      >
        <DialogHeader className={`gap-2 px-6 pt-4 ${isMobile ? 'text-left' : ''}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-0">
              <DialogTitle className={`text-lg font-semibold tracking-tight ${isMobile ? 'text-left' : ''}`}>
                {updateSuccess ? '项目更新成功' : '编辑项目'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {updateSuccess ? '您的项目已更新成功' : '修改项目信息和设置'}
              </DialogDescription>
            </div>

            {!updateSuccess && (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                variant="pill"
                className="w-full sm:w-auto"
              >
                <TabsList className={`w-full sm:w-fit ${project.distribution_type === DistributionType.LOTTERY ? 'grid grid-cols-1' : 'grid grid-cols-2'}`}>
                  <TabsTrigger value="basic" className="flex-1 sm:flex-none">基本设置</TabsTrigger>
                  {project.distribution_type !== DistributionType.LOTTERY && (
                    <TabsTrigger value="content" className="flex-1 sm:flex-none">追加内容</TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            )}
          </div>
        </DialogHeader>

        <div className="mx-6 h-px bg-black/6 dark:bg-white/[0.06]" />

        {updateSuccess ? (
          <div className="px-6">
            <div className="my-4">
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
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 w-full flex-1 flex-col"
          >
            <TabsContents
              className="min-h-0 flex-1 bg-background"
              transition={{duration: 0}}
            >
              <TabsContent
                value="basic"
                transition={{duration: 0}}
                className="min-h-0 flex-1"
              >
                <ScrollArea className={`${isMobile ? 'h-[58vh]' : 'h-[52vh]'}`}>
                  <div className="space-y-6 px-6 pt-3 pb-6">
                    <ProjectBasicForm
                      formData={formData}
                      onFormDataChange={setFormData}
                      tags={tags}
                      onTagsChange={setTags}
                      availableTags={availableTags}
                      isMobile={isMobile}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              {project.distribution_type !== DistributionType.LOTTERY && (
                <TabsContent
                  value="content"
                  transition={{duration: 0}}
                  className="min-h-0 flex-1"
                >
                  <ScrollArea className={`${isMobile ? 'h-[58vh]' : 'h-[52vh]'}`}>
                    <div className="space-y-6 px-6 pt-3 pb-6">
                      <BulkImportSection
                        items={newItems}
                        bulkContent={bulkContent}
                        setBulkContent={setBulkContent}
                        allowDuplicates={allowDuplicates}
                        setAllowDuplicates={setAllowDuplicates}
                        onBulkImport={handleBulkImport}
                        onRemoveItem={removeItem}
                        onClearItems={clearNewItems}
                        onClearBulkContent={() => setBulkContent('')}
                        fileUploadOpen={fileUploadOpen}
                        onFileUploadOpenChange={setFileUploadOpen}
                        onFileUpload={handleFileUpload}
                        isMobile={isMobile}
                        mode="edit"
                        totalExistingItems={project.total_items}
                        confirmationOpen={confirmationOpen}
                        onConfirmationOpenChange={setConfirmationOpen}
                        pendingFile={pendingFile}
                        onConfirmUpload={handleConfirmUpload}
                        onCancelUpload={handleCancelUpload}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>
              )}
            </TabsContents>
          </Tabs>
        )}

        <DialogFooter className="gap-2 -mt-4 px-4 py-4 sm:justify-end">
          {updateSuccess ? (
            <Button
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              size="sm"
              className="min-w-20"
            >
              关闭
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="sm"
              className="min-w-20"
            >
              {loading ? '更新中...' : '更新项目'}
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
