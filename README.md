# Simple Connect Web Stack

A modern todo application demonstrating ConnectRPC implementation with Go backend and Deno Fresh frontend, featuring Protocol Buffers for type-safe communication.

[![Go Version](https://img.shields.io/badge/Go-1.24-blue)](https://golang.org/)
[![Deno Version](https://img.shields.io/badge/Deno-2.3.6-blue)](https://deno.land/)
[![ConnectRPC](https://img.shields.io/badge/ConnectRPC-1.18.1-green)](https://connectrpc.com/)
[![Fresh](https://img.shields.io/badge/Fresh-2.0-orange)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/wcygan/simple-connect-web-stack.git
cd simple-connect-web-stack

# Start the application
deno task up

# Open in browser
deno task open

# Health check
deno task health
```

The application will be available at:
- **Frontend**: http://localhost:8007
- **Backend API**: http://localhost:3007
- **Database**: localhost:3307

## 🏗️ Architecture

```
┌─────────────────┐    ConnectRPC     ┌─────────────────┐    MySQL     ┌─────────────────┐
│   Frontend      │◄──────────────────►│    Backend      │◄─────────────►│    Database     │
│  Deno Fresh     │    (HTTP/JSON)     │   Go Server     │   (SQLx)     │    MySQL 8.0    │
│  Port 8007      │                    │   Port 3007     │              │    Port 3307    │
└─────────────────┘                    └─────────────────┘              └─────────────────┘
```

### Technology Stack

**Backend:**
- **Go 1.24**: High-performance server runtime
- **ConnectRPC**: Type-safe RPC communication
- **Protocol Buffers**: Schema-first API definition
- **MySQL 8.0**: Relational database with full-text search
- **Docker**: Containerized deployment

**Frontend:**
- **Deno 2.3.6**: Modern JavaScript runtime
- **Fresh 2.0**: Server-side rendering framework
- **Preact**: Lightweight React alternative
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe frontend development

**Development:**
- **Buf**: Protocol Buffer toolchain
- **Air**: Go hot reload
- **Docker Compose**: Multi-service orchestration

## 📋 API Documentation

### ConnectRPC Services

The application uses [ConnectRPC](https://connectrpc.com/) for type-safe communication between frontend and backend.

#### TodoService

**Base URL**: `http://localhost:3007/todo.v1.TodoService`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `CreateTask` | `/CreateTask` | Create a new todo task |
| `GetTask` | `/GetTask` | Get a specific task by ID |
| `ListTasks` | `/ListTasks` | List tasks with pagination and filtering |
| `UpdateTask` | `/UpdateTask` | Update an existing task |
| `DeleteTask` | `/DeleteTask` | Delete a task by ID |
| `HealthCheck` | `/HealthCheck` | Service health status |

#### Example Usage

**Create a Task:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/CreateTask \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn ConnectRPC"}'
```

**List Tasks with Pagination:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/ListTasks \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 10, "status": "STATUS_FILTER_ALL"}'
```

### Task Model

```protobuf
message Task {
  string id = 1;                               // UUID v4
  string title = 2;                            // Task title (max 255 chars)
  bool completed = 3;                          // Completion status
  google.protobuf.Timestamp created_at = 4;    // Creation timestamp
  google.protobuf.Timestamp updated_at = 5;    // Last update timestamp
}
```

## 🛠️ Development

### Prerequisites

- **Deno 2.3.6+**: [Install Deno](https://deno.land/manual/getting_started/installation)
- **Go 1.24+**: [Install Go](https://golang.org/doc/install)
- **Docker & Docker Compose**: [Install Docker](https://docs.docker.com/get-docker/)
- **Buf CLI**: [Install Buf](https://docs.buf.build/installation)

### Project Setup

```bash
# Initialize the project
deno task init

# Generate Protocol Buffer code
deno task proto:generate

# Start development environment
deno task dev
```

### Development Commands

| Command | Description |
|---------|-------------|
| `deno task dev` | Start development with hot reload |
| `deno task dev:frontend` | Start only frontend development server |
| `deno task dev:backend` | Start only backend with hot reload |
| `deno task open` | Open frontend in browser (checks service health) |
| `deno task proto:generate` | Generate code from Protocol Buffers |
| `deno task proto:lint` | Lint Protocol Buffer files |
| `deno task health` | Run comprehensive health checks |

### Hot Reload

Both frontend and backend support hot reload during development:

- **Frontend**: Automatic reload on file changes in `routes/`, `islands/`, `components/`
- **Backend**: Air provides hot reload for Go code changes
- **Protocol Buffers**: Re-generate code with `deno task proto:generate`

## 🧪 Testing

The project includes comprehensive testing infrastructure with Docker-based isolation.

### Test Commands

```bash
# Run all tests
deno task test

# Run specific test suites
deno task test:unit           # Unit tests (both frontend and backend)
deno task test:integration    # Integration tests with real services
deno task test:e2e           # End-to-end browser tests

# Test with coverage
deno task test:coverage

# Watch mode for development
deno task test:watch
```

### Test Environment

- **Isolated Database**: Separate MySQL instance for testing
- **Test Fixtures**: Pre-populated test data
- **TestContainers**: Ephemeral database containers
- **Playwright**: Browser automation for E2E tests

### Coverage Targets

- **Backend**: 95%+ test coverage with comprehensive unit tests
- **Frontend**: Component and integration testing with Fresh testing utilities
- **Integration**: Full API workflow testing with real database

## 🚀 Deployment

### Production Deployment

```bash
# Build and deploy all services
deno task deploy

# Quick production start
deno task up:build

# Complete rebuild and deployment
deno task restart:rebuild
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=secure_root_password
MYSQL_DATABASE=todos
MYSQL_USER=taskuser
MYSQL_PASSWORD=secure_password

# Application Configuration
DATABASE_URL=taskuser:secure_password@tcp(mysql:3306)/todos?parseTime=true
BACKEND_URL=http://backend:3007
GO_ENV=production
DENO_ENV=production
```

### Docker Compose Services

- **mysql**: MySQL 8.0 database with health checks
- **backend**: Go ConnectRPC server with optimized build
- **frontend**: Deno Fresh SSR application

### Health Monitoring

```bash
# Check all services
deno task health

# Monitor resource usage
deno task monitor

# View service status
deno task status
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `root` | Yes |
| `MYSQL_DATABASE` | Database name | `todos` | Yes |
| `MYSQL_USER` | Database user | `taskuser` | Yes |
| `MYSQL_PASSWORD` | Database password | `taskpassword` | Yes |
| `DATABASE_URL` | Go MySQL connection string | - | Yes |
| `BACKEND_URL` | Frontend → Backend URL | `http://backend:3007` | Yes |
| `GO_ENV` | Go environment mode | `development` | No |
| `DENO_ENV` | Deno environment mode | `development` | No |
| `PORT` | Frontend port | `8007` | No |

### Protocol Buffer Configuration

The project uses [Buf Schema Registry](https://buf.build/) for Protocol Buffer management:

- **Schema**: [buf.build/wcygan/simple-connect-web-stack](https://buf.build/wcygan/simple-connect-web-stack)
- **Generated Packages**: Available on buf.build npm registry
- **Breaking Change Detection**: Automated with `buf breaking`

## 📚 Project Structure

```
simple-connect-web-stack/
├── frontend/                 # Deno Fresh frontend
│   ├── routes/              # API routes and pages
│   ├── islands/             # Interactive components
│   ├── static/              # Static assets
│   └── deno.json           # Frontend configuration
├── backend/                 # Go ConnectRPC backend
│   ├── cmd/server/         # Server entry point
│   ├── internal/           # Business logic
│   │   ├── service/        # RPC service implementations
│   │   ├── db/            # Database operations
│   │   └── models/        # Domain models
│   └── go.mod             # Go dependencies
├── proto/                   # Protocol Buffer definitions
│   └── todo/v1/
│       └── todo.proto      # Todo service definition
├── scripts/                # Automation scripts
├── tests/                  # Test configurations and fixtures
├── docker-compose.yml      # Production services
├── docker-compose.test.yml # Testing environment
└── deno.jsonc             # Project task automation
```

## 🔄 Migration from v1

This is version 2 of the Simple Web Stack, migrated from REST to ConnectRPC:

### Key Changes

| v1 (REST) | v2 (ConnectRPC) | Benefits |
|-----------|-----------------|----------|
| Express.js + JSON APIs | Fresh + ConnectRPC | Type safety, better performance |
| OpenAPI documentation | Protocol Buffer schemas | Code generation, versioning |
| Manual client code | Generated TypeScript/Go clients | Consistency, less boilerplate |
| Runtime validation | Compile-time type checking | Fewer runtime errors |

### Migration Guide

1. **API Endpoints**: REST endpoints mapped to RPC methods
2. **Type Safety**: All request/response types generated from protobuf
3. **Client Integration**: Use generated clients instead of fetch calls
4. **Error Handling**: ConnectRPC standardized error codes

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Generate** Protocol Buffers: `deno task proto:generate`
4. **Test** your changes: `deno task test`
5. **Commit** with conventional commits: `git commit -m 'feat: add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Create** a Pull Request

### Code Style

- **Go**: Use `gofmt` and follow standard Go conventions
- **TypeScript**: Follow Deno style guide with `deno fmt`
- **Protocol Buffers**: Use `buf format` for consistent formatting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **ConnectRPC Documentation**: https://connectrpc.com/docs/
- **Deno Fresh Documentation**: https://fresh.deno.dev/docs/
- **Protocol Buffers**: https://developers.google.com/protocol-buffers
- **Buf Schema Registry**: https://buf.build/