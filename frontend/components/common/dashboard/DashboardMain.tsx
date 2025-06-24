import { useState, useCallback } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import {
  RefreshCw, UsersIcon, DownloadIcon, TargetIcon, AwardIcon, FileTextIcon,ChartPieIcon, ChartColumnBigIcon, ChartAreaIcon, ChartLineIcon, FlameIcon,
  GalleryVerticalEndIcon
} from 'lucide-react';
import {
  StatCard, CardList, StatusDisplay,
  UserGrowthChart, ActivityChart, CategoryChart, DistributeModeChart
} from '@/components/common/dashboard/';

export function DashboardMain() {
  const [range, setRange] = useState(7);
  const [cooldown, setCooldown] = useState(0);
  const { data, isLoading, lastUpdate, refresh } = useDashboard(range, false);


  // 防抖刷新函数
  const handleRefresh = useCallback(async () => {
    if (isLoading || cooldown > 0) return; 
    setCooldown(3);
    try {
      await refresh();
    } finally {
      // 开始倒计时
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [refresh, isLoading, cooldown]);

  // 按钮是否禁用
  const isRefreshDisabled = isLoading || cooldown > 0;

  return (
    <div className="-m-4 md:-m-6 -mx-6 md:-mx-8 min-h-screen bg-background">
      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* 标题 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">实时数据</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">平台资源实时数据公开面板</p>
        </div>

        {/* 时间范围和刷新 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">时间范围</span>
            <div className="flex rounded-lg border border-border bg-muted p-1">
              {[7, 15, 30].map((d) => (
                <button
                  key={d}
                  className={`rounded-md h-7 px-3 text-xs transition-colors ${
                    range === d 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}                  
                  onClick={() => setRange(d)}
                >
                  {d}天
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              最后更新 {lastUpdate || '未更新'}
            </span>
            <button
              className={`inline-flex items-center justify-center border rounded-md px-3 text-xs h-8 w-20 transition-all duration-200 ${
                isRefreshDisabled
                ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                : 'border-border bg-card shadow-sm hover:bg-accent hover:text-accent-foreground text-card-foreground hover:shadow-md'
              }`}
              onClick={handleRefresh}
              disabled={isRefreshDisabled}
              title={
                isLoading 
                ? '数据加载中...' 
                : cooldown > 0 
                    ? `请等待 ${cooldown} 秒后再试` 
                    : '刷新数据'
              }
            >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'mr-2'}`} />
              <span className="truncate">
                {isLoading 
                  ? '刷新中' 
                  : cooldown > 0 
                    ? `${cooldown}s` 
                    : '刷新'
                }
              </span>
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 transition-all duration-300 ease-in-out">
          <StatCard
            title="总用户数"
            value={data?.summary?.totalUsers}
            icon={<UsersIcon className="h-5 w-5 text-foreground" />}
            desc={`+${data?.summary?.newUsers || 0} 新用户`}
            descColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="活跃项目"
            value={data?.summary?.activeProjects}
            icon={<GalleryVerticalEndIcon className="h-5 w-5 text-foreground" />}
            desc={`总计 ${data?.summary?.totalProjects || 0} 个`}
            descColor="text-muted-foreground"
          />
          <StatCard
            title="总领取数"
            value={data?.summary?.totalReceived}
            icon={<DownloadIcon className="h-5 w-5 text-foreground" />}
            desc={`+${data?.summary?.recentReceived || 0} 近期`}
            descColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="领取成功率"
            value={data?.summary?.successRate}
            icon={<TargetIcon className="h-5 w-5 text-foreground" />}
          />
        </div>

        {/* 主图表区 */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <UserGrowthChart 
            data={data?.userGrowth} 
            isLoading={isLoading} 
            icon={<ChartAreaIcon className="h-5 w-5 text-foreground" />} 
            range={range}
          />
          <ActivityChart 
            data={data?.activityData} 
            isLoading={isLoading} 
            icon={<ChartLineIcon className="h-5 w-5 text-foreground" />} 
            range={range}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <DistributeModeChart 
            data={data?.distributeModes} 
            isLoading={isLoading} 
            icon={<ChartColumnBigIcon className="h-5 w-5 text-foreground" />} 
          />
          <CategoryChart 
            data={data?.projectTags} 
            isLoading={isLoading} 
            icon={<ChartPieIcon className="h-5 w-5 text-foreground" />} 
          />
        </div>

        {/* 热门项目、活跃创建者、活跃领取者、热门标签 */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <CardList 
            title="热门项目" 
            iconBg="bg-card" 
            icon={<AwardIcon className="h-5 w-5 text-card-foreground" />} 
            list={data?.hotProjects || []} 
            type="project" 
          />
          <CardList 
            title="活跃创建者" 
            iconBg="bg-card" 
            icon={<FlameIcon className="h-5 w-5 text-card-foreground" />} 
            list={data?.activeCreators || []} 
            type="creator" 
          />
          <CardList 
            title="活跃领取者" 
            iconBg="bg-card" 
            icon={<DownloadIcon className="h-5 w-5 text-card-foreground" />} 
            list={data?.activeReceivers || []} 
            type="receiver" 
          />
          {/* <TagsDisplay 
            title="热门标签" 
            tags={data?.hotTags} 
            iconBg="bg-card" 
            icon={<PaperclipIcon className="h-5 w-5 text-card-foreground" />} 
          /> */}
        </div>

        {/* 申请状态统计 */}
        <StatusDisplay 
          data={data?.applyStatus} 
          icon={<FileTextIcon className="h-5 w-5 text-foreground" />} 
          iconBg="bg-card"
        />
      </div>
    </div>
  );
}
