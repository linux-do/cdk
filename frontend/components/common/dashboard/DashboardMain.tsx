'use client';

import {motion} from 'motion/react';
import {useState} from 'react';
import {StatCard, CardList, UserGrowthChart, ActivityChart, CategoryChart, DistributeModeChart} from '@/components/common/dashboard/';
import {UsersIcon, DownloadIcon, FolderIcon, TrendingUpIcon, ChartPieIcon, ChartColumnBigIcon, ChartAreaIcon, ChartLineIcon, FlameIcon} from 'lucide-react';
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
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 问候语标题和时间选择器 */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0" variants={itemVariants}>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            👋 {getTimeGreeting()}好，{user?.username || 'Linux Do User'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">平台数据概览和趋势分析</p>
        </div>

        {/* 时间范围选择器 */}
        <div className="flex items-center gap-1 self-start sm:self-center">
          <div className="flex items-center bg-muted/50 backdrop-blur-sm rounded-lg px-1.5 py-1 border border-border/50">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  range === option.value ?
                    'bg-primary text-primary-foreground shadow-md' :
                    'text-muted-foreground hover:text-foreground hover:bg-background/80'
                }`}
                onClick={() => setRange(option.value)}
                title={`查看最近 ${option.value} 天的数据`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>


      {/* 统计卡片 - 响应式网格 */}
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4"
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
      <motion.div className="grid gap-6 lg:grid-cols-3" variants={itemVariants}>
        {/* 左侧标签页图表 - 2/3 宽度 */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg h-full flex flex-col">
            {/* 标签页导航 */}
            <div className="p-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 border-b border-border/50">
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-200 border-b-2 ${
                    activeTab === 'activity' ?
                      'border-primary text-foreground bg-background/50' :
                      'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveTab('activity')}
                >
                  <ChartLineIcon className="h-4 w-4 mr-1.5 inline" />
                  领取趋势
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-200 border-b-2 ${
                    activeTab === 'users' ?
                      'border-primary text-foreground bg-background/50' :
                      'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveTab('users')}
                >
                  <ChartAreaIcon className="h-4 w-4 mr-1.5 inline" />
                  用户增长
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-200 border-b-2 ${
                    activeTab === 'tags' ?
                      'border-primary text-foreground bg-background/50' :
                      'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveTab('tags')}
                >
                  <ChartColumnBigIcon className="h-4 w-4 mr-1.5 inline" />
                  标签分布
                </button>
              </div>
            </div>

            {/* 标签页内容 */}
            <div className="flex-1 transition-all duration-300 ease-in-out">
              {activeTab === 'activity' && (
                <div className="p-0 pt-2 h-full">
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
                <div className="p-0 pt-2 h-full">
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
                <div className="p-0 pt-2 h-full">
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
        <div className="h-full">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg h-full flex flex-col">
            {/* 饼图标题 */}
            <div className="p-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-gray-600 dark:text-gray-400 w-4 h-4 flex items-center justify-center">
                  <ChartPieIcon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">分发模式统计</h3>
              </div>
            </div>
            {/* 饼图内容 */}
            <div className="flex-1 p-4 pt-2">
              <DistributeModeChart
                data={data?.distributeModes}
                isLoading={isLoading}
                icon={<ChartPieIcon className="h-4 w-4" />}
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 列表卡片区 - 热门项目、活跃创建者、活跃领取者 */}
      <motion.div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" variants={itemVariants}>
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
