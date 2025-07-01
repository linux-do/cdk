FROM alpine:latest

WORKDIR /app

# copy binary from builder
COPY cdk-server ./cdk-server
COPY docs ./docs
COPY support-files ./support-files

EXPOSE 8000

# set entrypoint
ENTRYPOINT ["./cdk-server"]
