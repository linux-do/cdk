FROM golang:1.24-alpine

# 设置时区为东八区的北京时间
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64 \
    GOPROXY=https://goproxy.cn,direct

WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

COPY main.go .
COPY internal/ ./internal/
COPY docs/ ./docs/

RUN go build -o cdk-server main.go

EXPOSE 8000

VOLUME ["/app/config.yaml"]

# 设置容器启动命令
ENTRYPOINT ["./cdk-server"]
CMD ["api"]
