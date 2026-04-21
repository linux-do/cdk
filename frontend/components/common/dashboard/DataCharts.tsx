'use client';

import {useMemo, useState} from 'react';
import {DISTRIBUTION_MODE_NAMES} from '../project/constants';
import {ChartContainerProps, UserGrowthChartProps, ActivityChartProps, CategoryChartProps, DistributeModeChartProps, TooltipProps} from '@/lib/services/dashboard/types';
import {AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, CartesianGrid} from 'recharts';
import {ChartConfig, ChartContainer as UIChartContainer, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart';
import {DashboardEmptyState} from './DashboardEmptyState';

function formatDateTick(value: string): string {
  return value.replace('/', '.');
}

function formatYAxisTick(value: number | string): string {
  return Number(value) === 0 ? '' : String(value);
}

function getVisibleDateTicks(data: { date: string }[], range: number): string[] {
  if (!data.length) {
    return [];
  }

  if (range <= 7) {
    return data.map((item) => item.date);
  }

  const step = range <= 15 ? 2 : 3;
  const ticks = data
      .filter((_, index) => index % step === 0)
      .map((item) => item.date);

  const lastTick = data[data.length - 1]?.date;
  if (lastTick && !ticks.includes(lastTick)) {
    ticks.push(lastTick);
  }

  return ticks;
}

function truncateCategoryTick(value: string, maxLength = 8): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

const SHARED_CHART_COLORS = [
  '#5b84e6',
  '#4cad87',
  '#c4963f',
  '#c86f9d',
  '#846fe6',
  '#42a9bc',
  '#c57d49',
];

const USER_GROWTH_CHART_CONFIG = {
  value: {
    label: '新增用户',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const ACTIVITY_CHART_CONFIG = {
  value: {
    label: '领取数',
    color: '#10b981',
  },
} satisfies ChartConfig;

const CATEGORY_CHART_CONFIG = {
  value: {
    label: '标签热度',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

/**
 * 生成时间范围图表数据
 */
const generateTimeRangeChartData = (data: { date: string; value: number }[] | undefined, range: number = 7) => {
  // 生成完整的日期范围
  const today = new Date();
  const fullDateRange = [];

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${month}/${day}`;

    fullDateRange.push({
      date: dateKey,
      value: 0,
      originalDate: date,
    });
  }

  // 如果没有数据，返回全零数据
  if (!data || data.length === 0) {
    return fullDateRange.map(({date, value}) => ({date, value}));
  }

  // 创建数据映射，支持多种日期格式
  const dataMap = new Map();

  data.forEach((item) => {
    let normalizedDate = '';
    // 处理不同的日期格式
    if (item.date.includes('月') && item.date.includes('日')) {
      const match = item.date.match(/(\d{1,2})月(\d{1,2})日/);
      if (match) {
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        normalizedDate = `${month}/${day}`;
      }
    } else if (item.date.includes('-')) {
      const dateParts = item.date.split('-');
      if (dateParts.length >= 2) {
        const month = dateParts[dateParts.length - 2].padStart(2, '0');
        const day = dateParts[dateParts.length - 1].padStart(2, '0');
        normalizedDate = `${month}/${day}`;
      }
    } else if (item.date.includes('/')) {
      normalizedDate = item.date;
    }

    if (normalizedDate) {
      dataMap.set(normalizedDate, item.value || 0);
    }
  });

  return fullDateRange.map(({date, value}) => ({
    date,
    value: dataMap.has(date) ? dataMap.get(date) : value,
  }));
};

/**
 * 动画配置
 */
const ANIMATION_CONFIG = {
  base: {
    isAnimationActive: true,
    animationEasing: 'ease-in-out' as const,
  },
  area: {
    animationBegin: 0,
    animationDuration: 1150,
  },
  line: {
    animationBegin: 100,
    animationDuration: 1100,
  },
  pie: {
    animationBegin: 120,
    animationDuration: 1350,
  },
  bar: {
    animationBegin: 160,
    animationDuration: 1200,
  },
};

// 配色方案
const ENHANCED_COLORS = {
  // 饼图配色
  pieChart: SHARED_CHART_COLORS,
  // 柱状图配色
  barChart: [
    '#3b82f6',
    '#f59e0b',
  ],
  // 线性渐变色
  gradients: {
    blue: {from: '#3b82f6', to: '#1e40af'},
    green: {from: '#10b981', to: '#047857'},
    purple: {from: '#8b5cf6', to: '#6d28d9'},
    orange: {from: '#f59e0b', to: '#d97706'},
  },
};

/**
 * 饼图工具提示
 */
const PieTooltip = ({active, payload}: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = (data.payload?.total as number) || 100;
    const percentage = ((data.value as number) / total * 100).toFixed(1);

    const correctColor = (data.payload?.color as string) || data.color;

    return (
      <div className="min-w-[120px] rounded-md border border-border/60 bg-background/95 px-2.5 py-2 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">
            {data.name}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{backgroundColor: correctColor as string}}
                />
                <span className="text-[11px] text-muted-foreground">数量</span>
              </div>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {(data.value as number).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{backgroundColor: correctColor as string}}
                />
                <span className="text-[11px] text-muted-foreground">占比</span>
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{color: correctColor as string}}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * 图表容器
 */
function DashboardChartContainer({title, icon, isLoading, children, hideHeader = false}: ChartContainerProps & {hideHeader?: boolean}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-[22px] transition-colors h-full flex flex-col">
      {!hideHeader && (
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="text-gray-500 dark:text-gray-400 w-3.5 h-3.5 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h3 className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          </div>
        </div>
      )}
      <div className={hideHeader ? 'flex-1 min-h-0 px-3 pt-3 pb-4' : 'flex-1 min-h-0 p-4 pt-1.5'}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">数据加载中...</span>
          </div>
        ) : children}
      </div>
    </div>
  );
}

/**
 * 用户增长趋势图表
 */
export function UserGrowthChart({data, isLoading, icon, range = 7, hideHeader = false}: UserGrowthChartProps & {hideHeader?: boolean}) {
  const chartData = useMemo(() => generateTimeRangeChartData(data, range), [data, range]);
  const visibleTicks = useMemo(() => getVisibleDateTicks(chartData, range), [chartData, range]);

  return (
    <DashboardChartContainer title="用户增长" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] transition-all duration-300 ease-in-out" key={`user-growth-${range}-${data?.length || 0}`}>
        <UIChartContainer config={USER_GROWTH_CHART_CONFIG} className="block h-full w-full aspect-auto">
          <AreaChart data={chartData} margin={{top: 10, right: 8, left: 0, bottom: 0}}>
            <defs>
              <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.26}/>
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              ticks={visibleTicks}
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 11, fill: 'var(--muted-foreground)'}}
              tickMargin={4}
              height={20}
              padding={{left: 2, right: 10}}
              tickFormatter={formatDateTick}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 11, fill: 'var(--muted-foreground)'}}
              tickMargin={8}
              width={36}
              allowDecimals={false}
              tickFormatter={formatYAxisTick}
            />
            <ChartTooltip
              cursor={{stroke: 'var(--border)', strokeDasharray: '4 4'}}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(label) => `日期: ${label}`} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={1.25}
              fill="url(#userGrowthGradient)"
              activeDot={{
                r: 4,
                stroke: 'var(--color-value)',
                strokeWidth: 1.5,
                fill: '#ffffff',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
              }}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.area}
            />
          </AreaChart>
        </UIChartContainer>
      </div>
    </DashboardChartContainer>
  );
}

/**
 * 领取活动趋势图表
 */
export function ActivityChart({data, isLoading, icon, range = 7, hideHeader = false}: ActivityChartProps & {hideHeader?: boolean}) {
  const chartData = useMemo(() => generateTimeRangeChartData(data, range), [data, range]);
  const visibleTicks = useMemo(() => getVisibleDateTicks(chartData, range), [chartData, range]);

  return (
    <DashboardChartContainer title="领取活动趋势" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] transition-all duration-300 ease-in-out" key={`activity-${range}-${data?.length || 0}`}>
        <UIChartContainer config={ACTIVITY_CHART_CONFIG} className="block h-full w-full aspect-auto">
          <AreaChart data={chartData} margin={{top: 10, right: 8, left: 0, bottom: 0}}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.24}/>
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              ticks={visibleTicks}
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 11, fill: 'var(--muted-foreground)'}}
              tickMargin={4}
              height={20}
              padding={{left: 2, right: 10}}
              tickFormatter={formatDateTick}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 11, fill: 'var(--muted-foreground)'}}
              tickMargin={8}
              width={36}
              allowDecimals={false}
              tickFormatter={formatYAxisTick}
            />
            <ChartTooltip
              cursor={{stroke: 'var(--border)', strokeDasharray: '4 4'}}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(label) => `日期: ${label}`} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={1.5}
              fill="url(#activityGradient)"
              activeDot={{
                r: 4,
                stroke: 'var(--color-value)',
                strokeWidth: 1.5,
                fill: '#ffffff',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
              }}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.area}
            />
          </AreaChart>
        </UIChartContainer>
      </div>
    </DashboardChartContainer>
  );
}

/**
 * 项目标签分布柱状图
 */
export function CategoryChart({data, isLoading, icon, hideHeader = false}: CategoryChartProps & {hideHeader?: boolean}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 按value降序排序，只取前10个
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    return sortedData.slice(0, 10);
  }, [data]);

  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <DashboardChartContainer title="项目标签" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
        <DashboardEmptyState icon={icon} className="h-[300px]" />
      </DashboardChartContainer>
    );
  }

  return (
    <DashboardChartContainer title="项目标签" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] w-full transition-all duration-300 ease-in-out" key={`category-${data?.length || 0}`}>
        <UIChartContainer config={CATEGORY_CHART_CONFIG} className="block h-full w-full aspect-auto">
          <BarChart data={chartData} margin={{top: 10, right: 8, left: 0, bottom: 0}}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 11, fill: 'var(--muted-foreground)'}}
              tickMargin={4}
              height={20}
              interval={0}
              tickFormatter={(value) => truncateCategoryTick(String(value))}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 11, fill: 'var(--muted-foreground)'}}
              tickMargin={8}
              width={36}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{fill: 'var(--muted)'}}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(label) => `标签: ${label}`} />}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={80}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.bar}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`category-cell-${index}`}
                  fill={SHARED_CHART_COLORS[index % SHARED_CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </UIChartContainer>
      </div>
    </DashboardChartContainer>
  );
}


/**
 * 分发模式统计饼图
 */
export function DistributeModeChart({data, isLoading, icon, hideHeader = false}: DistributeModeChartProps & {hideHeader?: boolean}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : [];
  }, [data]);

  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <DashboardChartContainer title="分发模式统计" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
        <DashboardEmptyState icon={icon} className="h-[300px]" />
      </DashboardChartContainer>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const enhancedData = chartData.map((item, index) => ({
    ...item,
    name: DISTRIBUTION_MODE_NAMES[item.name] || item.name,
    total,
    color: ENHANCED_COLORS.pieChart[index % ENHANCED_COLORS.pieChart.length],
  }));

  return (
    <DashboardChartContainer title="分发模式统计" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-full min-h-[300px] w-full transition-all duration-300 ease-in-out" key={`distribute-${data?.length || 0}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{top: 12, right: 0, left: 0, bottom: 28}}>
            <Pie
              data={enhancedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="44%"
              outerRadius={84}
              innerRadius={58}
              paddingAngle={0}
              label={false}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.pie}
            >
              {enhancedData?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ENHANCED_COLORS.pieChart[index % ENHANCED_COLORS.pieChart.length]}
                  stroke={activeIndex === index ? entry.color : 'transparent'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  style={{
                    outline: 'none',
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              iconSize={8}
              iconType="circle"
              wrapperStyle={{
                position: 'absolute',
                bottom: '0px',
                width: '100%',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'nowrap',
                gap: '12px',
                lineHeight: '1',
              }}
              formatter={(value: number) => (
                <span style={{
                  color: '#6b7280',
                  fontWeight: '400',
                  whiteSpace: 'nowrap',
                  lineHeight: '1',
                  verticalAlign: 'middle',
                }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </DashboardChartContainer>
  );
}
