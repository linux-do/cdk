'use client';

import {motion} from 'motion/react';
import {useState, useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {StatCard, CardList, UserGrowthChart, ActivityChart, CategoryChart, DistributeModeChart} from '@/components/common/dashboard/';
import {RefreshCw, UsersIcon, DownloadIcon, FolderIcon, TrendingUpIcon, ChartPieIcon, ChartColumnBigIcon, ChartAreaIcon, ChartLineIcon, FlameIcon} from 'lucide-react';
import {useDashboard} from '@/hooks/use-dashboard';

/**
 * 仪表板主组件
 */
export function DashboardMain() {
  const [range, setRange] = useState(7);
  const [cooldown, setCooldown] = useState(0);
  const {data, isLoading, refresh} = useDashboard(range);

  /**
   * 防抖刷新函数
   */
  const handleRefresh = useCallback(async () => {
    if (isLoading || cooldown > 0) return;

    setCooldown(3);
    try {
      await refresh(true);
    } finally {
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

  /**
   * 时间范围配置
   */
  const timeRangeOptions = [
    {label: '7天', value: 7},
    {label: '15天', value: 15},
    {label: '30天', value: 30},
  ];

  /**
   * 统计卡片数据配置
   */
  const statsCards = [
    {
      title: '总用户数',
      value: data?.summary?.totalUsers,
      icon: <UsersIcon className="h-4 w-4" />,
      desc: `+${data?.summary?.newUsers || 0} 新用户`,
      descColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: '总项目数',
      value: data?.summary?.totalProjects,
      icon: <FolderIcon className="h-4 w-4" />,
      desc: '项目总数',
      descColor: 'text-muted-foreground',
    },
    {
      title: '总领取数',
      value: data?.summary?.totalReceived,
      icon: <DownloadIcon className="h-4 w-4" />,
      desc: '历史累计',
      descColor: 'text-muted-foreground',
    },
    {
      title: '最近领取数',
      value: data?.summary?.recentReceived,
      icon: <TrendingUpIcon className="h-4 w-4" />,
      desc: `最近${range}天`,
      descColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  /**
   * 列表卡片数据配置
   */
  const listCards = [
    {
      title: '热门项目',
      icon: <FlameIcon className="h-4 w-4" />,
      list: data?.hotProjects || [],
      type: 'project' as const,
    },
    {
      title: '活跃创建者',
      icon: <FlameIcon className="h-4 w-4" />,
      list: data?.activeCreators || [],
      type: 'creator' as const,
    },
    {
      title: '活跃领取者',
      icon: <DownloadIcon className="h-4 w-4" />,
      list: data?.activeReceivers || [],
      type: 'receiver' as const,
    },
  ];

  const isRefreshDisabled = isLoading || cooldown > 0;

  /**
   * 获取刷新按钮显示内容
   */
  const getRefreshContent = () => {
    if (isLoading) {
      return {
        text: '刷新中',
        title: '数据加载中...',
      };
    }
    if (cooldown > 0) {
      return {
        text: `${cooldown}s`,
        title: `请等待 ${cooldown} 秒后再试`,
      };
    }
    return {
      text: '刷新',
      title: '刷新数据',
    };
  };

  const refreshContent = getRefreshContent();

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        ease: 'easeOut',
      },
    },
  };

  const itemVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.5, ease: 'easeOut'},
    },
  };

  const separatorVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {duration: 0.2, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">实时数据</h1>
          <p className="text-muted-foreground mt-1">平台资源实时数据公开面板</p>
        </div>

        {/* 右侧控制区域 */}
        <div className="flex flex-col items-end gap-2">
          {/* 控制按钮组 */}
          <div className="flex items-center gap-3">
            {/* 时间范围选择器 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-1">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      range === option.value ?
                        'bg-background text-foreground shadow-sm' :
                        'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                    onClick={() => setRange(option.value)}
                    title={`查看最近 ${option.value} 天的数据`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 刷新按钮 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshDisabled}
                  title={refreshContent.title}
                  className="h-9 w-24 flex"
                >
                  <RefreshCw className={`justify-self-start ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="flex-1 hidden sm:inline">{refreshContent.text}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">平台数据每5分钟刷新</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.div>

      <motion.div variants={separatorVariants}>
        <Separator className="my-8" />
      </motion.div>

      {/* 统计卡片 */}
      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={itemVariants}
      >
        {statsCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            desc={card.desc}
            descColor={card.descColor}
          />
        ))}
      </motion.div>

      {/* 主图表区 - 用户增长趋势、领取活动趋势、分发模式统计、项目标签分布  */}
      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        <UserGrowthChart
          data={data?.userGrowth}
          isLoading={isLoading}
          icon={<ChartAreaIcon className="h-4 w-4" />}
          range={range}
        />
        <ActivityChart
          data={data?.activityData}
          isLoading={isLoading}
          icon={<ChartLineIcon className="h-4 w-4" />}
          range={range}
        />
      </motion.div>

      <motion.div className="grid gap-6 lg:grid-cols-2" variants={itemVariants}>
        <DistributeModeChart
          data={data?.distributeModes}
          isLoading={isLoading}
          icon={<ChartColumnBigIcon className="h-4 w-4" />}
        />
        <CategoryChart
          data={data?.projectTags}
          isLoading={isLoading}
          icon={<ChartPieIcon className="h-4 w-4" />}
        />
      </motion.div>

      {/* 列表卡片区 - 热门项目、活跃创建者、活跃领取者 */}
      <motion.div className="grid gap-6 lg:grid-cols-3" variants={itemVariants}>
        {listCards.map((card) => (
          <CardList
            key={card.title}
            title={card.title}
            icon={card.icon}
            list={card.list}
            type={card.type}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
