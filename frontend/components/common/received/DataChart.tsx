'use client';

import * as React from 'react';
import {Area, AreaChart, CartesianGrid, XAxis, YAxis} from 'recharts';
import {useIsMobile} from '@/hooks/use-mobile';
import {ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ReceiveHistoryChartPoint} from '@/lib/services/project/types';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';
import {motion} from 'motion/react';

/**
 * 时间范围配置
 */
const TIME_RANGE_CONFIG = {
  '7d': {label: '7天', days: 7},
  '30d': {label: '30天', days: 30},
  '3m': {label: '3个月', months: 3},
  '6m': {label: '6个月', months: 6},
} as const;

/**
 * 图表配置
 */
const CHART_CONFIG = {
  count: {label: '领取数量', color: '#2563eb'},
} satisfies ChartConfig;

type TimeRange = keyof typeof TIME_RANGE_CONFIG

/**
 * 数据图表组件的Props接口
 */
interface DataChartProps {
  /** 领取历史数据 */
  data: ReceiveHistoryChartPoint[]
  /** 当前选择的天数 */
  selectedDay: number
  /** 范围变更回调 */
  onRangeChange: (day: number) => void
}

/**
 * 统计数据卡片组件
 */
const StatCard = ({title, value, suffix = ''}: {title: string; value: number; suffix?: string}) => {
  const decimalPlaces = Number.isInteger(value) ? 0 : 1;

  return (
    <motion.div
      className="rounded-lg bg-muted p-3"
      variants={{
        hidden: {opacity: 0, y: 20, scale: 0.95},
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {duration: 0.5, ease: 'easeOut'},
        },
      }}
    >
      <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
        {title}
      </div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        <CountingNumber number={value} decimalPlaces={decimalPlaces}/>{suffix}
      </div>
    </motion.div>
  );
};

/**
 * 数据图表组件
 */
export function DataChart({data, selectedDay, onRangeChange}: DataChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('7d');
  const safeData = React.useMemo(() => data ?? [], [data]);

  React.useEffect(() => {
    if (isMobile) setTimeRange('7d');
  }, [isMobile]);

  React.useEffect(() => {
    if (selectedDay <= 7) {
      setTimeRange('7d');
    } else if (selectedDay <= 30) {
      setTimeRange('30d');
    } else if (selectedDay <= 90) {
      setTimeRange('3m');
    } else {
      setTimeRange('6m');
    }
  }, [selectedDay]);

  /**
   * 生成图表数据，根据时间范围聚合统计
   */
  const chartData = React.useMemo(() => {
    return safeData.map((item) => ({
      date: item.date,
      displayDate: item.label,
      count: item.count,
    }));
  }, [safeData]);

  /**
   * 计算统计数据（总计、今日、本月、日均）
   */
  const stats = React.useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const thisMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let todayCount = 0;
    let thisMonthCount = 0;

    safeData.forEach((item) => {
      if (item.date === todayStr) {
        todayCount += item.count;
      }
      if (item.date.startsWith(thisMonthStr)) {
        thisMonthCount += item.count;
      }
    });

    const currentDay = today.getDate();
    const avgDaily = currentDay > 0 ? Math.round(thisMonthCount / currentDay * 10) / 10 : 0;

    return {
      total: safeData.reduce((sum, item) => sum + item.count, 0),
      today: todayCount,
      thisMonth: thisMonthCount,
      avgDaily,
    };
  }, [safeData]);

  const containerVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.05,
        ease: 'easeOut',
      },
    },
  };

  const chartVariants = {
    hidden: {opacity: 0, y: 30},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.7, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="grid grid-cols-2 gap-3 md:grid-cols-4" variants={containerVariants}>
        <StatCard title="总计" value={stats.total} />
        <StatCard title="今日" value={stats.today} />
        <StatCard title="本月" value={stats.thisMonth} />
        <StatCard title="日均" value={stats.avgDaily} />
      </motion.div>

      <motion.div variants={chartVariants} className="rounded-lg bg-muted p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              领取趋势
            </h2>

            <div>
              <Select value={timeRange} onValueChange={(value) => {
                if (value in TIME_RANGE_CONFIG) {
                  const nextRange = value as TimeRange;
                  setTimeRange(nextRange);
                  const config = TIME_RANGE_CONFIG[nextRange];
                  const days = 'days' in config ? config.days : config.months * 30;
                  onRangeChange(days);
                }
              }}>
                <SelectTrigger className="flex w-24 max-h-[32px] bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-24">
                  {Object.entries(TIME_RANGE_CONFIG).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="py-2">
          <ChartContainer config={CHART_CONFIG} className="-ml-8 h-[300px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_CONFIG.count.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={CHART_CONFIG.count.color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tickCount={5}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="count"
                type="monotone"
                fill="url(#fillCount)"
                stroke={CHART_CONFIG.count.color}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
