FROM alpine:latest

WORKDIR /app

# set build arg for platform
ARG TARGETPLATFORM

# copy all binaries into image
COPY cdk-server-amd64 .
COPY cdk-server-arm64 .

# select binary according to platform
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then cp cdk-server-amd64 cdk-server; elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then cp cdk-server-arm64 cdk-server; fi

# copy docs and support files
COPY docs ./docs
COPY support-files ./support-files

EXPOSE 8000

# set entrypoint
ENTRYPOINT ["./cdk-server"]
