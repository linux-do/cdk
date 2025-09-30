'use client';

import {useEffect, useState} from 'react';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {TagSelector} from '@/components/ui/tag-selector';
import {DateTimePicker} from '@/components/ui/DateTimePicker';
import {Checkbox} from '@/components/animate-ui/radix/checkbox';
import MarkdownEditor from '@/components/common/markdown/Editor';
import {HelpCircle} from 'lucide-react';
import {FORM_LIMITS, TRUST_LEVEL_OPTIONS} from '@/components/common/project';
import {TrustLevel} from '@/lib/services/core/types';
import {ProjectFormData} from '@/hooks/use-project-form';

interface ProjectBasicFormProps {
  formData: ProjectFormData;
  onFormDataChange: (data: ProjectFormData) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
  isMobile: boolean;
}

export function ProjectBasicForm({
  formData,
  onFormDataChange,
  tags,
  onTagsChange,
  availableTags,
  isMobile,
}: ProjectBasicFormProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    onFormDataChange({...formData, [field]: value});
  };

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('project-risk-level-tooltip-seen');

    if (!hasSeenTooltip) {
      setShowTooltip(true);

      const timer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('project-risk-level-tooltip-seen', 'true');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">
          项目名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder={`请填写此项目的名称（${FORM_LIMITS.PROJECT_NAME_MAX_LENGTH}字符以内）`}
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
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
          onTagsChange={onTagsChange}
          placeholder="请选择或添加关联标签"
          isMobile={isMobile}
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <DateTimePicker
          label={
            <>
              开始时间 <span className="text-red-500">*</span>
            </>
          }
          value={formData.startTime}
          onChange={(date) => updateField('startTime', date || new Date())}
          placeholder="选择开始时间"
        />
        <DateTimePicker
          label={
            <>
              结束时间 <span className="text-red-500">*</span>
            </>
          }
          value={formData.endTime}
          onChange={(date) => updateField('endTime', date || new Date())}
          placeholder="选择结束时间"
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div className="space-y-2">
          <Label>最低信任等级</Label>
          <Select
            value={formData.minimumTrustLevel.toString()}
            onValueChange={(value) => updateField('minimumTrustLevel', parseInt(value) as TrustLevel)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRUST_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="riskLevel">最低用户分数</Label>
            <TooltipProvider>
              <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                <TooltipTrigger asChild>
                  <div className="cursor-help text-muted-foreground hover:text-foreground">
                    <HelpCircle size={14} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>注：此参数使用方法已更新 2025/07/22 <br /> 低于此分数的用户将无法查看、领取该项目的所有内容！</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="riskLevel"
            type="number"
            min={0}
            max={100}
            value={100 - formData.riskLevel}
            onChange={(e) => {
              const userInput = parseInt(e.target.value) || 0;
              const clampedInput = Math.max(0, Math.min(100, userInput));
              const riskLevel = 100 - clampedInput;
              updateField('riskLevel', riskLevel);
            }}
            placeholder="输入0-100的用户分数"
          />
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div className="space-y-2">
          <Label htmlFor="allowSameIP">允许相同 IP 领取</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="allowSameIP"
              checked={formData.allowSameIP}
              onCheckedChange={(checked) => updateField('allowSameIP', checked === true)}
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
            />
            <p className="text-muted-foreground text-sm">
              开启后，相同 IP 可重复领取此项目
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">项目描述</Label>
        <MarkdownEditor
          value={formData.description}
          onChange={(value) => updateField('description', value)}
          placeholder={`请输入项目描述，支持Markdown格式（${FORM_LIMITS.DESCRIPTION_MAX_LENGTH}字符以内）`}
          maxLength={FORM_LIMITS.DESCRIPTION_MAX_LENGTH}
          className="w-full"
        />
      </div>
    </>
  );
}
