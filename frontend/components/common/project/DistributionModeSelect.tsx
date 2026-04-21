'use client';

import {Label} from '@/components/ui/label';
import {Lock, Trophy, User} from 'lucide-react';
import {DistributionType} from '@/lib/services/project/types';
import {cn} from '@/lib/utils';

interface DistributionModeSelectProps {
  distributionType: DistributionType;
  onDistributionTypeChange: (type: DistributionType) => void;
}

const DISTRIBUTION_OPTIONS = [
  {
    type: DistributionType.ONE_FOR_EACH,
    title: '一码一用',
    description: '每人领取独有内容',
    icon: User,
  },
  {
    type: DistributionType.LOTTERY,
    title: '抽奖分发',
    description: '根据抽奖结果发放',
    icon: Trophy,
  },
  {
    type: DistributionType.INVITE,
    title: '接龙申请',
    description: '敬请期待',
    icon: Lock,
  },
] as const;

export function DistributionModeSelect({
  distributionType,
  onDistributionTypeChange,
}: DistributionModeSelectProps) {
  return (
    <div className="space-y-2.5">
      <Label>分发模式</Label>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {DISTRIBUTION_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = distributionType === option.type;
          const isPending = option.type === DistributionType.INVITE;

          return (
            <button
              key={option.type}
              type="button"
              aria-pressed={isActive}
              onClick={() => onDistributionTypeChange(option.type)}
              className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border-none px-3.5 py-3 text-left shadow-none',
                  'bg-muted/45 dark:bg-white/[0.04]',
                  isActive && 'bg-muted/80 dark:bg-white/[0.08]',
                  isPending && !isActive && 'text-muted-foreground/80',
              )}
            >
              <div
                className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                    'bg-background/80 text-muted-foreground dark:bg-white/[0.06]',
                    isActive && 'bg-white text-foreground dark:bg-white/[0.12]',
                )}
              >
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-foreground/90')}>
                    {option.title}
                  </span>
                  <span
                    className={cn(
                        'text-[11px]',
                        isActive ? 'text-foreground/55' : 'text-muted-foreground',
                    )}
                  >
                    {isPending ? '开发中' : isActive ? '已选中' : '选择'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
