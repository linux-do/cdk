# LINUX DO CDK

[中文版](/README.md)

🚀 Linux Do Community CDK (Content Distribution Kit) Rapid Sharing Platform

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

## 📖 Project Introduction

**LINUX DO CDK** is a content distribution toolkit built for the Linux Do community, aiming to provide fast, secure and convenient CDK sharing services. The platform supports multiple distribution methods and features a comprehensive user permission management and risk contorl mechanism.

### ✨ Key Features

- 🔐 **OAuth2 Authentication** - Integrated with the Linux Do community account system
- 🎯 **Multiple Distribution Modes** - Supports different CDK distribution strategies
- 🛡️ **Risk Control** - Comprehensive trust level and risk assessment system
- 📊 **Real-time Monitoring** - Detailed distribution statistics and user behavior analysis
- 🎨 **Modern Interface** - Responsive design based on Next.js 15 and React 19
- ⚡ **High Performance** - Go backend + Redis cache + MySQL database

## 🏗️ Architecture Overview

```text
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

## 🛠️ Tech Stack

### Backend

- **Go 1.24** - Primary development language
- **Gin** - Web framework
- **GORM** - ORM framework
- **Redis** - Caching and session storage
- **MySQL** - Main database
- **OpenTelemetry** - Observability
- **Swagger** - API documentation

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling framework
- **Shadcn UI** - Component library
- **Lucide Icons** - Icon library

## 📋 Prerequisites

- **Go** >= 1.24
- **Node.js** >= 18.0
- **MySQL** >= 8.0
- **Redis** >= 6.0
- **pnpm** >= 8.0 (Recommended)

## 🚀 Quick Start

### 1. Clone the Project

```bash
git clone https://github.com/linux-do/cdk.git
cd cdk
```

### 2. Configure Environment

Copy the config file and edit it:

```bash
cp config.example.yaml config.yaml
```

Edit the `config.yaml` file to configure database connection, Redis, OAuth2, etc.

### 3. Initialize database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE linux_do_cdk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations (executed automatically upon backend startup)
```

### 4. Start backend

```bash
# Install Go dependencies
go mod tidy

# Generate API docs
make swagger

# Start backend service
go run main.go api
```

### 5. Start Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 6. Access the Application

- **Frontend Interface**: <http://localhost:3000>
- **API Documentation**: <http://localhost:8000/swagger/index.html>
- **Health Check**: <http://localhost:8000/api/health>

## ⚙️ Configuration

### Main configuration Items

| Configuration Item | Description | Example |
|--------|------|------|
| `app.addr` | Backend service listen address | `:8000` |
| `oauth2.client_id` | OAuth2 Client ID | `your_client_id` |
| `database.host` | MySQL database address | `127.0.0.1` |
| `redis.host` | Redis server address | `127.0.0.1` |

Please refer to the `config.example.yaml` file for detailed configuration instructions.

## 🔧 Development Guide

### Backend Development

```bash
# Run API server
go run main.go api

# Run task scheduler
go run main.go scheduler

# Run worker queue
go run main.go worker

# Generate Swagger docs
make swagger

# Code formatting and checks
make tidy
```

### Frontend Development

```bash
cd frontend

# Development mode (using Turbopack)
pnpm dev

# Build for production
pnpm build

# Start production
pnpm start

# Code linting and formatting
pnpm lint
pnpm format
```

## 📚 API Documentation

API documentation is auto-generated via Swagger. Access it after starting the backend service:

```text
http://localhost:8000/swagger/index.html
```

### Main API Endpoints

- `GET /api/health` - Health Check
- `GET /api/oauth2/login` - OAuth2 login
- `GET /api/projects` - Get project list
- `POST /api/projects` - Create new project

## 🧪 Testing

```bash
# Backend tests
go test ./...

# Frontend tests
cd frontend
pnpm test
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t linux-do-cdk .

# Run container
docker run -d -p 8000:8000 linux-do-cdk
```

### Production Deployment

1. Build frontend assets.

   ```bash
   cd frontend && pnpm build
   ```

2. Compile backend binary.

   ```bash
   go build -o cdk main.go
   ```

3. Configure `config.yaml` for production environment.

4. Start the service.

   ```bash
   ./cdk api
   ```

## 🤝 Contributing

Welcome community contributions! Please read before submitting code:

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributor License Agreement](CLA.md)

### Submission Process

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a Pull Request

## 📄 License

This project is open source under the [MIT License](LICENSE).

## 🔗 Links

- [Linux Do Community](https://linux.do)
- [Issue Tracker](https://github.com/linux-do/cdk/issues)
- [Feature Requests](https://github.com/linux-do/cdk/issues/new?template=feature_request.md)

## ❤️ Acknowledgements

Thanks to all the developments who contributed to this project and the support for the Linux Do community!
