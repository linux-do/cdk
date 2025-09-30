'use client';

import {useMemo} from 'react';
import {DISTRIBUTION_MODE_NAMES} from '../project/constants';
import {ChartContainerProps, UserGrowthChartProps, ActivityChartProps, CategoryChartProps, DistributeModeChartProps, TooltipProps} from '@/lib/services/dashboard/types';
import {AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend} from 'recharts';

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
    animationDuration: 800,
  },
  line: {
    animationBegin: 100,
    animationDuration: 800,
  },
  pie: {
    animationBegin: 200,
    animationDuration: 1000,
  },
  bar: {
    animationBegin: 300,
    animationDuration: 900,
  },
};

// 配色方案
const ENHANCED_COLORS = {
  // 饼图配色
  pieChart: [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#6b7280',
  ],
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
 * 工具提示组件
 */
const EnhancedTooltip = ({active, payload, label}: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-w-[140px]">
        <div className="flex flex-col space-y-2">
          {/* 标题 */}
          <div className=" text-sm font-bold text-gray-600 dark:text-gray-400">
            {label}
          </div>

          {/* 数据项 */}
          <div className="space-y-1">
            {payload.map((entry, index) => {
              let itemColor = entry.color;
              if (!itemColor) {
                itemColor = entry.payload?.color as string | undefined;
              }

              return (
                <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{backgroundColor: itemColor as string}}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">数量</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return null;
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
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-w-[150px]">
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
            {data.name}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{backgroundColor: correctColor as string}}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">数量</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {(data.value as number).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{backgroundColor: correctColor as string}}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">占比</span>
              </div>
              <span className="text-sm font-bold tabular-nums" style={{color: correctColor as string}}>
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
function ChartContainer({title, icon, isLoading, children, hideHeader = false}: ChartContainerProps & {hideHeader?: boolean}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors">
      {!hideHeader && (
        <div className="p-4 pb-2">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-gray-600 dark:text-gray-400 w-4 h-4 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          </div>
        </div>
      )}
      <div className={hideHeader ? 'p-4' : 'p-4 pt-2'}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">数据加载中...</span>
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

  return (
    <ChartContainer title="用户增长" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] transition-all duration-300 ease-in-out" key={`user-growth-${range}-${data?.length || 0}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
            <defs>
              <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b7280'}}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b7280'}}
              tickMargin={8}
              allowDecimals={false}
            />
            <Tooltip
              content={<EnhancedTooltip labelFormatter={(label) => `日期: ${label}`} />}
              cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.6}}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#userGrowthGradient)"
              activeDot={{
                r: 6,
                stroke: '#1e40af',
                strokeWidth: 2,
                fill: '#ffffff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              }}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.area}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

/**
 * 领取活动趋势图表
 */
export function ActivityChart({data, isLoading, icon, range = 7, hideHeader = false}: ActivityChartProps & {hideHeader?: boolean}) {
  const chartData = useMemo(() => generateTimeRangeChartData(data, range), [data, range]);

  return (
    <ChartContainer title="领取活动趋势" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] transition-all duration-300 ease-in-out" key={`activity-${range}-${data?.length || 0}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b7280'}}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b7280'}}
              tickMargin={8}
              allowDecimals={false}
            />
            <Tooltip
              content={<EnhancedTooltip labelFormatter={(label) => `日期: ${label}`} />}
              cursor={{stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.6}}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#activityGradient)"
              activeDot={{
                r: 6,
                stroke: '#047857',
                strokeWidth: 2,
                fill: '#ffffff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              }}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.area}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
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
      <ChartContainer title="项目标签" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
        <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
          <div className="text-4xl opacity-30 text-gray-400">{icon}</div>
          <span className="text-sm text-gray-500 dark:text-gray-400">暂无标签数据</span>
        </div>
      </ChartContainer>
    );
  }

  // 使用映射并添加颜色信息
  const enhancedData = chartData.map((item, index) => ({
    ...item,
    color: ENHANCED_COLORS.barChart[index % ENHANCED_COLORS.barChart.length],
  }));

  return (
    <ChartContainer title="项目标签" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] w-full transition-all duration-300 ease-in-out" key={`category-${data?.length || 0}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enhancedData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b7280'}}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#6b7280'}}
              tickMargin={8}
              allowDecimals={false}
            />
            <Tooltip
              content={<EnhancedTooltip labelFormatter={(label) => `标签: ${label}`} />}
              cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
            />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              maxBarSize={80}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.bar}
            >
              {enhancedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ENHANCED_COLORS.barChart[index % ENHANCED_COLORS.barChart.length]}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}


/**
 * 分发模式统计饼图
 */
export function DistributeModeChart({data, isLoading, icon, hideHeader = false}: DistributeModeChartProps & {hideHeader?: boolean}) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : [];
  }, [data]);

  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <ChartContainer title="分发模式统计" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
        <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
          <div className="text-4xl opacity-30 text-gray-400">{icon}</div>
          <span className="text-sm text-gray-500 dark:text-gray-400">暂无分发数据</span>
        </div>
      </ChartContainer>
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
    <ChartContainer title="分发模式统计" icon={icon} isLoading={isLoading} hideHeader={hideHeader}>
      <div className="h-[300px] w-full transition-all duration-300 ease-in-out" key={`distribute-${data?.length || 0}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{top: 50, right: 10, left: -10, bottom: 50}}>
            <Pie
              data={enhancedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={100}
              innerRadius={45}
              paddingAngle={1}
              label={false}
              {...ANIMATION_CONFIG.base}
              {...ANIMATION_CONFIG.pie}
            >
              {enhancedData?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ENHANCED_COLORS.pieChart[index % ENHANCED_COLORS.pieChart.length]}
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = 'scale(1.05)';
                    target.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = 'scale(1)';
                    target.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
                  }}
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
                bottom: '-10px',
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
    </ChartContainer>
  );
}
