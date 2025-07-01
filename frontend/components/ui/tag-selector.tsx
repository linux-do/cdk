'use client';

import * as React from 'react';
import {X, Check, PlusCircle, SearchIcon} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {ScrollArea} from '@/components/ui/scroll-area';
import {toast} from 'sonner';
import {cn} from '@/lib/utils';

interface TagSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedTags: string[];
  availableTags: string[];
  maxTagLength?: number;
  maxTags?: number;
  placeholder?: string;
  emptyMessage?: string;
  onTagsChange: (tags: string[]) => void;
  isMobile?: boolean;
}

function TagSelector({
  selectedTags,
  availableTags,
  maxTagLength = 16,
  maxTags = 10,
  placeholder = '选择或创建标签',
  emptyMessage = '暂无可用标签',
  onTagsChange,
  isMobile = false,
  className,
  ...props
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  // 判断是否显示创建选项
  const shouldShowCreate = React.useMemo(() => {
    return searchValue && searchValue.trim() &&
      !availableTags.some((tag) => tag.toLowerCase() === searchValue.toLowerCase());
  }, [searchValue, availableTags]);

  // 获取过滤后的可用标签
  const filteredTags = React.useMemo(() => {
    return availableTags
        .filter((tag) => !selectedTags.includes(tag))
        .filter((tag) => !searchValue || tag.toLowerCase().includes(searchValue.toLowerCase()));
  }, [availableTags, selectedTags, searchValue]);

  const addTag = React.useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    if (selectedTags.includes(trimmedTag)) {
      toast.error('该标签已添加');
      return;
    }

    if (selectedTags.length >= maxTags) {
      toast.error(`标签数量已达上限(${maxTags}个)`);
      return;
    }

    if (trimmedTag.length > maxTagLength) {
      toast.error(`标签长度不能超过${maxTagLength}个字符`);
      return;
    }

    onTagsChange([...selectedTags, trimmedTag]);
    setSearchValue('');
    setIsOpen(false);
  }, [selectedTags, maxTags, maxTagLength, onTagsChange]);

  const removeTag = React.useCallback((tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  }, [selectedTags, onTagsChange]);

  return (
    <div
      data-slot="tag-selector"
      className={cn('space-y-2', className)}
      {...props}
    >
      <div className={cn(isMobile ? '' : 'flex items-center gap-2')}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              data-slot="tag-selector-trigger"
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className={cn(
                isMobile ? 'w-full mb-2' : 'flex-1',
                'justify-between text-sm text-muted-foreground font-normal',
              )}
              onClick={() => setIsOpen(true)}
            >
              <span className="truncate">
                {searchValue ? searchValue : `${placeholder}（${selectedTags.length}/${maxTags}）`}
              </span>
              <PlusCircle className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            data-slot="tag-selector-content"
            className="w-[300px] p-0"
            align="start"
          >
            <div className="flex flex-col">
              <div
                data-slot="tag-selector-search"
                className="flex items-center gap-2 border-b p-3"
              >
                <SearchIcon className="h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                  placeholder="搜索或创建标签..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              <ScrollArea
                data-slot="tag-selector-scroll-area"
                className="h-[220px]"
              >
                <div
                  data-slot="tag-selector-list"
                  className="p-1"
                >
                  {(availableTags.length === 0 || filteredTags.length === 0) && (
                    <div className="p-2">
                      {searchValue ? (
                        <div
                          data-slot="tag-selector-create"
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                          onClick={() => addTag(searchValue)}
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>创建 &quot;{searchValue}&quot;</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 h-full text-center text-sm">
                          <p>{emptyMessage}</p>
                          <p className="text-muted-foreground">输入内容创建新标签</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 显示可用标签 */}
                  {filteredTags.length > 0 && (
                    <div
                      data-slot="tag-selector-available"
                      className="p-1"
                    >
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        可用标签
                      </div>
                      {filteredTags.map((tag) => (
                        <div
                          key={tag}
                          data-slot="tag-selector-item"
                          className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                          onClick={() => addTag(tag)}
                        >
                          {tag}
                          {selectedTags.includes(tag) && <Check className="h-4 w-4 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 有搜索内容且搜索内容不在可用标签中，显示创建选项 */}
                  {shouldShowCreate && filteredTags.length > 0 && (
                    <>
                      <div className="h-px bg-border mx-1 my-1" />
                      <div
                        data-slot="tag-selector-create-section"
                        className="p-1"
                      >
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          创建新标签
                        </div>
                        <div
                          data-slot="tag-selector-create-item"
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                          onClick={() => addTag(searchValue)}
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>创建 &quot;{searchValue}&quot;</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTags.length > 0 && (
        <div
          data-slot="tag-selector-selected"
          className="flex flex-wrap gap-2 mt-2"
        >
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export {TagSelector};
