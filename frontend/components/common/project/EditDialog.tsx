'use client';

import {useState, useEffect, useCallback} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {useProjectForm} from '@/hooks/use-project-form';
import {useProjectTags} from '@/hooks/use-project-tags';
import {useBulkImport} from '@/hooks/use-bulk-import';
import {useFileUpload} from '@/hooks/use-file-upload';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Tabs, TabsList, TabsTrigger, TabsContent, TabsContents} from '@/components/animate-ui/radix/tabs';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/animate-ui/radix/dialog';
import {validateProjectForm} from '@/components/common/project';
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

    return true;
  };

  /**
   * 提交表单更新项目
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData: UpdateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_tags: tags.length > 0 ? tags : undefined,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        minimum_trust_level: formData.minimumTrustLevel,
        allow_same_ip: formData.allowSameIP,
        risk_level: formData.riskLevel,
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
            <TabsList className={`grid w-full ${project.distribution_type === DistributionType.LOTTERY ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <TabsTrigger value="basic">基本设置</TabsTrigger>
              {project.distribution_type !== DistributionType.LOTTERY && (
                <TabsTrigger value="content">追加内容</TabsTrigger>
              )}
            </TabsList>

            <TabsContents className="mb-1 -mt-2 rounded-sm h-full bg-background">
              <TabsContent
                value="basic"
                className={`space-y-6 py-6 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}
              >
                <ProjectBasicForm
                  formData={formData}
                  onFormDataChange={setFormData}
                  tags={tags}
                  onTagsChange={setTags}
                  availableTags={availableTags}
                  isMobile={isMobile}
                />
              </TabsContent>

              {project.distribution_type !== DistributionType.LOTTERY && (
                <TabsContent
                  value="content"
                  className={`space-y-6 py-6 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}
                >
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
                </TabsContent>
              )}
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

      </DialogContent>
    </Dialog>
  );
}
