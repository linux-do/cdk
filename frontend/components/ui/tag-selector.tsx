'use client';

import * as React from 'react';
import {X, Check, PlusCircle, SearchIcon} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {useVirtualizer} from '@tanstack/react-virtual';

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
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > maxTagLength) {
      setSearchValue(value.slice(0, maxTagLength));
    } else {
      setSearchValue(value);
    }
  }, [maxTagLength]);

  /* 构建虚拟列表项 */
  const listItems = React.useMemo(() => {
    const items: Array<{
      type: 'tag' | 'create' | 'header' | 'empty';
      content: string;
      id: string;
    }> = [];

    // 过滤可用标签
    const filteredTags = availableTags
        .filter((tag) => !selectedTags.includes(tag))
        .filter((tag) => !searchValue || tag.toLowerCase().includes(searchValue.toLowerCase()));

    // 判断是否显示创建选项
    const shouldShowCreate = searchValue && searchValue.trim() &&
      !availableTags.some((tag) => tag.toLowerCase() === searchValue.toLowerCase());

    // 如果没有标签且没有搜索内容
    if (availableTags.length === 0 && !searchValue) {
      items.push({
        type: 'empty',
        content: emptyMessage,
        id: 'empty',
      });
      return items;
    }

    // 如果有搜索内容但没有匹配的标签
    if (searchValue && filteredTags.length === 0) {
      if (shouldShowCreate) {
        items.push({
          type: 'create',
          content: searchValue,
          id: `create-${searchValue}`,
        });
      } else {
        items.push({
          type: 'empty',
          content: '未找到匹配的标签',
          id: 'no-match',
        });
      }
      return items;
    }

    // 添加可用标签
    if (filteredTags.length > 0) {
      items.push({
        type: 'header',
        content: `可用标签 (${filteredTags.length})`,
        id: 'available-header',
      });

      filteredTags.forEach((tag) => {
        items.push({
          type: 'tag',
          content: tag,
          id: `tag-${tag}`,
        });
      });
    }

    // 添加创建选项
    if (shouldShowCreate && filteredTags.length > 0) {
      items.push({
        type: 'header',
        content: '创建新标签',
        id: 'create-header',
      });
      items.push({
        type: 'create',
        content: searchValue,
        id: `create-${searchValue}`,
      });
    }

    return items;
  }, [availableTags, selectedTags, searchValue, emptyMessage]);

  // 虚拟列表 @tanstack/react-virtual
  const virtualizer = useVirtualizer({
    count: listItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });

  // 当 Popover 打开时，重新计算虚拟列表
  React.useEffect(() => {
    if (isOpen) {
      // 延迟一帧确保 DOM 已渲染
      requestAnimationFrame(() => {
        virtualizer.measure();
      });
    }
  }, [isOpen, virtualizer]);

  const addTag = React.useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    if (trimmedTag === '无标签') {
      toast.error('不允许创建名为"无标签"的标签');
      return;
    }

    if (selectedTags.includes(trimmedTag)) {
      toast.error('该标签已添加');
      return;
    }

    if (selectedTags.length >= maxTags) {
      toast.error(`标签数量已达上限(${maxTags}个)`);
      return;
    }

    if (trimmedTag.length > maxTagLength) {
      const truncatedTag = trimmedTag.slice(0, maxTagLength);
      onTagsChange([...selectedTags, truncatedTag]);
    } else {
      onTagsChange([...selectedTags, trimmedTag]);
    }

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
                  placeholder={`搜索或创建标签(16字符以内)`}
                  value={searchValue}
                  onChange={handleInputChange}
                  maxLength={maxTagLength}
                />
              </div>

              <div
                ref={scrollElementRef}
                data-slot="tag-selector-scroll-area"
                className="h-[220px] overflow-auto overscroll-contain"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db transparent',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                }}
                onScroll={(e) => {
                  e.stopPropagation();
                }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const item = listItems[virtualItem.index];

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {item.type === 'empty' && (
                          <div className="flex flex-col items-center justify-center text-center text-sm px-2 h-full py-8">
                            <p>{item.content}</p>
                            {item.id === 'empty' && (
                              <p className="text-muted-foreground mt-1">输入内容创建新标签</p>
                            )}
                          </div>
                        )}

                        {item.type === 'header' && (
                          <div className="px-3 text-xs font-medium text-muted-foreground flex items-center h-full bg-muted/30">
                            {item.content}
                          </div>
                        )}

                        {item.type === 'create' && (
                          <div
                            className="flex items-center gap-2 rounded-sm px-3 text-sm cursor-pointer hover:bg-accent mx-1 h-full mt-2"
                            onClick={() => addTag(item.content)}
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span>创建 &quot;{item.content}&quot;</span>
                          </div>
                        )}

                        {item.type === 'tag' && (
                          <div
                            className="flex items-center justify-between rounded-sm px-3 text-sm cursor-pointer hover:bg-accent mx-1 h-full"
                            onClick={() => addTag(item.content)}
                          >
                            <span>{item.content}</span>
                            {selectedTags.includes(item.content) && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
