'use client';

import * as React from 'react';
import {Area, AreaChart, CartesianGrid, XAxis, YAxis} from 'recharts';
import {useIsMobile} from '@/hooks/use-mobile';
import {ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Skeleton} from '@/components/ui/skeleton';
import {ReceiveHistoryItem} from '@/lib/services/project/types';
import {CountingNumber} from '@/components/animate-ui/text/counting-number';

const TIME_RANGE_CONFIG = {
  '7d': {label: '7天', days: 7},
  '30d': {label: '30天', days: 30},
  '3m': {label: '3个月', months: 3},
  '6m': {label: '6个月', months: 6},
} as const;

const CHART_CONFIG = {
  count: {
    label: '领取数量',
    color: '#2563eb',
  },
} satisfies ChartConfig;

type TimeRange = keyof typeof TIME_RANGE_CONFIG

interface DataChartProps {
  data: ReceiveHistoryItem[]
  isLoading?: boolean
}

interface ChartDataItem {
  date: string
  displayDate: string
  count: number
}

interface StatsData {
  total: number
  today: number
  thisMonth: number
  avgDaily: number
}

/** 格式化日期 */
const formatDate = (date: Date, format: 'day' | 'month'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  if (format === 'month') {
    return `${year}-${month}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** 计算统计数据 */
const calculateStats = (data: ReceiveHistoryItem[]): StatsData => {
  const today = new Date();
  const todayStr = formatDate(today, 'day');
  const thisMonthStr = formatDate(today, 'month');

  let todayCount = 0;
  let thisMonthCount = 0;
  const total = data.length;

  data.forEach((item) => {
    if (item.received_at) {
      const date = new Date(item.received_at);
      const dateStr = formatDate(date, 'day');
      const monthStr = formatDate(date, 'month');

      if (dateStr === todayStr) {
        todayCount++;
      }
      if (monthStr === thisMonthStr) {
        thisMonthCount++;
      }
    }
  });

  const currentDay = today.getDate();
  const avgDaily = currentDay > 0 ? Math.round(thisMonthCount / currentDay * 10) / 10 : 0;

  return {
    total,
    today: todayCount,
    thisMonth: thisMonthCount,
    avgDaily,
  };
};

/** 生成图表数据 */
const generateChartData = (data: ReceiveHistoryItem[], timeRange: TimeRange): ChartDataItem[] => {
  const config = TIME_RANGE_CONFIG[timeRange];
  const isMonthRange = 'months' in config;
  const format = isMonthRange ? 'month' : 'day';

  // 时间范围和统计数据
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const statsMap = new Map<string, number>();
  const dateRange: string[] = [];

  // 统计实际数据
  data.forEach((item) => {
    if (item.received_at) {
      const key = formatDate(new Date(item.received_at), format);
      statsMap.set(key, (statsMap.get(key) || 0) + 1);
    }
  });

  // 完整时间范围
  if (isMonthRange) {
    for (let i = config.months - 1; i >= 0; i--) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth() - i, 1);
      dateRange.push(formatDate(date, 'month'));
    }
  } else {
    for (let i = config.days - 1; i >= 0; i--) {
      const date = new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000);
      dateRange.push(formatDate(date, 'day'));
    }
  }

  return dateRange.map((dateKey) => {
    let displayDate: string;

    if (isMonthRange) {
      const month = dateKey.split('-')[1];
      displayDate = `${month}月`;
    } else {
      const [, month, day] = dateKey.split('-');
      displayDate = `${month}/${day}`;
    }

    return {
      date: dateKey,
      displayDate,
      count: statsMap.get(dateKey) || 0,
    };
  });
};

// 统计数据卡片
const StatCard = ({title, value, suffix = ''}: { title: string; value: number; suffix?: string }) => {
  // 根据数值是否有小数来决定显示的小数位数
  const decimalPlaces = value % 1 === 0 ? 0 : 2;

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{title}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        <CountingNumber number={value} decimalPlaces={decimalPlaces}/>{suffix}
      </div>
    </div>
  );
};

/** 骨架屏组件 */
const DataChartSkeleton = () => {
  const chartBarHeights = [60, 35, 50, 25, 30, 55, 45];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-[18px] w-12" />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>

        <div className="py-2">
          <div className="h-[300px] w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <div className="w-full max-w-full px-8">
              <div className="flex items-end justify-between h-48 gap-4">
                {chartBarHeights.map((height, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2">
                    <Skeleton
                      className="w-8 bg-blue-100 dark:bg-blue-900/20"
                      style={{height: `${height}px`}}
                    />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function DataChart({data, isLoading}: DataChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('7d');

  React.useEffect(() => {
    if (isMobile) setTimeRange('7d');
  }, [isMobile]);

  const chartData = React.useMemo(() =>
    generateChartData(data, timeRange),
  [data, timeRange],
  );

  const stats = React.useMemo(() =>
    calculateStats(data),
  [data],
  );

  const handleTimeRangeChange = (value: string) => {
    if (value in TIME_RANGE_CONFIG) {
      setTimeRange(value as TimeRange);
    }
  };

  if (isLoading) {
    return <DataChartSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="总计" value={stats.total} />
        <StatCard title="今日" value={stats.today} />
        <StatCard title="本月" value={stats.thisMonth} />
        <StatCard title="日均" value={stats.avgDaily} />
      </div>

      {/* 图表区域 */}
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              领取趋势
            </h2>

            <div>
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger
                  className="flex w-24 max-h-[32px] text-xs"
                >
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
      </div>
    </div>
  );
}
