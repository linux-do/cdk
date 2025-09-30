'use client';

import {useState, useEffect, useCallback} from 'react';
import {useIsMobile} from '@/hooks/use-mobile';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/animate-ui/radix/dialog';
import {EmptyState} from '@/components/common/layout/EmptyState';
import {Users, Search, Copy, CheckCircle, AlertCircle, Loader2} from 'lucide-react';
import services from '@/lib/services';
import {ProjectReceiver} from '@/lib/services/project/types';

interface ReceiverDialogProps {
  projectId: string;
  projectName: string;
  children?: React.ReactNode;
}

/**
 * 项目领取人对话框组件
 */
export function ReceiverDialog({
  projectId,
  projectName,
  children,
}: ReceiverDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receivers, setReceivers] = useState<ProjectReceiver[]>([]);
  const [filteredReceivers, setFilteredReceivers] = useState<ProjectReceiver[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  /**
   * 获取项目领取人列表
   */
  const fetchReceivers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await services.project.getProjectReceiversSafe(projectId);

      if (result.success) {
        setReceivers(result.data || []);
        setFilteredReceivers(result.data || []);
      } else {
        setError(result.error || '获取领取人列表失败');
      }
    } catch {
      setError('获取领取人列表失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * 搜索功能
   */
  const handleSearch = useCallback((keyword: string) => {
    const filtered = receivers.filter((receiver) =>
      receiver.username.toLowerCase().includes(keyword.toLowerCase()) ||
      receiver.nickname.toLowerCase().includes(keyword.toLowerCase()) ||
      receiver.content.toLowerCase().includes(keyword.toLowerCase()),
    );

    setFilteredReceivers(filtered);
  }, [receivers]);

  /**
   * 复制内容到剪贴板
   */
  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('已复制到剪贴板');

      // 2秒后重置复制状态
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  /**
   * 重试获取数据
   */
  const handleRetry = () => {
    fetchReceivers();
  };

  /**
   * 对话框打开时获取数据
   */
  useEffect(() => {
    if (open) {
      fetchReceivers();
      setSearchKeyword('');
    }
  }, [open, fetchReceivers]);

  /**
   * 搜索关键词变化时过滤数据
   */
  useEffect(() => {
    handleSearch(searchKeyword);
  }, [searchKeyword, handleSearch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="ghost">
            <Users className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={`${isMobile ? 'max-w-[95vw] max-h-[85vh]' : 'max-w-3xl max-h-[80vh]'} overflow-hidden`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            项目领取人
          </DialogTitle>
          <DialogDescription>
            查看项目 &ldquo;{projectName}&rdquo; 的所有领取人信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* 搜索栏 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名、昵称或内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 统计信息 */}
          {!loading && !error && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                共 {receivers.length} 人领取
                {searchKeyword && ` · 筛选出 ${filteredReceivers.length} 条结果`}
              </span>
            </div>
          )}

          {/* 内容区域 */}
          <div className="min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">正在加载领取人列表...</p>
                </div>
              </div>
            ) : error ? (
              <EmptyState
                icon={AlertCircle}
                title="加载失败"
                description={error}
                className="h-[300px] flex flex-col items-center justify-center"
              >
                <Button onClick={handleRetry} variant="outline" size="sm" className="mt-3">
                  重试
                </Button>
              </EmptyState>
            ) : filteredReceivers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={searchKeyword ? '未找到匹配的领取人' : '暂无领取人'}
                description={searchKeyword ? '尝试调整搜索关键词' : '还没有人领取此项目'}
                className="h-[300px] flex flex-col items-center justify-center"
              />
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {filteredReceivers.map((receiver, index) => (
                    <div
                      key={`${receiver.username}-${index}`}
                      className="p-2 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{receiver.username} ({receiver.nickname})</span>
                        <span className="text-xs text-muted-foreground">-</span>
                        <span className="text-xs font-mono truncate flex-1 min-w-0">{receiver.content}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(receiver.content, index)}
                          className="flex-shrink-0 h-6 w-6 p-0"
                        >
                          {copiedIndex === index ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
