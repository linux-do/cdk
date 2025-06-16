import { ReactNode, useMemo } from 'react';
import { DistributionType } from '@/lib/services/project/types';
import { DISTRIBUTION_MODE_NAMES } from '../project/constants';
interface ChartContainerProps {
    title: string;
    icon?: ReactNode;
    iconBg?: string;
    isLoading: boolean;
    children: ReactNode;
  }

import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
  TooltipProps
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// Props interfaces
export interface UserGrowthChartProps {
  data?: { date: string; value: number }[];
  isLoading: boolean;
  icon?: ReactNode;
  range?: number;
}

export interface ActivityChartProps {
  data?: { date: string; value: number }[];
  isLoading: boolean;
  icon?: ReactNode;
  range?: number;
}

export interface CategoryChartProps {
  data?: { name: string; value: number;}[];
  isLoading: boolean;
  icon?: ReactNode;
}

export interface DistributeModeChartProps {
  data?: { name: DistributionType; value: number;}[];
  isLoading: boolean;
  icon?: ReactNode;
}

// 时间范围
const generateTimeRangeChartData = (data: { date: string; value: number }[] | undefined, range: number = 7) => {
  if (!data || data.length === 0) {
    // 空数据处理
    const today = new Date();
    const chartData = [];
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${month}/${day}`;

      chartData.push({
        date: dateKey,
        value: 0,
      });
    }
    return chartData;
  }

  // 数据格式处理
  return data.map(item => {
    let formattedDate = item.date;
    
    // 日期格式处理
    if (item.date.includes('-')) {
      const dateParts = item.date.split('-');
      if (dateParts.length >= 2) {
        const month = dateParts[1];
        const day = dateParts[2] || '01';
        formattedDate = `${month}/${day}`;
      }
    }
    
    return {
      date: formattedDate,
      value: item.value || 0
    };
  });
};

// 配色方案
const ENHANCED_COLORS = {
  // 饼图配色
  pieChart: [
    '#6366f1', 
    '#8b5cf6',   
    '#a855f7', 
    '#c084fc', 
    '#e879f9', 
  ],
  // 柱状图配色
  barChart: [
    '#3b82f6', 
    '#f59e0b',
  ],
  // 线性渐变色
  gradients: {
    blue: { from: '#3b82f6', to: '#1e40af' },
    green: { from: '#10b981', to: '#047857' },
    purple: { from: '#8b5cf6', to: '#6d28d9' },
    orange: { from: '#f59e0b', to: '#d97706' },
  }
};

// 工具提示组件
const EnhancedTooltip = ({ active, payload, label, labelFormatter }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm p-4 border border-border/50 rounded-xl shadow-lg min-w-[160px]">
          <div className="flex flex-col space-y-2">
            {/* 标题 */}
            <div className="text-sm font-semibold text-popover-foreground border-b border-border pb-2">
              {labelFormatter ? labelFormatter(label, payload) : label}
            </div>
            
            {/* 数据项 */}
            <div className="space-y-1.5">
              {payload.map((entry, index) => {
                let itemColor = entry.color;
                if (!itemColor) {
                  itemColor = entry.payload?.color;
                }
                
                return (
                  <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: itemColor }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">数量</span>
                    </div>
                    <span className="text-sm font-bold text-popover-foreground">
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
  

// 饼图工具提示
const PieTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const total = data.payload?.total || 100;
        const percentage = ((data.value as number) / total * 100).toFixed(1);
        
        const correctColor = data.payload?.color || data.color;
        
        return (
          <div className="bg-popover/95 backdrop-blur-sm p-4 border border-border/50 rounded-xl shadow-lg min-w-[180px]">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm" 
                  style={{ backgroundColor: correctColor }}
                />
                <span className="text-sm font-semibold text-popover-foreground">
                  {data.name}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">数量</span>
                  <span className="text-sm font-bold text-popover-foreground">
                    {(data.value as number).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground" >占比</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400" style={{ color: correctColor }}>
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

// 图表容器
function ChartContainer({ title, icon, iconBg = "bg-card", isLoading, children }: ChartContainerProps) {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <div className="tracking-tight text-lg font-semibold flex items-center gap-3 text-card-foreground">
          {icon && (
            <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shadow-md`}>
              {icon}
            </div>
          )}
          <div className="tracking-tight text-sm font-medium text-muted-foreground">{title}</div>
        </div>
      </div>
      <div className="p-6 pt-0 px-6 pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] space-y-3">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">数据加载中...</span>
          </div>
        ) : children}
      </div>
    </div>
  );
}

// 用户增长
export function UserGrowthChart({ data, isLoading, icon, range = 7 }: UserGrowthChartProps) {
  const chartData = useMemo(() => generateTimeRangeChartData(data, range), [data, range]);

  return (
    <ChartContainer title="用户增长趋势" icon={icon} iconBg="bg-card" isLoading={isLoading}>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={8}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={8}
              allowDecimals={false}
            />
            <Tooltip 
              content={<EnhancedTooltip labelFormatter={(label) => `日期: ${label}`} />}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.5 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#userGrowthGradient)"
              activeDot={{ 
                r: 6, 
                stroke: '#1e40af', 
                strokeWidth: 2, 
                fill: '#ffffff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

// 活动趋势
export function ActivityChart({ data, isLoading, icon, range = 7 }: ActivityChartProps) {
  const chartData = useMemo(() => generateTimeRangeChartData(data, range), [data, range]);

  return (
    <ChartContainer title="领取活动趋势" icon={icon} iconBg="bg-card" isLoading={isLoading}>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={8}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={8}
              allowDecimals={false}
            />
            <Tooltip 
              content={<EnhancedTooltip labelFormatter={(label) => `日期: ${label}`} />}
              cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.5 }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ 
                r: 6, 
                stroke: '#047857', 
                strokeWidth: 2, 
                fill: '#ffffff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

// 项目标签饼图
export function CategoryChart({ data, isLoading, icon }: CategoryChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : [];
  }, [data]);

  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <ChartContainer title="项目标签分布" icon={icon} iconBg="bg-card" isLoading={isLoading}>
        <div className="flex flex-col items-center justify-center h-[320px] space-y-3">
          <div className="text-6xl opacity-20">{icon}</div>
          <span className="text-sm text-muted-foreground">暂无标签数据</span>
        </div>
      </ChartContainer>
    );
  }
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0;
  const enhancedData = data?.map((item, index) => ({ 
    ...item, 
    total,
    color: ENHANCED_COLORS.pieChart[index % ENHANCED_COLORS.pieChart.length]
  }));

  return (
    <ChartContainer title="项目标签分布" icon={icon} iconBg="bg-card" isLoading={isLoading}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
            <Pie
              data={enhancedData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={100}
              innerRadius={45}
              paddingAngle={2}
              label={false} 
              animationDuration={2000}
              animationEasing="ease-out"
            >
              {enhancedData?.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={ENHANCED_COLORS.pieChart[index % ENHANCED_COLORS.pieChart.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    outline: 'none'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              layout="horizontal"
              iconSize={10}
              iconType="circle"
              wrapperStyle={{ 
                position: 'absolute',
                bottom: '22px',
                width: '100%',
                fontSize: '12px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'nowrap',
                gap: '16px',
                lineHeight: '1'
              }}
              formatter={(value: number) => (
                <span style={{ 
                  color: '#374151', 
                  fontWeight: '500', 
                  whiteSpace: 'nowrap',
                  lineHeight: '1',
                  verticalAlign: 'middle'
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


// 分发模式
export function DistributeModeChart({ data, isLoading, icon }: DistributeModeChartProps) {
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : [];
  }, [data]);

  if (!isLoading && (!chartData || chartData.length === 0)) {
    return (
      <ChartContainer title="分发模式统计" icon={icon} iconBg="bg-card" isLoading={isLoading}>
        <div className="flex flex-col items-center justify-center h-[320px] space-y-3">
          <div className="text-6xl opacity-20">{icon}</div>
          <span className="text-sm text-muted-foreground">暂无分发数据</span>
        </div>
      </ChartContainer>
    );
  }

  // 使用映射获取名称
  const enhancedData = chartData.map(item => ({
    ...item,
    name: DISTRIBUTION_MODE_NAMES[item.name] || item.name 
  }));

  return (
    <ChartContainer title="分发模式统计" icon={icon} iconBg="bg-card" isLoading={isLoading}>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enhancedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={8}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickMargin={8}
            />
            <Tooltip 
              content={<EnhancedTooltip labelFormatter={(label) => `模式: ${label}`} />}
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
            />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              maxBarSize={80}
              animationDuration={2000}
              animationEasing="ease-out"
            >
              {enhancedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={ENHANCED_COLORS.barChart[index % ENHANCED_COLORS.barChart.length]}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
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