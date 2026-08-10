# LINUX DO CDK

🚀 Linux Do 社区 CDK (Content Distribution Kit) 快速分享平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.24-blue.svg)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)

[![GitHub release](https://img.shields.io/github/v/release/linux-do/cdk?include_prereleases)](https://github.com/linux-do/cdk/releases)
[![GitHub stars](https://img.shields.io/github/stars/linux-do/cdk)](https://github.com/linux-do/cdk/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/linux-do/cdk)](https://github.com/linux-do/cdk/network)
[![GitHub issues](https://img.shields.io/github/issues/linux-do/cdk)](https://github.com/linux-do/cdk/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/linux-do/cdk)](https://github.com/linux-do/cdk/pulls)
[![GitHub contributors](https://img.shields.io/github/contributors/linux-do/cdk)](https://github.com/linux-do/cdk/graphs/contributors)

[![Backend Build](https://github.com/linux-do/cdk/actions/workflows/build_backend.yml/badge.svg)](https://github.com/linux-do/cdk/actions/workflows/build_backend.yml)
[![Frontend Build](https://github.com/linux-do/cdk/actions/workflows/build_frontend.yml/badge.svg)](https://github.com/linux-do/cdk/actions/workflows/build_frontend.yml)
[![Docker Build](https://github.com/linux-do/cdk/actions/workflows/build_image.yml/badge.svg)](https://github.com/linux-do/cdk/actions/workflows/build_image.yml)
[![CodeQL](https://github.com/linux-do/cdk/actions/workflows/codeql.yml/badge.svg)](https://github.com/linux-do/cdk/actions/workflows/codeql.yml)
[![ESLint](https://github.com/linux-do/cdk/actions/workflows/eslint.yml/badge.svg)](https://github.com/linux-do/cdk/actions/workflows/eslint.yml)

## 📖 项目简介

LINUX DO CDK 是一个为 Linux Do 社区打造的内容分发工具平台，旨在提供快速、安全、便捷的 CDK 分享服务。平台支持多种分发方式，具备完善的用户权限管理和风险控制机制。

### ✨ 主要特性

- 🔐 **OAuth2 认证** - 集成 Linux Do 社区账号系统
- 🎯 **多种分发模式** - 支持不同的 CDK 分发策略
- 🛡️ **风险控制** - 完善的信任等级和风险评估系统
- 📊 **实时监控** - 详细的分发统计和用户行为分析
- 🎨 **现代化界面** - 基于 Next.js 15 和 React 19 的响应式设计
- ⚡ **高性能** - Go 后端 + Redis 缓存 + MySQL 数据库

## 🏗️ 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│     (Go)        │◄──►│  (MySQL/Redis)  │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Gin Framework │    │ • MySQL         │
│ • TypeScript    │    │ • OAuth2        │    │ • Redis Cache   │
│ • Tailwind CSS  │    │ • OpenTelemetry │    │ • Session Store │
│ • Shadcn UI     │    │ • Swagger API   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ 技术栈

### 后端
- **[Go 1.24](https://go.dev/doc)** - 主要开发语言
- **[Gin](https://github.com/gin-gonic/gin)** - Web 框架
- **[GORM](https://github.com/go-gorm/gorm)** - ORM 框架
- **[Redis](https://github.com/redis/redis)** - 缓存和会话存储
- **[MySQL](https://www.mysql.com)** - 主数据库
- **[OpenTelemetry](https://opentelemetry.io)** - 可观测性
- **[Swagger](https://github.com/swaggo/swag)** - API 文档

### 前端
- **[Next.js 15](https://github.com/vercel/next.js)** - React 框架
- **[React 19](https://github.com/facebook/react)** - UI 库
- **[TypeScript](https://github.com/microsoft/TypeScript)** - 类型安全
- **[Tailwind CSS 4](https://github.com/tailwindlabs/tailwindcss)** - 样式框架
- **[Shadcn UI](https://github.com/shadcn-ui/ui)** - 组件库
- **[Lucide Icons](https://github.com/lucide-icons/lucide)** - 图标库

## 📋 环境要求

- **Go** >= 1.24
- **Node.js** >= 18.0
- **MySQL** >= 8.0
- **Redis** >= 6.0
- **pnpm** >= 8.0 (推荐)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/linux-do/cdk.git
cd cdk
```

### 2. 配置环境

复制配置文件并编辑：

```bash
cp config.example.yaml config.yaml
```

编辑 `config.yaml` 文件，配置数据库连接、Redis、OAuth2 等信息。

### 3. 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE linux_do_cdk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行迁移（启动后端时会自动执行）
```

### 4. 启动后端

```bash
# 安装 Go 依赖
go mod tidy

# 生成 API 文档
make swagger

# 启动后端服务
go run main.go api
```

### 5. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 6. 访问应用

- **前端界面**: http://localhost:3000
- **API 文档**: http://localhost:8000/swagger/index.html
- **健康检查**: http://localhost:8000/api/v1/health
- **就绪检查**: http://localhost:8000/api/v1/ready

## ⚙️ 配置说明

### 主要配置项

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `app.addr` | 后端服务监听地址 | `:8000` |
| `worker.port` | Worker 探针端口 | `8001` |
| `schedule.port` | Beat/Scheduler 探针端口 | `8002` |
| `oauth2.client_id` | OAuth2 客户端 ID | `your_client_id` |
| `database.host` | MySQL 数据库地址 | `127.0.0.1` |
| `redis.host` | Redis 服务器地址 | `127.0.0.1` |

详细配置说明请参考 `config.example.yaml` 文件。

## 🔧 开发指南

### 后端开发

```bash
# 运行 API 服务器
go run main.go api

# 运行任务调度器
go run main.go scheduler

# 运行工作队列
go run main.go worker

# 生成 Swagger 文档
make swagger

# 代码格式化和检查
make tidy
```

### 前端开发

```bash
cd frontend

# 开发模式（使用 Turbopack）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务
pnpm start

# 代码检查和格式化
pnpm lint
pnpm format
```

## 📚 API 文档

API 文档通过 Swagger 自动生成，启动后端服务后可访问：

```
http://localhost:8000/swagger/index.html
```

### 主要 API 端点

- `GET /api/v1/health` - 健康检查
- `GET /api/v1/ready` - 就绪检查
- `GET /api/oauth2/login` - OAuth2 登录
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建新项目

## 🧪 测试

```bash
# 后端测试
go test ./...

# 前端测试
cd frontend
pnpm test
```

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker build -t linux-do-cdk .

# 运行容器
docker run -d -p 8000:8000 linux-do-cdk
```

### 生产环境部署

1. 构建前端资源：
   ```bash
   cd frontend && pnpm build
   ```

2. 编译后端程序：
   ```bash
   go build -o cdk main.go
   ```

3. 配置生产环境的 `config.yaml`

4. 启动服务：
   ```bash
   ./cdk api
   ```

## 🤝 贡献指南

我们欢迎社区贡献！请在提交代码前阅读：

- [贡献指南](CONTRIBUTING.md)
- [行为准则](CODE_OF_CONDUCT.md)
- [贡献者许可协议](CLA.md)

### 提交流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add your feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🔗 相关链接

- [Linux Do 社区](https://linux.do)
- [问题反馈](https://github.com/linux-do/cdk/issues)
- [功能请求](https://github.com/linux-do/cdk/issues/new?template=feature_request.md)

## ❤️ 致谢

感谢所有为本项目做出贡献的开发者和 Linux Do 社区的支持！

## 📈 项目趋势

[![Star History Chart](https://star-history.dera.page/svg?repos=linux-do/cdk&type=Date)](https://star-history.dera.page/#linux-do/cdk&Date)
