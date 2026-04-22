'use client';

import {Button} from '@/components/ui/button';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {MotionEffect} from '@/components/animate-ui/effects/motion-effect';
import {CURRENCY_LABEL, DISTRIBUTION_MODE_NAMES} from '@/components/common/project';
import {BadgeCheck, Boxes, Coins, Gauge, Pencil, ShieldCheck, Trash2, Waypoints} from 'lucide-react';
import {formatDateTimeWithSeconds} from '@/lib/utils';
import {ProjectListItem} from '@/lib/services/project/types';

const TRUST_LEVEL_SHORT_LABELS: Partial<Record<number, string>> = {
  1: 'TL1',
  2: 'TL2',
  3: 'TL3',
  4: 'TL4',
};

const trimTrailingZeros = (value: string): string => value.replace(/\.0+$|(\.\d*?[1-9])0+$/, '$1');

const formatCompactPrice = (price: number): {display: string; full: string; compacted: boolean} => {
  const full = `${price.toFixed(2)} ${CURRENCY_LABEL}`;
  const formatter = new Intl.NumberFormat('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2});
  const numberOnly = trimTrailingZeros(formatter.format(price));
  return {display: numberOnly, full, compacted: true};
};

interface ProjectCardProps {
  project: ProjectListItem;
  onClick?: (project: ProjectListItem) => void;
  onEdit?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
  delay?: number;
  editButton?: React.ReactNode;
}

export function ProjectCard({
  project,
  onClick,
  onEdit,
  onDelete,
  delay = 0,
  editButton,
}: ProjectCardProps) {
  const priceNum = Number(project.price || '0');
  const priceDisplay = formatCompactPrice(priceNum);

  const now = new Date();
  const startTime = new Date(project.start_time);
  const endTime = new Date(project.end_time);
  const isActive = now >= startTime && now <= endTime;
  const isUpcoming = now < startTime;

  const statusLabel = isUpcoming ? '即将开始' : isActive ? '进行中' : '已结束';
  const statusIconClassName = isUpcoming ?
    'text-blue-500 dark:text-blue-400' :
    isActive ?
      'text-emerald-500 dark:text-emerald-400' :
      'text-gray-400 dark:text-gray-500';

  const visibleTags = (project.tags || []).slice(0, 3);
  const hiddenTagCount = Math.max(0, (project.tags?.length || 0) - visibleTags.length);
  const itemText = `${project.total_items}`;
  const modeText = DISTRIBUTION_MODE_NAMES[project.distribution_type];
  const description = project.description?.trim();
  const trustText = TRUST_LEVEL_SHORT_LABELS[project.minimum_trust_level];
  const riskText = `${String(project.risk_level).padStart(2, '0')}`;
  const showRisk = project.risk_level > 0;
  const showPrice = priceNum > 0;
  const showIpLimit = !project.allow_same_ip;
  const showTrustLevel = Boolean(trustText);

  return (
    <TooltipProvider>
      <MotionEffect
        slide={{direction: 'down'}}
        fade
        zoom
        inView
        delay={delay}
        className="w-full"
      >
        <div
          className="group flex h-full cursor-pointer flex-col rounded-[22px] bg-muted p-3.5 transition-colors duration-200 hover:bg-muted/80 sm:p-4"
          onClick={() => onClick?.(project)}
        >
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 text-foreground sm:text-[16px]">
                {project.name}
              </h3>

              {(onEdit || onDelete || editButton) && (
                <div
                  className="flex shrink-0 gap-1 opacity-70 transition-opacity duration-200 group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {editButton ||
                    (onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-[22px] rounded-full p-0 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 sm:size-6"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEdit(project);
                        }}
                      >
                        <Pencil className="size-[11px] sm:size-[13px]" />
                      </Button>
                    ))}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-[22px] rounded-full p-0 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/12 dark:hover:text-red-300 sm:size-6"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(project);
                      }}
                    >
                      <Trash2 className="size-[11px] sm:size-[13px]" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <p className="mt-1.5 line-clamp-2 min-h-[36px] text-[11px] leading-5 text-muted-foreground sm:min-h-[40px] sm:text-[12px]">
              {description || '暂无描述'}
            </p>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 sm:gap-x-4">
              <div className="min-w-0 self-end">
                <div className="flex max-h-11 flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden text-[10px] leading-5 text-muted-foreground sm:gap-x-3 sm:text-[11px]">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium leading-4 text-muted-foreground/90 dark:bg-white/[0.06]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {hiddenTagCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium leading-4 text-muted-foreground/80 dark:bg-white/[0.06]">
                      +{hiddenTagCount}
                    </span>
                  )}
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                    <Boxes className="h-3.5 w-3.5 text-foreground/50" />
                    {itemText}
                  </span>
                  {showRisk && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                      <Gauge className="h-3.5 w-3.5 text-foreground/50" />
                      {riskText}
                    </span>
                  )}
                  {showPrice && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                          <Coins className="h-3.5 w-3.5 text-foreground/50" />
                          {priceDisplay.display}
                        </span>
                      </TooltipTrigger>
                      {priceDisplay.compacted && (
                        <TooltipContent side="top">
                          <p>{priceDisplay.full}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                  {showTrustLevel && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                      <BadgeCheck className="h-3.5 w-3.5 text-foreground/50" />
                      {trustText}
                    </span>
                  )}
                  {showIpLimit && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                      <Waypoints className="h-3.5 w-3.5 text-foreground/50" />
                      限制 IP
                    </span>
                  )}
                </div>
              </div>

              <div className="flex min-h-11 shrink-0 flex-col items-end justify-between gap-1 text-right">
                <div className="text-[10px] font-medium leading-5 text-foreground/85 sm:text-[11px]">
                  {modeText}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                      <ShieldCheck className={`h-3.5 w-3.5 ${statusIconClassName}`} />
                      <span>{statusLabel}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end">
                    <p>开始: {formatDateTimeWithSeconds(project.start_time)}</p>
                    <p>结束: {formatDateTimeWithSeconds(project.end_time)}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </MotionEffect>
    </TooltipProvider>
  );
}
