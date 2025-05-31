# Linux Do CDK - Server

## 项目概述
CDK分发平台是一个高性能的Web应用，用于管理和分发Cloud Development Kit (CDK)资源。平台提供安全可靠的CDK密钥管理、分发追踪和使用统计分析等功能，支持大规模并发请求处理，适用于企业级部署环境。

## 核心功能
- CDK密钥生成与管理
- 用户权限与访问控制
- 实时CDK分发与激活
- 使用数据统计与分析
- API接口支持第三方系统集成
- 多级缓存策略优化响应速度

## 技术架构

### 技术栈
- **后端语言**: Go 1.24
- **数据存储**: MySQL 8.0+
- **缓存系统**: Redis 7.0+
- **Web框架**: Gin
- **ORM框架**: GORM
- **API文档**: Swagger
- **容器化**: Docker & Kubernetes
- **CI/CD**: GitHub Actions

### 架构设计
#### 高可用设计
- **多实例部署**: 支持水平扩展的无状态服务设计
- **负载均衡**: 通过Nginx实现请求分发
- **数据库高可用**: MySQL主从复制与读写分离
- **Redis集群**: 哨兵模式或Redis Cluster保障缓存高可用
- **故障自动恢复**: 健康检查与自动重启机制
- **降级策略**: 核心功能降级保护措施

#### 可扩展设计
- **模块化架构**: 核心功能模块解耦，便于扩展
- **微服务就绪**: 预留服务拆分接口，支持未来微服务化
- **消息队列集成**: 基于消息队列的异步处理机制
- **可配置的缓存策略**: 多级缓存与缓存穿透保护
- **插件化设计**: 支持功能扩展插件

#### 系统架构图
```
                                ┌─────────────────┐
                                │   负载均衡层     │
                                │    (Nginx) 
                                └────────┬────────┘
                                         │
                  ┌────────────┬─────────┴───────────┬───────────────┐
                  │            │                     │               │
          ┌───────┴─────┐ ┌────┴─────┐        ┌─────┴─────┐  ┌──────┴─────┐
          │  API服务 #1  │ │ API服务 #2│        │ API服务 #3 │  │  API服务 #n │
          │  (Go实例)   │ │ (Go实例)  │        │ (Go实例)   │  │  (Go实例)  │
          └───────┬─────┘ └────┬─────┘        └─────┬─────┘  └──────┬─────┘
                  │            │                     │               │
                  └────────────┼─────────────────────┼───────────────┘
                               │                     │
               ┌──────────────┐│                     │┌─────────────────┐
               │              ││                     ││                 │
         ┌─────┴─────┐  ┌─────┴┴─────┐         ┌────┴┴────┐    ┌───────┴───────┐
         │ Redis集群  │  │  MySQL集群  │         │ 对象存储  │    │  监控与日志   │
         │           │  │            │         │          │    │              │
         └───────────┘  └────────────┘         └──────────┘    └──────────────┘
```

## 项目结构
```
CDK-Demo/
├── frontend/          # 前端应用
│   └── README.md      # 前端项目说明
├── server/            # 后端服务
│   ├── cmd/           # 命令行入口
│   │   └── server/    # API服务器入口
│   ├── configs/       # 配置文件
│   ├── internal/      # 内部包
│   │   ├── controller/# API控制器
│   │   ├── logic/     # 业务逻辑层
│   │   ├── model/     # 数据模型
│   │   ├── plugin/    # 插件目录
│   │   │   ├── common/# 通用插件
│   │   │   │   └── utils/  # 工具函数
│   │   │   ├── db/    # 数据库相关
│   │   │   └── middleware/ # HTTP中间件
│   │   ├── repository/# 数据访问层
│   │   └── router/    # 路由注册
│   ├── pkg/           # 可重用的公共包
│   ├── scripts/       # 部署和维护脚本
│   ├── test/          # 测试文件
│   ├── Dockerfile     # Docker构建文件
│   ├── docker-compose.yml # Docker Compose配置
│   ├── go.mod         # Go模块定义
│   ├── go.sum         # Go依赖校验文件
│   └── README.md      # 后端项目说明文档
└── .gitignore         # Git忽略文件
```

## 快速开始

### 环境要求
- Go 1.24+
- MySQL 8.0+
- Redis 7.0+
- Docker & Docker Compose (可选)

## 部署指南

### Docker部署
```bash
docker build -t cdk-platform:latest .
docker run -d -p 8080:8080 --name cdk-platform cdk-platform:latest
```

### Kubernetes部署
```bash
kubectl apply -f deploy/kubernetes/
```

## 性能优化

- 使用连接池管理数据库和Redis连接
- 多级缓存策略减轻数据库压力
- 批处理操作提高吞吐量
- 异步处理非关键路径请求
- 资源复用减少GC压力

## 监控与日志

- Prometheus metrics收集
- Grafana可视化监控
- 结构化日志输出(JSON格式)
- 分布式追踪支持

## 开发指南

### 项目结构说明
- **cmd/server/**: 包含应用程序的入口点，负责初始化和启动服务
- **configs/**: 包含应用配置文件
- **internal/**: 包含项目内部包，不对外暴露
  - **controller/**: 控制器层，处理HTTP请求
  - **logic/**: 业务逻辑层，实现核心业务功能
  - **model/**: 数据模型定义
  - **plugin/**: 插件目录
    - **common/utils/**: 通用工具函数和辅助方法
    - **db/**: 数据库操作相关功能
    - **middleware/**: HTTP中间件，如认证、CORS等
  - **repository/**: 数据访问层，负责与数据库交互
  - **router/**: 路由注册和配置
- **pkg/**: 可被外部项目导入的公共包
- **scripts/**: 部署和维护脚本

### 添加新API
1. 在internal/model中定义数据模型
2. 在internal/repository中实现数据访问
3. 在internal/logic中实现业务逻辑
4. 在internal/controller中添加控制器
5. 在internal/router中注册路由

### 数据库操作
项目使用GORM作为ORM框架，示例：
```go
// 创建记录
db.Create(&model.CDK{
    Code: "CDK123456",
    Type: "standard",
    Status: "unused",
})

// 查询记录
var cdk model.CDK
db.Where("code = ?", "CDK123456").First(&cdk)

// 更新记录
db.Model(&cdk).Update("status", "used")
```

### 缓存操作
项目使用Redis作为缓存，示例：
```go
// 设置缓存
utils.SetCache("key", "value", 3600*time.Second)

// 获取缓存
value, err := utils.GetCache("key")
```

### 测试
```bash
# 运行单元测试
go test ./...

# 运行集成测试
go test -tags=integration ./...
```

## 开源协议
MIT

## 贡献指南
欢迎提交Issue和Pull Request，共同改进项目。