'use client';

import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {MotionEffect} from '@/components/animate-ui/effects/motion-effect';
import {DISTRIBUTION_MODE_NAMES, TRUST_LEVEL_CONFIG, getTrustLevelGradient} from '@/components/common/project';
import {Shield, Clock, Package, Trash2, Calendar, Pencil} from 'lucide-react';
import {formatDate, formatDateTimeWithSeconds} from '@/lib/utils';
import {ProjectListItem} from '@/lib/services/project/types';


/** 项目卡片组件属性接口 */
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
  const gradientTheme = getTrustLevelGradient(project.minimum_trust_level);

  const now = new Date();
  const startTime = new Date(project.start_time);
  const endTime = new Date(project.end_time);
  const isActive = now >= startTime && now <= endTime;
  const isUpcoming = now < startTime;
  const isExpired = now > endTime;

  return (
    <TooltipProvider>
      <MotionEffect
        slide={{direction: 'down'}}
        fade
        zoom
        inView
        delay={delay}
        className="w-full max-w-sm mx-auto"
      >
        <div className="space-y-3">
          <div
            className={`${gradientTheme} p-6 rounded-2xl group hover:rounded-none transition-all duration-300 text-white relative overflow-hidden hover:shadow-lg hover:scale-[1.05] transform cursor-pointer border-0`}
            onClick={() => onClick?.(project)}
          >
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white drop-shadow-md" />
                    {isUpcoming && (
                      <span className="text-[8px] sm:text-[10px] text-white font-medium">
                        即将开始
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[8px] sm:text-[10px] text-white font-medium">
                        进行中
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-[8px] sm:text-[10px] text-white font-medium">
                        已结束
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>开始: {formatDateTimeWithSeconds(project.start_time)}</p>
                  <p>结束: {formatDateTimeWithSeconds(project.end_time)}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white drop-shadow-md" />
                    <span className="text-[8px] sm:text-[10px] text-white font-medium">
                      T{project.minimum_trust_level}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    最低等级:{' '}
                    {TRUST_LEVEL_CONFIG[project.minimum_trust_level]?.name ||
                      TRUST_LEVEL_CONFIG[0].name}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {(onEdit || onDelete || editButton) && (
              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editButton ||
                  (onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-white/20 hover:bg-white/30 text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(project);
                      }}
                    >
                      <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  ))}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-white/20 hover:bg-red-500/80 text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(project);
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-center h-32">
              <h3 className="text-2xl font-bold text-white text-center leading-tight line-clamp-2">
                {project.name}
              </h3>

              <div className="absolute bottom-3 right-3 text-xs text-white">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-white drop-shadow-md" />
                      <span className="text-sm">
                        {project.total_items}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>分发总数: {project.total_items}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 flex-1 min-w-0">
                {project.name}
              </h4>
              <Badge variant="secondary" className="text-[9px] flex-shrink-0">
                {DISTRIBUTION_MODE_NAMES[project.distribution_type]}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {project.tags && project.tags.length > 0 ? (
                  <>
                    {project.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 2 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 cursor-default hover:bg-secondary/80 transition-colors"
                          >
                            +{project.tags.length - 2}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-3 max-w-xs">
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              更多标签 ({project.tags.length - 2}个)
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {project.tags.slice(2).map((tag, index) => (
                                <div
                                  key={index}
                                  className="bg-secondary/60 text-secondary-foreground px-2 py-1 rounded text-[10px] text-center truncate"
                                  title={tag}
                                >
                                  {tag}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-[9px] -ml-1 sm:text-[10px] py-0.5"
                  >
                    无标签
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                  {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </MotionEffect>
    </TooltipProvider>
  );
}
