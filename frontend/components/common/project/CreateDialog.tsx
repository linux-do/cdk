'use client';

import {useState, useEffect} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {useProjectForm} from '@/hooks/use-project-form';
import {useProjectTags} from '@/hooks/use-project-tags';
import {useBulkImport} from '@/hooks/use-bulk-import';
import {useFileUpload} from '@/hooks/use-file-upload';
import {toast} from 'sonner';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Tabs, TabsList, TabsTrigger, TabsContent, TabsContents} from '@/components/animate-ui/radix/tabs';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/animate-ui/radix/dialog';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {validateProjectForm} from '@/components/common/project';
import {ProjectBasicForm} from '@/components/common/project/ProjectBasicForm';
import {BulkImportSection} from '@/components/common/project/BulkImportSection';
import {DistributionModeSelect} from '@/components/common/project/DistributionModeSelect';
import {Plus, Copy, ExternalLink, CheckCircle, HelpCircle} from 'lucide-react';
import services from '@/lib/services';
import {copyToClipboard} from '@/lib/utils';
import {DistributionType, ProjectListItem} from '@/lib/services/project/types';

interface ProjectInfo {
  id: string;
  name: string;
}

/**
 * 创建项目对话框组件
 */
export function CreateDialog({
  children,
  onProjectCreated,
}: {
  children?: React.ReactNode;
  onProjectCreated?: (project: ProjectListItem) => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<ProjectInfo | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const {formData, setFormData, resetForm: resetProjectForm} = useProjectForm({
    mode: 'create',
  });

  const {tags, setTags, availableTags, fetchTags, resetTags} = useProjectTags();

  const {
    items,
    setItems,
    bulkContent,
    setBulkContent,
    allowDuplicates,
    setAllowDuplicates,
    handleBulkImport,
    removeItem,
    resetBulkImport,
  } = useBulkImport();

  const {
    fileUploadOpen,
    setFileUploadOpen,
    handleFileUpload: handleFileUploadBase,
    confirmationOpen,
    setConfirmationOpen,
    pendingFile,
    handleConfirmUpload,
    handleCancelUpload,
  } = useFileUpload();


  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, fetchTags]);

  const resetForm = () => {
    resetProjectForm();
    resetTags();
    resetBulkImport();
    setActiveTab('basic');
    setCreateSuccess(false);
    setCreatedProject(null);
  };

  const handleFileUpload = (files: File[]) => {
    handleFileUploadBase(files, items, allowDuplicates, setItems);
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

    // 接龙申请模式暂时不可用
    if (formData.distributionType === DistributionType.INVITE) {
      toast.error('接龙申请功能正在开发中，暂时无法创建');
      setActiveTab('distribution');
      return false;
    }

    if (
      (formData.distributionType === DistributionType.ONE_FOR_EACH ||
       formData.distributionType === DistributionType.LOTTERY) &&
      items.length === 0
    ) {
      toast.error('至少需要添加一个分发内容');
      setActiveTab('distribution');
      return false;
    }

    if (formData.distributionType === DistributionType.LOTTERY && !formData.topicId) {
      toast.error('抽奖分发必须提供社区话题ID');
      setActiveTab('distribution');
      return false;
    }

    return true;
  };

  /**
   * 提交表单创建项目
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_tags: tags.length > 0 ? tags : undefined,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        minimum_trust_level: formData.minimumTrustLevel,
        allow_same_ip: formData.allowSameIP,
        risk_level: formData.riskLevel,
        distribution_type: formData.distributionType,
        topic_id: formData.topicId,
        project_items:
          formData.distributionType === DistributionType.ONE_FOR_EACH ?
            items :
            formData.distributionType === DistributionType.LOTTERY ?
            items :
            ['接龙申请模式'],
      };

      const result = await services.project.createProjectSafe(projectData);

      if (!result.success) {
        toast.error(result.error || '创建项目失败');
        return;
      }

      if (!result.data?.projectId) {
        toast.error('创建项目失败：未获取到项目ID');
        return;
      }

      const projectId = result.data.projectId;
      const newProject = {
        id: projectId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: tags,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        minimum_trust_level: formData.minimumTrustLevel,
        allow_same_ip: formData.allowSameIP,
        risk_level: formData.riskLevel,
        distribution_type: formData.distributionType,
        total_items: items.length,
        created_at: new Date().toISOString(),
      };

      setCreateSuccess(true);
      setCreatedProject({id: projectId, name: formData.name.trim()});
      toast.success('项目创建成功！');

      onProjectCreated?.(newProject);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建项目失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getReceiveLink = (projectId: string): string => {
    const baseUrl =
      process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || window.location.origin;
    return `${baseUrl}/receive/${projectId}`;
  };

  const openLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建项目
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-3xl max-h-[90vh]'} overflow-hidden`}
      >
        <DialogHeader className={isMobile ? 'text-left' : ''}>
          <DialogTitle className={isMobile ? 'text-left' : ''}>
            {createSuccess ? '项目创建成功' : '创建新项目'}
          </DialogTitle>
          <DialogDescription>
            {createSuccess ?
              '项目已准备就绪，可以开始分发啦' :
              '创建一个新的项目来管理和分发您的内容'}
          </DialogDescription>
        </DialogHeader>

        {createSuccess && createdProject ? (
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} flex-shrink-0`} />
                <div className="flex flex-col text-left">
                  <h3 className="text-lg font-semibold">{createdProject.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    您可以复制下方链接，分享您分发的内容
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <Label className="text-sm font-medium">项目领取链接</Label>
              </div>

              <div className="flex gap-2">
                <Input
                  value={getReceiveLink(createdProject.id)}
                  readOnly
                  className="bg-gray-100 border-none text-sm h-8 flex-1"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await copyToClipboard(getReceiveLink(createdProject.id));
                      toast.success('链接已复制到剪贴板');
                    } catch {
                      toast.error('复制失败，请手动复制');
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openLink(getReceiveLink(createdProject.id))}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
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
              <TabsTrigger value="distribution">分发内容</TabsTrigger>
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

              <TabsContent
                value="distribution"
                className={`space-y-6 py-6 ${isMobile ? 'max-h-[65vh]' : 'max-h-[60vh]'} overflow-y-auto`}
              >
                <DistributionModeSelect
                  distributionType={formData.distributionType}
                  onDistributionTypeChange={(type: DistributionType) =>
                    setFormData({...formData, distributionType: type})
                  }
                />

                {formData.distributionType === DistributionType.LOTTERY && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="topicId">
                        Linux Do 话题 ID <span className="text-red-500">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>可以直接粘贴话题链接，系统会自动提取ID</p>
                            <p>需要添加&ldquo;抽奖&rdquo;标签且抽奖已结束的话题</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="topicId"
                      type="text"
                      placeholder="填写社区抽奖话题的 ID 或粘贴话题链接"
                      value={formData.topicId?.toString() || ''}
                      onChange={(e) => {
                        let value = e.target.value.trim();

                        const urlMatch = value.match(/linux\.do\/t(?:\/topic)?\/(\d+)(?:[\/\?\#]|$)/i);
                        if (urlMatch) {
                          value = urlMatch[1];
                        }

                        const numValue = value ? parseInt(value) : NaN;
                        setFormData({...formData, topicId: (!isNaN(numValue) && numValue > 0) ? numValue : undefined});
                      }}
                    />
                  </div>
                )}

                {(formData.distributionType === DistributionType.ONE_FOR_EACH ||
                  formData.distributionType === DistributionType.LOTTERY) ? (
                  <BulkImportSection
                    items={items}
                    bulkContent={bulkContent}
                    setBulkContent={setBulkContent}
                    allowDuplicates={allowDuplicates}
                    setAllowDuplicates={setAllowDuplicates}
                    onBulkImport={handleBulkImport}
                    onRemoveItem={removeItem}
                    onClearItems={() => setItems([])}
                    onClearBulkContent={() => setBulkContent('')}
                    fileUploadOpen={fileUploadOpen}
                    onFileUploadOpenChange={setFileUploadOpen}
                    onFileUpload={handleFileUpload}
                    isMobile={isMobile}
                    mode="create"
                    confirmationOpen={confirmationOpen}
                    onConfirmationOpenChange={setConfirmationOpen}
                    pendingFile={pendingFile}
                    onConfirmUpload={handleConfirmUpload}
                    onCancelUpload={handleCancelUpload}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="text-lg font-medium text-muted-foreground mb-2">
                        敬请期待
                      </div>
                      <p className="text-sm text-muted-foreground">
                        接龙申请功能正在开发中
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
              disabled={loading || formData.distributionType === DistributionType.INVITE}
              className="w-full"
            >
              {loading ? '创建中...' :
               formData.distributionType === DistributionType.INVITE ? '开发中' :
               formData.distributionType === DistributionType.LOTTERY ? '创建抽奖分发' :
               '创建'}
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
