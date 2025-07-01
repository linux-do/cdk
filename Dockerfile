FROM golang:1.24-alpine AS builder

WORKDIR /app

# copy go mod files
COPY go.mod go.sum ./

# download dependencies
RUN go mod download

# copy source code
COPY . .

# build binary
RUN go build -v -o cdk-server main.go

# minimal runtime image
FROM alpine:latest

WORKDIR /app

# copy binary from builder
COPY --from=builder /app/cdk-server ./cdk-server
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/support-files ./support-files

EXPOSE 8000

# set entrypoint
ENTRYPOINT ["./cdk-server"]
