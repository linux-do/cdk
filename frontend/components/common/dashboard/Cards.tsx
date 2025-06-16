import { ReactNode } from 'react';
import { UserActivityData, ApplyStatusData } from '@/lib/services/dashboard/types';


// 统计卡片组件
export interface StatCardProps {
  title: string;
  value?: number | string;
  icon: ReactNode;
  desc?: string;
  descColor?: string;
}

export function StatCard({ title, value, icon, desc, descColor }: StatCardProps) {
  return (
    <div className="text-card-foreground shadow bg-muted/50 rounded-lg shadow-inner border-0">
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
        <div className="tracking-tight text-sm font-medium text-muted-foreground">{title}</div>
        <div className="h-8 w-8 rounded-md bg-card flex items-center justify-center shadow-sm">{icon}</div>
      </div>
      <div className="p-6 pt-0 px-6 pb-6">
        <div className="text-2xl font-semibold text-foreground mb-1 tracking-tight">{value}</div>
        {desc && <div className={`flex items-center text-xs font-medium ${descColor}`}>{desc}</div>}
      </div>
    </div>
  );
}

// 卡片列表组件
export interface CardListProps {
  title: string;
  iconBg: string;
  icon: ReactNode;
  list: UserActivityData[];
  type: string;
}

export function CardList({ title, iconBg, icon, list, type }: CardListProps) {
  
  // 项目点击事件
  const handleProjectClick = async (item: any) => {
    if (type === 'project') {
      const { useRouter } = await import('next/navigation');
      const routerInstance = useRouter();
      const path = `/projects/${item.id || item.name}`;
      routerInstance.push(path);
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg shadow-inner">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <div className="tracking-tight text-lg font-semibold flex items-center gap-3 text-foreground">
          <div className={`h-8 w-8 rounded-md ${iconBg} flex items-center justify-center shadow-sm`}>
            {icon}
          </div>
          <div className="tracking-tight text-sm font-medium text-muted-foreground">
            {title}
          </div>
        </div>
      </div>
      <div className="p-6 pt-0 px-6 pb-6">
        <div className="space-y-3">
          {list?.map((item: any, idx: number) => (
            <div 
              key={item.name}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-accent/80 cursor-pointer`}                  
              onClick={type === 'project' ? () => handleProjectClick(item) : undefined}
              title={type === 'project' ? '查看项目详情' : undefined}
            >
              {/* 头像显示 */}
              {type === 'creator' || type === 'receiver' ? (
                <img 
                  src={item.avatar} 
                  alt={`${item.name} 的头像`} 
                  className="h-8 w-8 rounded-full border border-border flex-shrink-0" 
                />
              ) : (
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-card flex-shrink-0 shadow-sm`}>
                  <span className="text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate text-foreground ${
                  type === 'project' ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors' : ''
                }`}>
                  {item.name}
                </p>
                {type === 'project' && (
                  <p className="text-xs text-muted-foreground">
                    {item.tag}
                  </p>
                )}
                {type === 'creator' && (
                  <p className="text-xs text-muted-foreground">
                    {item.project_count} 个项目
                  </p>
                )}
                {type === 'receiver' && (
                  <p className="text-xs text-muted-foreground">
                    {item.receive_count} 次领取
                  </p>
                )}
              </div>
              <div 
                className={`inline-flex items-center rounded-md border border-border px-2.5 py-0.5 font-semibold text-xs flex-shrink-0 bg-muted ${
                  type === 'project' ? 'group-hover:border-blue-200 dark:group-hover:border-blue-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all' : ''
                }`}
                title={
                  type === 'project' ? `领取数: ${item.receive_count}` :
                  type === 'creator' ? `排名: ${idx + 1}` : 
                  type === 'receiver' ? `排名: ${idx + 1}` : ''
                }
              >
                {type === 'project' && item.receive_count}
                {type === 'creator' && idx + 1} 
                {type === 'receiver' && idx + 1}
              </div>
            </div>
          ))}
          
          {/* 空数据状态 */}
          {(!list || list.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




// 标签展示组件
export interface TagsDisplayProps {
  title: string;
  iconBg: string;
  tags?: {name: string; count: number}[];
  icon?: ReactNode;
}

export function TagsDisplay({ title, tags, icon, iconBg = "bg-card" }: TagsDisplayProps) {
  return (
    <div className="bg-muted/50 rounded-lg shadow-inner">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <div className="tracking-tight text-lg font-semibold flex items-center gap-3 text-foreground">
          {icon && (
            <div className={`h-8 w-8 rounded-md ${iconBg} flex items-center justify-center shadow-sm`}>
              {icon}
            </div>
          )}
          <div className="tracking-tight text-sm font-medium text-muted-foreground">{title}</div>
        </div>
      </div>
      <div className="p-6 pt-0 px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {tags && tags.length > 0 ? (
            tags.map((tag, idx) => (
              <span 
                key={`${tag.name}-${idx}`} 
                className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 font-semibold text-xs bg-card/50 hover:bg-accent transition-colors duration-200"
              >
                {tag.name}
                <span className="ml-1 text-muted-foreground">{tag.count}</span>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">暂无标签数据</span>
          )}
        </div>
      </div>
    </div>
  );
}

// 申请状态展示组件
export interface StatusDisplayProps {
  data?: ApplyStatusData;
  icon?: ReactNode;
  iconBg: string;
}

export function StatusDisplay({ data, icon, iconBg }: StatusDisplayProps) {
  return (
    <div className="bg-muted/50 rounded-lg shadow-inner mt-8">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <div className="tracking-tight text-lg font-semibold text-foreground flex items-center gap-3">
          {icon && (
            <div className={`h-8 w-8 rounded-md ${iconBg} flex items-center justify-center shadow-sm`}>
              {icon}
            </div>
          )}
          <div className="tracking-tight text-sm font-medium text-muted-foreground">申请状态统计</div>
        </div>
      </div>
      <div className="p-6 pt-0 px-6 pb-6">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="text-center space-y-2">
            <div className={`text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100`}>
              {data?.total || 0}
            </div>
            <p className="text-sm text-muted-foreground">总申请数</p>
          </div>
          <div className="text-center space-y-2">
            <div className={`text-2xl font-bold tracking-tight text-amber-600`}>
              {data?.pending || 0}
            </div>
            <p className="text-sm text-muted-foreground">待处理</p>
          </div>
          <div className="text-center space-y-2">
            <div className={`text-2xl font-bold tracking-tight text-emerald-600`}>
              {data?.approved || 0}
            </div>
            <p className="text-sm text-muted-foreground">已通过</p>
          </div>
          <div className="text-center space-y-2">
            <div className={`text-2xl font-bold tracking-tight text-red-600`}>
              {data?.rejected || 0}
            </div>
            <p className="text-sm text-muted-foreground">已拒绝</p>
          </div>
        </div>
      </div>
    </div>
  );
}


