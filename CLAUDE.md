# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Simple Connect Web Stack v2 project.

## Repository Overview

Simple Connect Web Stack v2 is a modern todo application migrating from REST (v1) to RPC architecture using ConnectRPC. It maintains the same user experience while leveraging Protocol Buffers for type-safe client-server communication.

**Key Migration: v1 (Rust/Axum + REST) → v2 (Go/ConnectRPC + Protocol Buffers)**

## Essential Commands

### Development
```bash
# Start entire stack
deno task up

# Run frontend only
cd frontend && deno task dev

# Run backend only  
cd backend && go run ./cmd/server

# Generate code from protobuf
buf generate

# Hot reload development
deno task dev:all
```

### Protocol Buffer Management
```bash
# Generate Go server and TypeScript client code
buf generate

# Lint protobuf files
buf lint

# Check for breaking changes
buf breaking --against .git#branch=main

# Format protobuf files
buf format -w

# Push to Buf Schema Registry
buf push
```

### Testing
```bash
# Run all tests
deno task test

# Frontend tests
cd frontend && deno test

# Backend tests
cd backend && go test ./...

# Integration tests with Docker
deno task test:integration

# E2E tests
deno task test:e2e
```

## Architecture Overview

### Directory Structure
```
simple-connect-web-stack/
├── frontend/               # Deno Fresh 2.0 (unchanged architecture)
│   ├── routes/            # Pages and API proxy
│   ├── islands/           # Interactive components  
│   ├── components/        # Static components
│   └── deno.json         # Frontend tasks
├── backend/               # Go + ConnectRPC
│   ├── cmd/server/        # Main server entry
│   ├── internal/          # Business logic
│   │   ├── service/       # RPC service implementations
│   │   ├── db/           # Database operations
│   │   └── models/       # Domain models
│   ├── go.mod            # Go dependencies
│   └── buf.gen.yaml      # Backend code generation
├── proto/                 # Protocol Buffer definitions
│   └── todo/
│       └── v1/
│           └── todo.proto
├── buf.yaml              # Buf configuration
├── buf.gen.yaml          # Root code generation
└── docker-compose.yml    # Service orchestration
```

### Service Communication

```
┌─────────────────┐    ConnectRPC    ┌─────────────────┐    MySQL    ┌─────────────────┐
│   Frontend      │◄──────────────────►│    Backend      │◄───────────►│    Database     │
│  Fresh 2.0      │    (HTTP/JSON)     │   Go Server     │   (SQLx)    │    MySQL 8.0    │
│  Port 8000      │                    │   Port 3000     │             │    Port 3306    │
└─────────────────┘                    └─────────────────┘             └─────────────────┘
```

## Protocol Buffer Service Definition

### Core Service (`proto/todo/v1/todo.proto`)
```protobuf
syntax = "proto3";

package todo.v1;

import "google/protobuf/timestamp.proto";

service TodoService {
  rpc CreateTask(CreateTaskRequest) returns (CreateTaskResponse);
  rpc GetTask(GetTaskRequest) returns (GetTaskResponse);
  rpc ListTasks(ListTasksRequest) returns (ListTasksResponse);
  rpc UpdateTask(UpdateTaskRequest) returns (UpdateTaskResponse);
  rpc DeleteTask(DeleteTaskRequest) returns (DeleteTaskResponse);
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}

message Task {
  string id = 1;                              // UUID
  string title = 2;                           // Max 255 chars
  bool completed = 3;
  google.protobuf.Timestamp created_at = 4;
  google.protobuf.Timestamp updated_at = 5;
}

message ListTasksRequest {
  uint32 page = 1;                            // Default: 1
  uint32 page_size = 2;                       // Default: 20, Max: 100
  string query = 3;                           // Search in title
  string status_filter = 4;                   // "all", "completed", "pending"
  string sort_by = 5;                         // "created_at", "title", "updated_at"
  string sort_order = 6;                      // "asc", "desc"
}

message ListTasksResponse {
  repeated Task tasks = 1;
  PaginationMetadata pagination = 2;
}

message PaginationMetadata {
  uint32 page = 1;
  uint32 page_size = 2;
  uint32 total_pages = 3;
  uint32 total_items = 4;
  bool has_previous = 5;
  bool has_next = 6;
}
```

## Key Implementation Patterns

### Backend Service Implementation (Go)
```go
// internal/service/todo.go
type TodoService struct {
    db *sql.DB
}

func (s *TodoService) CreateTask(
    ctx context.Context,
    req *connect.Request[todov1.CreateTaskRequest],
) (*connect.Response[todov1.CreateTaskResponse], error) {
    // Validate title
    if req.Msg.Title == "" || len(req.Msg.Title) > 255 {
        return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("invalid title"))
    }
    
    // Generate UUID and insert
    task := &todov1.Task{
        Id:        uuid.NewString(),
        Title:     req.Msg.Title,
        Completed: false,
        CreatedAt: timestamppb.Now(),
        UpdatedAt: timestamppb.Now(),
    }
    
    // Database operation...
    
    return connect.NewResponse(&todov1.CreateTaskResponse{
        Task: task,
    }), nil
}
```

### Frontend RPC Client Integration
```typescript
// frontend/lib/api.ts
import { createPromiseClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "./gen/todo/v1/todo_connect";

const transport = createConnectTransport({
  baseUrl: "/api",  // Proxied through Fresh
});

export const todoClient = createPromiseClient(TodoService, transport);

// Usage in islands/TodoApp.tsx
async function createTask(title: string) {
  try {
    const response = await todoClient.createTask({ title });
    tasks.value = [...tasks.value, response.task];
  } catch (error) {
    if (error instanceof ConnectError) {
      console.error("RPC error:", error.message);
    }
  }
}
```

### API Proxy Route (Fresh)
```typescript
// frontend/routes/api/[...path].ts
export const handler: Handlers = {
  async fetch(req) {
    const url = new URL(req.url);
    const backendUrl = `http://backend:3000${url.pathname}${url.search}`;
    
    // Forward the request to backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    
    return response;
  },
};
```

## Development Workflow

### Initial Setup
```bash
# 1. Generate initial code
buf generate

# 2. Install dependencies
cd frontend && deno cache deps.ts
cd ../backend && go mod download

# 3. Start services
deno task up
```

### Adding New RPC Methods
1. Update `proto/todo/v1/todo.proto` with new method
2. Run `buf generate` to update code
3. Implement method in `backend/internal/service/todo.go`
4. Update frontend to use new method
5. Add tests for both backend and frontend

### Hot Reload Setup
```json
// deno.json
{
  "tasks": {
    "dev:all": "docker-compose up -d db && concurrently \"deno task dev:frontend\" \"deno task dev:backend\"",
    "dev:frontend": "cd frontend && deno task dev",
    "dev:backend": "cd backend && air", // Using cosmtrek/air for Go hot reload
  }
}
```

## Testing Strategies

### Backend Testing (Go)
```go
// internal/service/todo_test.go
func TestTodoService_CreateTask(t *testing.T) {
    // Use in-memory ConnectRPC test server
    server := httptest.NewServer(
        http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            connect.ServeHTTP(w, r, NewTodoService(testDB))
        }),
    )
    
    client := todov1connect.NewTodoServiceClient(
        http.DefaultClient,
        server.URL,
    )
    
    // Test cases...
}
```

### Frontend Testing
```typescript
// frontend/tests/api_test.ts
import { createMockClient } from "@connectrpc/connect-mock";
import { TodoService } from "../lib/gen/todo/v1/todo_connect.ts";

Deno.test("createTask adds task to list", async () => {
  const mockClient = createMockClient(TodoService, {
    createTask: { task: mockTask },
  });
  
  // Test component with mock client...
});
```

## Migration Guide (v1 REST → v2 RPC)

### Endpoint Mapping
| v1 REST                     | v2 RPC Method          | Notes                          |
|-----------------------------|------------------------|--------------------------------|
| `POST /tasks`               | `CreateTask`           | Returns created task           |
| `GET /tasks?page=1&q=...`   | `ListTasks`           | Pagination in request message  |
| `GET /tasks/{id}`           | `GetTask`             | ID in request message          |
| `PUT /tasks/{id}`           | `UpdateTask`          | Full task update               |
| `DELETE /tasks/{id}`        | `DeleteTask`          | Returns empty response         |
| `GET /health`               | `HealthCheck`         | Returns status message         |

### Frontend API Call Migration
```typescript
// v1 (REST)
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title })
});
const data = await response.json();

// v2 (ConnectRPC)
const response = await todoClient.createTask({ title });
const task = response.task;
```

## Performance Considerations

### Connection Pooling
- Backend maintains MySQL connection pool (max 25 connections)
- Frontend uses HTTP/2 multiplexing for RPC calls
- Consider implementing request coalescing for list operations

### Caching Strategy
- No caching in v2 (same as v1) - real-time data priority
- Browser automatically caches static assets from Fresh
- Consider adding ETags for list responses if needed

### Optimization Tips
- Use streaming for large task lists (future enhancement)
- Implement field masks for partial updates
- Consider pagination limits based on payload size

## Common Pitfalls & Solutions

### 1. CORS Issues
- Ensure Fresh proxy correctly forwards all headers
- ConnectRPC handles CORS automatically for Connect protocol

### 2. Type Mismatches
- Always regenerate code after proto changes
- Use `buf breaking` to catch incompatible changes

### 3. Database Timezone
- Store all timestamps as UTC
- Convert to user timezone in frontend only

### 4. Error Handling
- Use ConnectRPC error codes appropriately
- Map database errors to meaningful RPC errors

## Debugging Commands

```bash
# Test RPC endpoint directly
buf curl --schema proto --data '{"title": "Test task"}' http://localhost:3000/todo.v1.TodoService/CreateTask

# Check generated code
fd -e go -e ts generated

# Validate proto files
buf lint
buf breaking --against .git#branch=main

# View RPC logs
docker-compose logs -f backend
```

This project demonstrates a clean migration from REST to RPC while maintaining the simplicity and developer experience that made v1 successful.