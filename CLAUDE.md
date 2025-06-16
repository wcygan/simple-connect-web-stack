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
│  Port 8007      │                    │   Port 3007     │             │    Port 3307    │
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
// frontend/islands/TodoApp.tsx
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import type { Task } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";

const transport = createConnectTransport({
  baseUrl: "/api",  // Proxied through Fresh
});

const client = createClient(TodoService, transport);

// Usage in component
async function createTask(title: string) {
  try {
    const response = await client.createTask({ title });
    tasks.value = [...tasks.value, response.task!];
  } catch (error) {
    console.error("Failed to create task:", error);
  }
}
```

### API Proxy Route (Fresh)
```typescript
// frontend/routes/api/[...path].ts
export const handler: Handlers = {
  async fetch(req) {
    const url = new URL(req.url);
    const backendUrl = `${Deno.env.get("BACKEND_URL") || "http://localhost:3007"}${url.pathname.replace('/api', '')}${url.search}`;
    
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
# 1. Generate initial code (optional - we use buf.build packages)
buf generate

# 2. Install dependencies
cd frontend && deno cache --node-modules-dir main.ts
cd ../backend && go mod download

# 3. Build frontend for production
cd frontend && deno task build

# 4. Start services
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

## Docker Build with buf.build Packages

### Problem
Docker builds fail when trying to access buf.build npm packages during `deno cache` due to registry authentication issues, even though the packages are public.

### Solution: Pre-built Assets Approach

1. **Build locally first**:
```bash
cd frontend && deno task build
```

2. **Use simplified Dockerfile**:
```dockerfile
FROM denoland/deno:2.3.6
WORKDIR /app

# Copy configuration files
COPY deno.json deno.lock* .npmrc ./

# Copy all source files including pre-built _fresh directory
COPY . .

# Cache dependencies
RUN deno cache --reload --node-modules-dir=auto main.ts

ENV PORT=8007
EXPOSE 8007

# Run in production mode
CMD ["deno", "run", "-A", "--node-modules-dir=auto", "main.ts"]
```

3. **Ensure .npmrc exists**:
```
@buf:registry=https://buf.build/gen/npm/v1/
```

4. **Update .dockerignore** to include _fresh:
```
# Development files
.vscode/
.git/

# Include pre-built assets
!_fresh/
!node_modules/
```

### Port Configuration

To avoid conflicts with OrbStack and other services:

| Service  | Port |
|----------|------|
| Frontend | 8007 |
| Backend  | 3007 |
| Database | 3307 |

Configure via environment variables:
```yaml
# docker-compose.yml
services:
  frontend:
    environment:
      PORT: "8007"
      BACKEND_URL: "http://backend:3007"
  backend:
    environment:
      PORT: "3007"
      DATABASE_URL: "root:root@tcp(db:3306)/todos?parseTime=true"
```

## Common Pitfalls & Solutions

### 1. Fresh 2.0 Alpha Tailwind Plugin Issues
**Problem**: UI appears left-aligned instead of centered, Tailwind classes present in HTML but not working.
**Root Cause**: `@fresh/plugin-tailwind@^0.0.1-alpha.7` doesn't reliably generate CSS utilities.
**Solution**: Add fallback CSS utilities directly to `static/styles.css`:

```css
/* Essential Tailwind utility classes for centering (fallback for Fresh 2.0 alpha issues) */
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
/* Add other utilities as needed */
```

**Verification**:
```bash
# Check if Tailwind classes are being served
curl -s "http://localhost:8007/styles.css" | grep -E "(min-h-screen|flex|items-center)"

# Verify HTML structure has correct classes
curl -s "http://localhost:8007" | grep -o 'class="min-h-screen[^"]*"'
```

### 2. CORS Issues
- Ensure Fresh proxy correctly forwards all headers
- ConnectRPC handles CORS automatically for Connect protocol

### 3. Type Mismatches
- Always regenerate code after proto changes
- Use `buf breaking` to catch incompatible changes

### 4. Database Timezone
- Store all timestamps as UTC
- Convert to user timezone in frontend only

### 5. Error Handling
- Use ConnectRPC error codes appropriately
- Map database errors to meaningful RPC errors

## Debugging Commands

```bash
# Test RPC endpoint directly
buf curl --schema proto --data '{"title": "Test task"}' http://localhost:3007/todo.v1.TodoService/CreateTask

# Check generated code
fd -e go -e ts generated

# Validate proto files
buf lint
buf breaking --against .git#branch=main

# View RPC logs
docker-compose logs -f backend
```

## Key Learnings

### Fresh 2.0 Alpha Considerations
- **Production Ready**: Fresh 2.0 alpha is stable enough for production (powers deno.com)
- **Plugin Ecosystem**: Alpha plugins may have incomplete functionality (especially Tailwind)
- **Fallback Strategies**: Always implement CSS fallbacks for critical styling
- **JSR Imports**: Use `jsr:@fresh/core@^2.0.0-alpha.22` over deno.land URLs
- **Stable Timeline**: Fresh 2.0 stable targeted for Q3 2025

### UI/Styling Best Practices
- **AppShell Pattern**: Use consistent layout wrapper with centering utilities
- **CSS Strategy**: Combine Tailwind plugin with manual utility definitions
- **Build Verification**: Always check that CSS utilities are actually generated
- **Root Element Height**: Ensure full-height cascade for proper centering

### buf.build npm Packages
- Public packages don't require authentication tokens
- Only need `@buf:registry=https://buf.build/gen/npm/v1/` in .npmrc
- Import directly from npm packages: `@buf/wcygan_simple-connect-web-stack.bufbuild_es`

### Docker Build Strategy
- Pre-built assets approach is more reliable than building in Docker
- Avoids ESM module compatibility issues with Fresh build process
- Faster Docker builds and deterministic results

### Port Management
- Use environment variables for all port configuration
- Document port changes clearly to avoid conflicts
- Default ports: Frontend 8007, Backend 3007, Database 3307

### ConnectRPC Integration Patterns
- **API Proxy**: Use `routes/api/[...path].ts` for seamless backend integration
- **Client Setup**: Create transport with `baseUrl: "/api"` for proxy routing
- **Error Handling**: Leverage ConnectRPC's built-in error codes and types

This project demonstrates a clean migration from REST to RPC while maintaining the simplicity and developer experience that made v1 successful, with practical solutions for Fresh 2.0 alpha limitations.