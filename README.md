# Simple Connect Web Stack v2

A modern todo application demonstrating ConnectRPC (Protocol Buffers) architecture with Go backend and Deno Fresh frontend.

## Quick Start

```bash
# Start all services
deno task up

# Access the application
open http://localhost:8007
```

## Architecture

```
Frontend (Deno Fresh) → ConnectRPC → Backend (Go) → MySQL
   Port 8007              HTTP/JSON     Port 3007    Port 3307
```

### Technology Stack

- **Frontend**: Deno Fresh 2.0, Preact, ConnectRPC Web Client
- **Backend**: Go, ConnectRPC Server, MySQL Driver
- **Protocol**: Protocol Buffers via buf.build
- **Database**: MySQL 8.0
- **Development**: Docker Compose, Air (Go hot reload)

## Development

### Prerequisites

- Deno 2.3.6+
- Go 1.24+
- Docker & Docker Compose
- buf CLI (optional, for protobuf changes)

### Local Development

```bash
# Frontend development (with hot reload)
cd frontend && deno task dev

# Backend development (with Air hot reload)
cd backend && air

# Run integration tests
deno task test
```

### Docker Development

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Key Features

- **Type-safe RPC**: Full type safety from backend to frontend using Protocol Buffers
- **Real-time Updates**: Fresh's island architecture with Preact signals
- **Auto-generated Clients**: buf.build generates TypeScript and Go code
- **Hot Module Reload**: Both frontend and backend support hot reload
- **Production Ready**: Optimized Docker builds with pre-compiled assets

## Project Structure

```
simple-connect-web-stack/
├── frontend/               # Deno Fresh application
│   ├── routes/            # Pages and API proxy
│   ├── islands/           # Interactive components
│   ├── deno.json         # Deno configuration
│   └── Dockerfile        # Production build
├── backend/               # Go ConnectRPC server
│   ├── cmd/server/       # Main entry point
│   ├── internal/         # Business logic
│   └── Dockerfile        # Multi-stage build
├── proto/                # Protocol Buffer definitions
│   └── todo/v1/         
│       └── todo.proto    # Service definitions
├── buf.yaml              # Buf configuration
└── docker-compose.yml    # Service orchestration
```

## API Endpoints

All API calls use ConnectRPC protocol over HTTP/JSON:

- `POST /todo.v1.TodoService/CreateTask` - Create a new task
- `POST /todo.v1.TodoService/ListTasks` - List tasks with pagination
- `POST /todo.v1.TodoService/GetTask` - Get a specific task
- `POST /todo.v1.TodoService/UpdateTask` - Update task details
- `POST /todo.v1.TodoService/DeleteTask` - Delete a task
- `POST /todo.v1.TodoService/HealthCheck` - Service health check

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | Frontend: 8007, Backend: 3007 |
| `DATABASE_URL` | MySQL connection string | `root:root@tcp(localhost:3306)/todos` |
| `BACKEND_URL` | Backend URL for frontend proxy | `http://localhost:3007` |

### Port Configuration

- Frontend: `8007`
- Backend: `3007`
- Database: `3307`

## Testing

```bash
# Run all tests
deno task test

# Frontend tests only
cd frontend && deno test

# Backend tests only
cd backend && go test ./...

# Integration tests
deno task test:integration
```

## Troubleshooting

### Docker Build Issues

If you encounter npm registry errors, ensure:
1. The `.npmrc` file exists with: `@buf:registry=https://buf.build/gen/npm/v1/`
2. Run `deno task build` locally before Docker build
3. Check the [Docker buf.build solution guide](./docs/docker-buf-build-solution.md)

### Port Conflicts

If ports are already in use:
```bash
# Check what's using the ports
lsof -i :8007
lsof -i :3007
lsof -i :3307

# Update docker-compose.yml with different ports
```

### Fresh Build Errors

For "Not an ESM module" errors:
1. Ensure you're using Deno 2.3.6+
2. Run `deno task build` locally
3. The Docker image will use pre-built assets

## Migration from v1

**v1 → v2 Changes:**
- REST API → RPC with Protocol Buffers
- Rust/Axum → Go/ConnectRPC
- Same frontend architecture (Deno Fresh)
- Improved type safety with auto-generated clients

Previous version: [v1 Architecture](/v1) - Rust/Axum REST implementation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `deno task test`
5. Submit a pull request

## Additional Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant guidance
- [Docker buf.build Solution](./docs/docker-buf-build-solution.md) - Docker build troubleshooting

## License

MIT