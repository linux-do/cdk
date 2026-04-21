'use client';

import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';
import {FileUpload} from '@/components/ui/file-upload';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '@/components/animate-ui/radix/dialog';
import {X, Filter} from 'lucide-react';

interface BulkImportSectionProps {
  items: string[];
  bulkContent: string;
  setBulkContent: (content: string) => void;
  allowDuplicates: boolean;
  setAllowDuplicates: (allow: boolean) => void;
  onBulkImport: () => void;
  onRemoveItem: (index: number) => void;
  onClearItems: () => void;
  onClearBulkContent: () => void;
  fileUploadOpen: boolean;
  onFileUploadOpenChange: (open: boolean) => void;
  onFileUpload: (files: File[]) => void;
  isMobile: boolean;
  mode?: 'create' | 'edit';
  totalExistingItems?: number;
  // 新增确认对话框相关props
  confirmationOpen: boolean;
  onConfirmationOpenChange: (open: boolean) => void;
  pendingFile: {
    file: File;
    content: string;
    analysis: {
      isBinary: boolean;
      hasNonAscii: boolean;
      hasNonUnicode: boolean;
    };
    currentItems: string[];
    allowDuplicates: boolean;
    onSuccess: (newItems: string[], importedCount: number, skippedInfo?: string) => void;
  } | null;
  onConfirmUpload: () => void;
  onCancelUpload: () => void;
}

export function BulkImportSection({
  items,
  bulkContent,
  setBulkContent,
  allowDuplicates,
  setAllowDuplicates,
  onBulkImport,
  onRemoveItem,
  onClearItems,
  onClearBulkContent,
  fileUploadOpen,
  onFileUploadOpenChange,
  onFileUpload,
  isMobile,
  mode = 'create',
  totalExistingItems = 0,
  confirmationOpen,
  onConfirmationOpenChange,
  pendingFile,
  onConfirmUpload,
  onCancelUpload,
}: BulkImportSectionProps) {
  const isEditMode = mode === 'edit';
  const contentLabel = '分发内容';
  const itemsLabel = isEditMode ? '待添加内容' : '已添加内容';
  const placeholderPrefix = isEditMode ? '要追加的' : '';
  const emptyStateText = isEditMode ? '暂无待添加内容，请在上方导入' : '暂无分发内容，请在上方导入';

  return (
    <>
      {isEditMode && totalExistingItems > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                追加分发内容
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                这里添加的内容将追加到现有项目中，不会替换原有内容。当前项目共有{' '}
                <span className="font-medium">{totalExistingItems}</span> 个分发内容。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="text-sm font-medium">{contentLabel}</div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className={`cursor-pointer text-[11px] ${
                        !allowDuplicates ?
                          'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/30 dark:text-green-400' :
                          'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => setAllowDuplicates(!allowDuplicates)}
                    >
                      {isEditMode && <Filter className="h-3 w-3 mr-1" />}
                      辅助过滤
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      {!allowDuplicates ?
                        '已开启：自动过滤重复内容' :
                        '已关闭：允许导入重复内容'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      点击切换过滤模式
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge
                variant="secondary"
                className="cursor-pointer text-[11px] text-muted-foreground hover:bg-muted/80"
                onClick={() => onFileUploadOpenChange(true)}
              >
                文件导入
              </Badge>
              <Badge variant="secondary" className="bg-muted text-[11px] text-muted-foreground">
                共 {items.length} 个
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Textarea
              placeholder={`请输入${placeholderPrefix}分发内容，支持以下格式批量导入：\n• JSON 数组格式：[{}, {}, {}]\n• 每行一个内容\n• 逗号分隔（中英文逗号均可）\n导入重复内容请关闭右上角的 '过滤功能'`}
              value={bulkContent}
              onChange={(e) => setBulkContent(e.target.value)}
              className="h-[120px] break-all overflow-x-auto whitespace-pre-wrap pb-10 placeholder:text-xs"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <Button
                type="button"
                onClick={onBulkImport}
                size="sm"
                className="h-7 rounded-lg px-2.5 text-xs shadow-none"
              >
                导入
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:bg-transparent hover:text-destructive"
                onClick={onClearBulkContent}
              >
                清空
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{itemsLabel}</Label>
            {items.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={onClearItems}
              >
                清空全部
              </Button>
            )}
          </div>

          {items.length > 0 ? (
            <ScrollArea className="h-[176px] rounded-2xl bg-muted/35 dark:bg-white/[0.03]">
              <div className="space-y-1.5 p-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-xl bg-background/80 px-2.5 py-1.5 dark:bg-white/[0.04]"
                  >
                    <div className="flex size-5 shrink-0 items-center justify-center text-[11px] text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1 break-all overflow-x-auto text-xs text-foreground/90">
                      {item}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:bg-transparent hover:text-destructive"
                      onClick={() => onRemoveItem(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-[176px] w-full items-center justify-center rounded-2xl bg-muted/35 py-8 text-center text-sm text-muted-foreground dark:bg-white/[0.03]">
              {emptyStateText}
            </div>
          )}
        </div>
      </div>

      {/* 文件上传对话框 */}
      <Dialog open={fileUploadOpen} onOpenChange={onFileUploadOpenChange}>
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle>文件导入</DialogTitle>
            <DialogDescription className="text-xs">
            支持 .txt 和 .jsonl 格式 • 每行一个内容 • 空行自动忽略 • 大小限制：5MB
            </DialogDescription>
          </DialogHeader>

          <FileUpload onChange={onFileUpload} />
        </DialogContent>
      </Dialog>

      {/* 文件内容确认对话框 */}
      <Dialog open={confirmationOpen} onOpenChange={onConfirmationOpenChange}>
        <DialogContent className={`${isMobile ? 'max-w-[90vw] max-h-[80vh]' : 'max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle>文件内容确认</DialogTitle>
            <DialogDescription className="text-sm">
              检测到文件可能包含特殊字符，请确认是否继续导入。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                文件信息
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <div>文件名: {pendingFile?.file.name}</div>
                <div>文件大小: {pendingFile ? (pendingFile.file.size / 1024).toFixed(1) : 0} KB</div>
              </div>
            </div>

            {pendingFile && (
              <div className="space-y-2">
                {pendingFile.analysis.isBinary && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                    ⚠️ 检测到二进制文件特征
                  </div>
                )}
                {pendingFile.analysis.hasNonAscii && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
                    ⚠️ 检测到非 ASCII 字符
                  </div>
                )}
                {pendingFile.analysis.hasNonUnicode && (
                  <div className="p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-700 dark:text-orange-300">
                    ⚠️ 检测到非 Unicode 字符
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              继续导入可能会导致内容显示异常或数据处理错误。
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onCancelUpload}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={onConfirmUpload}
              className="flex-1"
              variant="default"
            >
              确定导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
