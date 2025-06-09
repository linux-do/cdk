'use client';

import {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {toast} from 'sonner';
import {useAuth} from '@/hooks/use-auth';
import services from '@/lib/services';
import {CheckCircle, XCircle, Loader2, TestTube} from 'lucide-react';

interface TestResult {
  success: boolean
  message: string
  timestamp: string
}

/** 项目领取测试逻辑 */
const useProjectReceive = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const receiveProject = async (projectId: string) => {
    try {
      setLoading(true);
      setResult(null);

      const response = await services.project.receiveProjectSafe(projectId);
      const timestamp = new Date().toLocaleString('zh-CN');

      if (response.success) {
        const successResult = {
          success: true,
          message: '领取成功！',
          timestamp,
        };
        setResult(successResult);
        toast.success('项目内容领取成功！');
        return successResult;
      } else {
        const errorResult = {
          success: false,
          message: response.error || '领取失败',
          timestamp,
        };
        setResult(errorResult);
        toast.error(response.error || '领取失败');
        return errorResult;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const timestamp = new Date().toLocaleString('zh-CN');

      const errorResult = {
        success: false,
        message: errorMessage,
        timestamp,
      };
      setResult(errorResult);
      toast.error('领取失败: ' + errorMessage);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  return {receiveProject, loading, result};
};

export default function TestPage() {
  const {user, isAuthenticated, isLoading: authLoading} = useAuth();
  const [projectId, setProjectId] = useState('');
  const {receiveProject, loading, result} = useProjectReceive();

  const handleReceive = async () => {
    if (!projectId.trim()) {
      toast.error('请输入项目ID');
      return;
    }

    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    const result = await receiveProject(projectId.trim());
    if (result.success) {
      setProjectId('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleReceive();
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">项目领取测试</h1>
          <p className="text-muted-foreground mt-1">
            测试项目内容的领取功能
          </p>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 领取测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">领取测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 用户状态 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">当前状态</Label>
              <div>
                {authLoading ? (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    检查中...
                  </Badge>
                ) : isAuthenticated ? (
                  <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-600">
                    <CheckCircle className="h-3 w-3" />
                    已登录 ({user?.username})
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                    <XCircle className="h-3 w-3" />
                    未登录
                  </Badge>
                )}
              </div>
            </div>

            {/* 项目ID输入 */}
            <div className="space-y-2">
              <Label htmlFor="projectId">项目ID</Label>
              <Input
                id="projectId"
                type="text"
                placeholder="请输入项目ID..."
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading || !isAuthenticated}
                className="font-mono text-sm"
              />
            </div>

            {/* 领取按钮 */}
            <Button
              onClick={handleReceive}
              disabled={loading || !isAuthenticated || !projectId.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  领取中...
                </>
              ) : (
                '领取项目内容'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* 结果状态 */}
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}>
                    {result.success ? '成功' : '失败'}
                  </span>
                </div>

                {/* 结果消息 */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {result.message}
                </div>

                {/* 时间戳 */}
                <div className="text-xs text-gray-500">
                  <span>测试时间: </span>
                  <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">
                    {result.timestamp}
                  </code>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <TestTube className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium mb-1">暂无测试结果</p>
                <p className="text-xs">执行测试后结果将显示在这里</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
