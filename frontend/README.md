## Linux Do CDK

Linux Do 社区 CDK 快速分享平台
## 技术栈

### 核心框架
- **Next.js 15** - React 框架，支持服务端渲染和静态生成
- **React 19** - 用户界面构建库
- **TypeScript** - 静态类型检查

### UI 组件和样式
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **Shadcn UI** - 高质量的 UI 组件集合
- **Lucide Icons** - 简约美观的图标库
- **Noto Sans SC** - 中文字体


### 开发工具
- **ESLint** - 代码质量检查
- **TurboRepo** - 高性能构建系统

## 协作规范

### 文件夹结构
- `app/` - Next.js 应用程序路由和页面组件
- `components/` - React 组件
  - `components/common/` - 业务相关的通用组件
  - `components/ui/` - ShadcnUI 相关组件
  - `components/layout/` - 布局相关组件
- `lib/` - 工具函数和通用逻辑
- `public/` - 静态资源文件

### 组件规范
- 一般业务组件放入 `/components/common/`
- ShadcnUI相关组件统一放入 `/components/ui/`
- 布局组件放入 `/components/layout/`
- 组件使用 TypeScript 类型定义，保证类型安全

### 图标规范
- 对于常规的图标，我们使用 Lucide 库。
- 自定义图标应放置在 `/components/icons/` 目录下以命名导出形式管理

### 样式规范
- 优先使用 Tailwind CSS 原子类
- 复杂组件可以使用 CSS 变量和 Tailwind 的 @apply 指令
- 主题相关的颜色在 `globals.css` 中使用 CSS 变量定义

### 命名规范
- 文件名：使用 kebab-case 命名（如 `user-profile.tsx`）
- 组件名：使用 PascalCase 命名（如 `UserProfile`）
- 函数和变量：使用 camelCase 命名（如 `getUserData`）

## 开发

```bash
# 安装依赖
npm install

# 开发模式启动 (使用 Turbopack)
npm run dev

# 构建生产版本
npm run build

# 启动生产服务
npm run start

```

