'use client';

import {motion} from 'motion/react';
import {useState} from 'react';
import {StatCard, CardList, UserGrowthChart, ActivityChart, CategoryChart, DistributeModeChart} from '@/components/common/dashboard/';
import {Tabs, TabsList, TabsTrigger} from '@/components/animate-ui/radix/tabs';
import {
  UsersIcon,
  DownloadIcon,
  FolderIcon,
  TrendingUpIcon,
  ChartColumnBigIcon,
  ChartAreaIcon,
  ChartLineIcon,
  Flame,
  TrendingUpDown,
  ChartPie,
  LayersPlus,
  HandCoins,
} from 'lucide-react';
import {useDashboard} from '@/hooks/use-dashboard';
import {useAuth} from '@/hooks/use-auth';

/**
 * 仪表板主组件
 */
export function DashboardMain() {
  const [range, setRange] = useState(7);
  const [activeTab, setActiveTab] = useState<'activity' | 'users' | 'tags'>('activity');
  const {data, isLoading} = useDashboard(range);
  const {user} = useAuth();

  /**
   * 获取时间段问候语
   */
  const getTimeGreeting = () => {
    const now = new Date();
    const chinaTime = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Shanghai'}));
    const hour = chinaTime.getHours();

    if (hour >= 0 && hour < 6) {
      return '凌晨';
    } else if (hour >= 6 && hour < 12) {
      return '早上';
    } else if (hour >= 12 && hour < 14) {
      return '中午';
    } else if (hour >= 14 && hour < 18) {
      return '下午';
    } else {
      return '晚上';
    }
  };

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
      icon: <UsersIcon className='h-3 w-3 sm:h-3.5 sm:w-3.5' />,
      desc: `+${data?.summary?.newUsers || 0} 新用户`,
      descColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: '总项目数',
      value: data?.summary?.totalProjects,
      icon: <FolderIcon className='h-3 w-3 sm:h-3.5 sm:w-3.5' />,
      desc: '项目总数',
      descColor: 'text-muted-foreground',
    },
    {
      title: '总领取数',
      value: data?.summary?.totalReceived,
      icon: <DownloadIcon className='h-3 w-3 sm:h-3.5 sm:w-3.5' />,
      desc: '历史累计',
      descColor: 'text-muted-foreground',
    },
    {
      title: '最近领取数',
      value: data?.summary?.recentReceived,
      icon: <TrendingUpIcon className='h-3 w-3 sm:h-3.5 sm:w-3.5' />,
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
      icon: <Flame className="h-4 w-4" />,
      list: data?.hotProjects || [],
      type: 'project' as const,
    },
    {
      title: '活跃创建者',
      icon: <LayersPlus className="h-4 w-4" />,
      list: data?.activeCreators || [],
      type: 'creator' as const,
    },
    {
      title: '活跃领取者',
      icon: <HandCoins className="h-4 w-4" />,
      list: data?.activeReceivers || [],
      type: 'receiver' as const,
    },
  ];

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

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 问候语标题和时间选择器 */}
      <motion.div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" variants={itemVariants}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {getTimeGreeting()}好，{user?.username || 'Linux Do User'}
          </h1>
        </div>

        {/* 时间范围选择器 */}
        <div className="flex items-center self-start lg:self-end">
          <Tabs
            value={String(range)}
            onValueChange={(value) => setRange(Number(value))}
            variant="pill"
          >
            <TabsList>
              {timeRangeOptions.map((option) => (
                <TabsTrigger key={option.value} value={String(option.value)}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </motion.div>
      {/* 统计卡片 - 响应式网格 */}
      <motion.div
        className='grid grid-cols-2 gap-3 lg:grid-cols-4'
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

      {/* 图表区域 - 1x3 网格布局 */}
      <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-3" variants={itemVariants}>
        {/* 左侧标签页图表 - 2/3 宽度 */}
        <div className="min-h-0 lg:col-span-2">
          <div className="h-full min-h-0 rounded-[22px] bg-muted flex flex-col">
            {/* 标签页导航 */}
            <div className="flex flex-col gap-3 p-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-3.5 w-3.5 items-center justify-center text-gray-500 dark:text-gray-400">
                  <TrendingUpDown className="size-3.5" />
                </div>
                <div className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  核心趋势
                </div>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'activity' | 'users' | 'tags')}
                variant="fill"
                className="self-start"
              >
                <TabsList>
                  <TabsTrigger value="activity">
                    <ChartLineIcon className="size-3.5" />
                    领取趋势
                  </TabsTrigger>
                  <TabsTrigger value="users">
                    <ChartAreaIcon className="size-3.5" />
                    用户增长
                  </TabsTrigger>
                  <TabsTrigger value="tags">
                    <ChartColumnBigIcon className="size-3.5" />
                    标签分布
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 标签页内容 */}
            <div className="flex-1 min-h-0 p-4 pt-1.5">
              {activeTab === 'activity' && (
                <div className="h-full min-h-0">
                  <ActivityChart
                    data={data?.activityData}
                    isLoading={isLoading}
                    icon={<ChartLineIcon className="h-4 w-4" />}
                    range={range}
                    hideHeader={true}
                  />
                </div>
              )}
              {activeTab === 'users' && (
                <div className="h-full min-h-0">
                  <UserGrowthChart
                    data={data?.userGrowth}
                    isLoading={isLoading}
                    icon={<ChartAreaIcon className="h-4 w-4" />}
                    range={range}
                    hideHeader={true}
                  />
                </div>
              )}
              {activeTab === 'tags' && (
                <div className="h-full min-h-0">
                  <CategoryChart
                    data={data?.projectTags}
                    isLoading={isLoading}
                    icon={<ChartColumnBigIcon className="h-4 w-4" />}
                    hideHeader={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧饼图 - 1/3 宽度 */}
        <div className="h-full min-h-0 lg:col-span-1">
          <DistributeModeChart
            data={data?.distributeModes}
            isLoading={isLoading}
            icon={<ChartPie className="h-4 w-4" />}
          />
        </div>
      </motion.div>

      {/* 列表卡片区 - 热门项目、活跃创建者、活跃领取者 */}
      <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" variants={itemVariants}>
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
