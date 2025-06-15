# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the v2 implementation of simple-web-stack, migrating from a Rust/Axum backend to Go/ConnectRPC while maintaining the same Deno Fresh frontend. The project demonstrates a modern todo list application built with:

- **Frontend**: Deno Fresh 2.0 + Preact (Islands architecture)
- **Backend**: Go + ConnectRPC (replacing Rust + Axum from v1)
- **Database**: MySQL 8.0
- **Protocol**: Protocol Buffers with Buf Schema Registry

## Essential Commands

### Development Setup
```bash
# Initialize Go module
go mod init github.com/wcygan/simple-connect-web-stack

# Install ConnectRPC and Buf tools
go install github.com/bufbuild/buf/cmd/buf@latest
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest

# Generate code from proto files
buf generate

# Run the full stack
docker-compose up
```

### Backend Development
```bash
# Run Go backend
go run ./cmd/server

# Run tests
go test ./...

# Run specific test
go test -run TestName ./...

# Generate proto code
buf generate

# Lint proto files
buf lint

# Format Go code
go fmt ./...
```

### Frontend Development
```bash
# Run frontend dev server
cd frontend
deno task dev

# Run frontend tests
deno task test

# Format and lint
deno fmt
deno lint
```

## Architecture Overview

### Migration from v1 to v2

The project is migrating from:
- **v1**: Rust + Axum backend → **v2**: Go + ConnectRPC backend
- Same frontend (Deno Fresh 2.0)
- Same database (MySQL 8.0)
- Same core features and UI

### ConnectRPC Service Architecture

```
Frontend (Port 8000)          Backend (Port 3000)
    │                              │
    ├─[HTTP/JSON]─────────────────►│
    │                              │
    │  /api/tasks/*               │  ConnectRPC Services
    │  (Fresh API Routes)         │  ├── TaskService
    │                             │  │   ├── CreateTask
    │                             │  │   ├── GetTask
    │                             │  │   ├── ListTasks
    │                             │  │   ├── UpdateTask
    │                             │  │   └── DeleteTask
    │                             │  └── HealthService
    │                             │      └── Check
    │                             │
    └─────────────────────────────┴──────► MySQL (Port 3306)
```

### Protocol Buffer Definitions

Services will be defined in `proto/` directory:
```protobuf
service TaskService {
  rpc CreateTask(CreateTaskRequest) returns (CreateTaskResponse);
  rpc GetTask(GetTaskRequest) returns (GetTaskResponse);
  rpc ListTasks(ListTasksRequest) returns (ListTasksResponse);
  rpc UpdateTask(UpdateTaskRequest) returns (UpdateTaskResponse);
  rpc DeleteTask(DeleteTaskRequest) returns (DeleteTaskResponse);
}
```

### Key Implementation Details

**ConnectRPC Benefits**:
- Type-safe client/server code generation
- Support for Connect, gRPC, and gRPC-Web protocols
- Works with standard HTTP clients (curl, fetch)
- Built-in JSON support for easy debugging

**Frontend Integration**:
- Fresh API routes proxy to ConnectRPC backend
- Can use either JSON (Connect protocol) or binary (gRPC)
- Maintains same reactive Preact Signals architecture

**Database Layer**:
- Use `database/sql` with MySQL driver
- Consider `sqlc` for type-safe SQL queries (similar to SQLx in Rust)
- Maintain same schema as v1

## Core Features to Implement

1. **No Authentication** - Public todo list (same as v1)
2. **Full CRUD Operations** - Create, read, update, delete tasks
3. **Search & Filtering** - By title and completion status
4. **Pagination** - Efficient handling of large task lists
5. **Real-time Updates** - Via Preact Signals (frontend)

## Testing Strategy

### Backend Testing
```bash
# Unit tests
go test ./internal/...

# Integration tests with test database
go test ./tests/integration/... -tags=integration

# Benchmark tests
go test -bench=. ./...

# Coverage report
go test -cover ./...
```

### Frontend Testing
```bash
# Component tests
deno test frontend/tests/

# Run specific test
deno test --filter "TodoApp"
```

## Development Workflow

1. **Proto-First Development**:
   - Define service contracts in `.proto` files
   - Generate server/client code with `buf generate`
   - Implement server handlers
   - Update frontend API calls

2. **Type Safety**:
   - ConnectRPC generates type-safe Go structs
   - Frontend maintains TypeScript types
   - Validate at compile time

3. **Local Development**:
   - Backend runs on port 3000
   - Frontend runs on port 8000
   - MySQL runs on port 3306
   - All services in Docker Compose for consistency

## Project Structure (Expected)

```
simple-connect-web-stack/
├── proto/                 # Protocol Buffer definitions
│   └── task/
│       └── v1/
│           └── task.proto
├── cmd/
│   └── server/           # Go server entrypoint
├── internal/             # Go internal packages
│   ├── gen/             # Generated ConnectRPC code
│   ├── service/         # Service implementations
│   └── db/              # Database layer
├── frontend/            # Deno Fresh frontend (from v1)
├── docker-compose.yml   # Full stack orchestration
├── buf.yaml            # Buf configuration
└── buf.gen.yaml        # Code generation config
```

## Key Differences from v1

- **RPC vs REST**: ConnectRPC provides RPC semantics over HTTP
- **Code Generation**: Proto files generate both server and client code
- **Error Handling**: ConnectRPC has built-in error codes and details
- **Streaming**: Support for server/client/bidirectional streaming (if needed)

## Common ConnectRPC Patterns

### Server Implementation
```go
func (s *taskServer) CreateTask(
    ctx context.Context,
    req *connect.Request[taskv1.CreateTaskRequest],
) (*connect.Response[taskv1.CreateTaskResponse], error) {
    // Implementation
}
```

### Client Usage (from frontend or curl)
```bash
# Using curl with JSON
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"title": "New task"}' \
  http://localhost:3000/task.v1.TaskService/CreateTask
```