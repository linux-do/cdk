# 构建阶段
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache gcc musl-dev

# 复制go.mod和go.sum文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o cdk-platform ./cmd/server

# 运行阶段
FROM alpine:latest

# 设置时区
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# 创建非root用户
RUN adduser -D -g '' appuser

# 设置工作目录
WORKDIR /app

# 从builder阶段复制二进制文件
COPY --from=builder /app/cdk-platform /app/
COPY --from=builder /app/configs/config.example.yaml /app/configs/config.yaml

# 创建必要的目录并设置权限
RUN mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["/app/cdk-platform", "-config", "/app/configs/config.yaml"] 