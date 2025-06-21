'use client';

import {useState, useRef, useCallback, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import ContentRender from './ContentRender';
import {useIsMobile} from '@/hooks/use-mobile';
import {Bold, Italic, Link, Image, List, ListOrdered, Quote, Code, Code2, Heading1, Heading2, Heading3, Table, Minus, Eye, Edit3, MoreHorizontal} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
}

/**
 * Markdown编辑器组件
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = '请输入内容，支持Markdown格式',
  className = '',
  maxLength,
  disabled = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [displayLineCount, setDisplayLineCount] = useState(1);
  const [lineMapping, setLineMapping] = useState<Array<{ logicalLine: number; isFirstLineOfLogicalLine: boolean }>>([]);

  const lines = value.split('\n');
  const calculateLineMapping = useCallback(() => {
    if (!textareaRef.current || lines.length === 0) {
      return [{logicalLine: 1, isFirstLineOfLogicalLine: true}];
    }

    const textarea = textareaRef.current;
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight) || 24;
    const textWidth = textarea.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);

    const lineMapping: Array<{ logicalLine: number; isFirstLineOfLogicalLine: boolean }> = [];

    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      height: auto;
      width: ${textWidth}px;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      word-wrap: break-word;
      overflow-wrap: anywhere;
      word-break: break-all;
      white-space: pre-wrap;
      border: none;
      padding: 0;
      margin: 0;
    `;
    document.body.appendChild(measureDiv);

    lines.forEach((line, index) => {
      measureDiv.textContent = line || ' ';

      const contentHeight = measureDiv.scrollHeight;
      const displayLinesForThisLogicalLine = Math.max(1, Math.ceil(contentHeight / lineHeight));

      for (let i = 0; i < displayLinesForThisLogicalLine; i++) {
        lineMapping.push({
          logicalLine: index + 1,
          isFirstLineOfLogicalLine: i === 0,
        });
      }
    });

    document.body.removeChild(measureDiv);
    return lineMapping;
  }, [lines]);

  const getLineNumberWidth = () => {
    const maxLineNumber = Math.max(displayLineCount, 15);
    const digits = maxLineNumber.toString().length;
    if (isMobile) {
      return digits <= 2 ? 'w-8' : 'w-10';
    } else {
      return digits <= 2 ? 'w-10' : digits <= 3 ? 'w-12' : 'w-14';
    }
  };

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      requestAnimationFrame(() => {
        if (textareaRef.current && lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
      });
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);

    setTimeout(() => {
      const newLineMapping = calculateLineMapping();
      setLineMapping(newLineMapping);
      setDisplayLineCount(newLineMapping.length);
    }, 0);
  }, [onChange, calculateLineMapping]);

  useEffect(() => {
    const updateDisplayLines = () => {
      const newLineMapping = calculateLineMapping();
      setLineMapping(newLineMapping);
      setDisplayLineCount(newLineMapping.length);
    };

    if (textareaRef.current) {
      setTimeout(updateDisplayLines, 0);

      const resizeObserver = new ResizeObserver(() => {
        setTimeout(updateDisplayLines, 0);
      });

      resizeObserver.observe(textareaRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [calculateLineMapping]);

  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      const syncStyles = () => {
        if (textareaRef.current && lineNumbersRef.current) {
          const textareaStyle = window.getComputedStyle(textareaRef.current);
          lineNumbersRef.current.style.lineHeight = textareaStyle.lineHeight;
          lineNumbersRef.current.style.fontSize = textareaStyle.fontSize;
          lineNumbersRef.current.style.fontFamily = textareaStyle.fontFamily;
        }
      };

      setTimeout(syncStyles, 0);
    }
  }, [value, displayLineCount]);

  /**
   * 在光标位置插入文本
   */
  const insertText = useCallback((beforeText: string, afterText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newValue =
      value.substring(0, start) +
      beforeText +
      selectedText +
      afterText +
      value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + beforeText.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  /**
   * 在行首插入文本（用于标题、列表等）
   */
  const insertLineText = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;

    const currentLine = value.substring(lineStart, actualLineEnd);

    if (currentLine.startsWith(prefix)) {
      const newLine = currentLine.substring(prefix.length);
      const newValue =
        value.substring(0, lineStart) +
        newLine +
        value.substring(actualLineEnd);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start - prefix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      const newValue =
        value.substring(0, lineStart) +
        prefix +
        currentLine +
        value.substring(actualLineEnd);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + prefix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }, [value, onChange]);

  /**
   * 工具栏按钮配置
   */
  const toolbarButtons = [
    {
      icon: Bold,
      tooltip: '粗体',
      action: () => insertText('**', '**'),
      priority: 1,
    },
    {
      icon: Italic,
      tooltip: '斜体',
      action: () => insertText('*', '*'),
      priority: 1,
    },
    {
      icon: Code,
      tooltip: '行内代码',
      action: () => insertText('`', '`'),
      priority: 2,
    },
    {
      icon: Code2,
      tooltip: '代码块',
      action: () => insertText('\n```javascript\n', '\n```\n'),
      priority: 1,
    },
    {
      icon: Heading1,
      tooltip: '一级标题',
      action: () => insertLineText('# '),
      priority: 2,
    },
    {
      icon: Heading2,
      tooltip: '二级标题',
      action: () => insertLineText('## '),
      priority: 1,
    },
    {
      icon: Heading3,
      tooltip: '三级标题',
      action: () => insertLineText('### '),
      priority: 3,
    },
    {
      icon: List,
      tooltip: '无序列表',
      action: () => insertLineText('- '),
      priority: 1,
    },
    {
      icon: ListOrdered,
      tooltip: '有序列表',
      action: () => insertLineText('1. '),
      priority: 2,
    },
    {
      icon: Quote,
      tooltip: '引用',
      action: () => insertLineText('> '),
      priority: 2,
    },
    {
      icon: Link,
      tooltip: '链接',
      action: () => insertText('[链接文字](', ')'),
      priority: 1,
    },
    {
      icon: Image,
      tooltip: '图片',
      action: () => insertText('![图片描述](', ')'),
      priority: 2,
    },
    {
      icon: Table,
      tooltip: '表格',
      action: () => insertText('\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容1 | 内容2 | 内容3 |\n| 内容4 | 内容5 | 内容6 |\n'),
      priority: 3,
    },
    {
      icon: Minus,
      tooltip: '分割线',
      action: () => insertText('\n---\n'),
      priority: 3,
    },
  ];

  const getPrimaryButtons = () => {
    if (isMobile) {
      return toolbarButtons.filter((btn) => btn.priority === 1);
    } else {
      return toolbarButtons.filter((btn) => btn.priority <= 2);
    }
  };

  const getSecondaryButtons = () => {
    const primaryButtons = getPrimaryButtons();
    return toolbarButtons.filter((btn) => !primaryButtons.includes(btn));
  };

  const primaryButtons = getPrimaryButtons();
  const secondaryButtons = getSecondaryButtons();

  return (
    <div className={`border rounded-lg overflow-hidden w-full ${className}`}>
      {/* 工具栏 */}
      <div className="border-b bg-gray-50 dark:bg-gray-900 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1 overflow-hidden">
            <TooltipProvider>
              {/* 主要按钮 */}
              {primaryButtons.map((button, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={button.action}
                      disabled={disabled}
                    >
                      <button.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{button.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* 更多按钮下拉菜单 */}
              {secondaryButtons.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      disabled={disabled}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {secondaryButtons.map((button, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={button.action}
                        className="flex items-center gap-2 text-sm"
                      >
                        <button.icon className="h-4 w-4" />
                        {button.tooltip}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TooltipProvider>
          </div>

          {/* 模式切换 */}
          <div className="flex-shrink-0 ml-2">
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'edit' | 'preview')}>
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs px-2 py-1">
                  <Edit3 className="h-3 w-3 md:mr-1" />
                  <span className="hidden md:inline">编辑</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs px-2 py-1">
                  <Eye className="h-3 w-3 md:mr-1" />
                  <span className="hidden md:inline">预览</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="relative">
        {mode === 'edit' ? (
          <div className="relative flex">
            {/* 行号区域 */}
            <div
              ref={lineNumbersRef}
              className={`flex-shrink-0 ${getLineNumberWidth()} bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden text-right ${isMobile ? 'pr-1' : 'pr-2'} font-mono text-muted-foreground select-none`}
              style={{
                overflowY: 'hidden',
                minHeight: '300px',
                lineHeight: '1.5rem',
                paddingTop: '12px',
                paddingBottom: '12px',
                fontSize: '0.875rem',
              }}
            >
              {lineMapping.length > 0 ? lineMapping.map((mapping, i) => (
                <div
                  key={`line-${i}`}
                  className="tabular-nums"
                  style={{
                    height: '1.5rem',
                    lineHeight: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {mapping.isFirstLineOfLogicalLine ? (
                    <span className="text-muted-foreground">{mapping.logicalLine}</span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 opacity-50 select-none">│</span>
                  )}
                </div>
              )) : Array.from({length: Math.max(displayLineCount, 1)}, (_, i) => (
                <div
                  key={i + 1}
                  className="tabular-nums"
                  style={{
                    height: '1.5rem',
                    lineHeight: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {i + 1}
                </div>
              ))}
              {/* 填充空行以保持最小高度 */}
              {displayLineCount < 15 && Array.from({length: 15 - displayLineCount}, (_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    height: '1.5rem',
                    lineHeight: '1.5rem',
                  }}
                />
              ))}
            </div>

            {/* 文本编辑区域 */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputChange}
                onScroll={handleScroll}
                placeholder={placeholder}
                className={`resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none min-h-[300px] font-mono text-sm ${isMobile ? 'pl-2' : 'pl-3'} whitespace-pre-wrap break-all`}
                maxLength={maxLength}
                disabled={disabled}
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5rem',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                }}
              />
              {maxLength && (
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {value.length}/{maxLength}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="min-h-[300px] p-4 bg-background overflow-auto break-all"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'anywhere',
              wordBreak: 'break-all',
            }}
          >
            <ContentRender
              content={value || '暂无内容'}
              className="prose prose-sm max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;
