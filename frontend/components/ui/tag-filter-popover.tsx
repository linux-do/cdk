'use client';

import {ReactNode} from 'react';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {Search, Check, X} from 'lucide-react';
import {cn} from '@/lib/utils';

interface TagFilterPopoverProps {
  trigger: ReactNode;
  tags: string[];
  selectedTags: string[];
  tagSearchKeyword: string;
  isOpen: boolean;
  align?: 'start' | 'center' | 'end';
  onTagToggle: (tag: string) => void;
  onTagSearchKeywordChange: (keyword: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function TagFilterPopover({
  trigger,
  tags,
  selectedTags,
  tagSearchKeyword,
  isOpen,
  align = 'end',
  onTagToggle,
  onTagSearchKeywordChange,
  onOpenChange,
}: TagFilterPopoverProps) {
  const filteredTags = (tags || []).filter((tag) =>
    tag.toLowerCase().includes(tagSearchKeyword.toLowerCase()),
  );

  const handleClearAllTags = () => {
    (selectedTags || []).forEach(onTagToggle);
  };

  const handleSelectAllTags = () => {
    filteredTags.forEach((tag) => {
      if (!(selectedTags || []).includes(tag)) {
        onTagToggle(tag);
      }
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align={align}>
        <div className="p-3 space-y-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">标签筛选</span>
              {(selectedTags || []).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleClearAllTags}
                >
                  清除全部
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="搜索标签..."
                value={tagSearchKeyword}
                onChange={(e) => onTagSearchKeywordChange(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto">
            {filteredTags.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs text-muted-foreground">
                    {`${filteredTags.length} 个标签${tagSearchKeyword ? '匹配' : ''}`}
                  </span>
                  {filteredTags.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary"
                      onClick={handleSelectAllTags}
                    >
                      全选
                    </Button>
                  )}
                </div>

                <div className="space-y-1 mt-1">
                  {filteredTags.map((tag) => {
                    const isSelected = (selectedTags || []).includes(tag);
                    return (
                      <div
                        key={tag}
                        className={cn(
                            'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted',
                            isSelected &&
                            'bg-primary/10 border border-primary/20',
                        )}
                        onClick={() => onTagToggle(tag)}
                      >
                        <span
                          className={cn(
                              'text-xs font-medium',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {tag}
                        </span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">
                  {tagSearchKeyword ? '未找到匹配的标签' : '暂无标签'}
                </p>
              </div>
            )}
          </div>

          {(selectedTags || []).length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">已选择的标签</span>
                <span className="text-xs text-muted-foreground">
                  {(selectedTags || []).length} 个标签
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(selectedTags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-2 py-0 h-6 bg-primary/5 text-xs text-primary border-primary/20 flex items-center gap-1 select-none cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagToggle(tag);
                    }}
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
