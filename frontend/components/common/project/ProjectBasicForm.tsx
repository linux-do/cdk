'use client';

import {useEffect, useState} from 'react';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {TagSelector} from '@/components/ui/tag-selector';
import {DateTimePicker} from '@/components/ui/DateTimePicker';
import MarkdownEditor from '@/components/common/markdown/Editor';
import {HelpCircle, Wallet} from 'lucide-react';
import {FORM_LIMITS, TRUST_LEVEL_OPTIONS} from '@/components/common/project';
import {TrustLevel} from '@/lib/services/core/types';
import {DistributionType} from '@/lib/services/project/types';
import {ProjectFormData} from '@/hooks/use-project-form';
import services from '@/lib/services';

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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogMessage, setPaymentDialogMessage] = useState('');
  const [paymentConfigChecked, setPaymentConfigChecked] = useState<boolean | null>(null);

  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    onFormDataChange({...formData, [field]: value});
  };

  const ensurePaymentConfig = async () => {
    const res = await services.payment.getConfigSafe();

    if (!res.success || !res.data) {
      setPaymentDialogMessage(res.error || '无法获取支付配置，请稍后重试。');
      setPaymentDialogOpen(true);
      setPaymentConfigChecked(false);
      return false;
    }

    if (!res.data.payment_enabled) {
      setPaymentDialogMessage('平台支付功能当前未启用，暂时无法设置领取消耗积分。');
      setPaymentDialogOpen(true);
      setPaymentConfigChecked(false);
      return false;
    }

    if (!res.data.has_config) {
      setPaymentDialogMessage('请先在支付设置中配置 Client ID 与 Client Secret，然后再设置领取消耗积分。');
      setPaymentDialogOpen(true);
      setPaymentConfigChecked(false);
      return false;
    }

    setPaymentConfigChecked(true);
    return true;
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

  useEffect(() => {
    if (formData.distributionType !== DistributionType.ONE_FOR_EACH) {
      setPaymentConfigChecked(null);
    }
  }, [formData.distributionType]);

  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs">
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
        <Label className="text-xs">项目标签</Label>
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
            <Label className="text-xs">
              开始时间 <span className="text-red-500">*</span>
            </Label>
          }
          value={formData.startTime}
          onChange={(date) => updateField('startTime', date || new Date())}
          placeholder="选择开始时间"
        />
        <DateTimePicker
          label={
            <Label className="text-xs">
              结束时间 <span className="text-red-500">*</span>
            </Label>
          }
          value={formData.endTime}
          onChange={(date) => updateField('endTime', date || new Date())}
          placeholder="选择结束时间"
        />
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div className="space-y-2">
          <Label className="text-xs">最低社区等级</Label>
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
            <Label className="text-xs">最低社区分数</Label>
            <TooltipProvider>
              <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                <TooltipTrigger asChild>
                  <div className="cursor-help text-muted-foreground hover:text-foreground">
                    <HelpCircle size={14} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>注：此功能已于 2025/07/22 更新  <br /> 低于此分数的用户无法领取项目内容！</p>
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
          <Label className="text-xs">限制相同 IP</Label>
          <Select
            value={formData.allowSameIP ? 'off' : 'on'}
            onValueChange={(value) => updateField('allowSameIP', value === 'off')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">开启</SelectItem>
              <SelectItem value="off">关闭</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs">领取消耗积分</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help text-muted-foreground hover:text-foreground">
                    <HelpCircle size={14} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>将在积分流转完成后发放 CDK，期间发生异常情况将自动退款。</p>
                  <p>仅「一码一用」分发模式支持设置积分金额，最多支持 2 位小数。</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="price"
            type="number"
            step={0.01}
            min={0}
            placeholder="0 表示免费"
            value={formData.price}
            onFocus={async () => {
              if (formData.distributionType !== DistributionType.ONE_FOR_EACH) return;
              if (paymentConfigChecked === true) return;
              await ensurePaymentConfig();
            }}
            onChange={async (e) => {
              const nextValue = e.target.value;
              const priceNum = Number(nextValue || '0');

              if (priceNum <= 0 || Number.isNaN(priceNum)) {
                updateField('price', nextValue);
                return;
              }

              if (formData.distributionType !== DistributionType.ONE_FOR_EACH) {
                return;
              }

              const paymentReady = paymentConfigChecked === true ? true : await ensurePaymentConfig();
              if (!paymentReady) {
                return;
              }

              updateField('price', nextValue);
            }}
            disabled={formData.distributionType !== DistributionType.ONE_FOR_EACH}
          />
          {formData.distributionType !== DistributionType.ONE_FOR_EACH && (
            <p className="text-muted-foreground text-xs">
              仅「一码一用」分发模式可设置积分金额
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">项目描述</Label>
        <MarkdownEditor
          value={formData.description}
          onChange={(value) => updateField('description', value)}
          placeholder={`请输入项目描述，支持Markdown格式（${FORM_LIMITS.DESCRIPTION_MAX_LENGTH}字符以内）`}
          maxLength={FORM_LIMITS.DESCRIPTION_MAX_LENGTH}
          className="w-full"
        />
      </div>

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-amber-500" />
              请先完成支付设置
            </AlertDialogTitle>
            <AlertDialogDescription>
              {paymentDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPaymentDialogOpen(false);
                window.dispatchEvent(new Event('linux-do-cdk:open-payment-settings'));
              }}
            >
              去设置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
