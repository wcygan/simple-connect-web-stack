# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Simple Connect Web Stack v2 project.

## Repository Overview

Simple Connect Web Stack v2 is a production-ready, modern full-stack application demonstrating best practices for ConnectRPC + Fresh integration. This monorepo showcases clean architecture principles, comprehensive testing strategies, and sophisticated deployment patterns.

**Architecture**: Schema-first development with Protocol Buffers, Fresh islands architecture, and Go clean architecture patterns.

**Key Migration: v1 (Rust/Axum + REST) → v2 (Go/ConnectRPC + Protocol Buffers)**

## Project Structure Deep Dive

### Monorepo Organization
```
simple-connect-web-stack/
├── frontend/           # Deno Fresh 2.0 with islands architecture
│   ├── components/     # Server-rendered UI components
│   ├── islands/        # Client-side interactive components
│   ├── hooks/          # Custom state management (Preact signals)
│   ├── routes/         # File-based routing + API proxy
│   └── lib/gen/        # Generated TypeScript types from protobuf
├── backend/            # Go + ConnectRPC clean architecture
│   ├── cmd/server/     # Application entry point
│   ├── internal/       # Business logic (service, repository, middleware)
│   └── internal/gen/   # Generated Go types from protobuf
├── proto/              # Protocol Buffer schema definitions (source of truth)
├── scripts/            # Deno automation scripts (testing, deployment)
├── docs/               # Comprehensive project documentation
├── tests/              # Integration and E2E test suites
└── docker-compose.yml  # Multi-environment orchestration
```

### Architecture Patterns

#### 1. Schema-First Development
- **Single Source of Truth**: Protocol Buffer definitions in `proto/`
- **Type Generation**: Automatic Go and TypeScript code generation
- **Version Control**: Schema evolution with breaking change detection

#### 2. Frontend Islands Architecture (Fresh)
- **Selective Hydration**: Only interactive components run on client
- **Performance**: Minimal JavaScript bundle size
- **SEO**: Server-side rendering by default

#### 3. Backend Clean Architecture (Go)
- **Separation of Concerns**: Service → Repository → Database layers
- **Dependency Injection**: Interface-based design for testability
- **Middleware**: Cross-cutting concerns (logging, validation, errors)

#### 4. API Gateway Pattern
- **Unified Interface**: `/api/*` routes proxy RPC calls to backend
- **Transport Flexibility**: HTTP/JSON for web, can upgrade to gRPC
- **CORS Handling**: Centralized CORS policy in Fresh proxy

## Essential Commands

### Development Workflow
```bash
# Start full development stack (recommended)
docker-compose up -d

# Start individual services
cd frontend && deno task dev        # Frontend with hot reload (port 8007)
cd backend && air                   # Backend with hot reload (port 3007)

# Generate code from Protocol Buffers
buf generate                        # Generates both Go and TypeScript code

# Build frontend for production
cd frontend && deno task build

# Initialize project (first-time setup)
deno run -A scripts/init-v2.ts
```

### Protocol Buffer Workflow
```bash
# Core buf commands for schema management
buf generate                        # Generate Go and TypeScript code
buf lint                           # Validate proto file syntax
buf format -w                      # Format proto files
buf breaking --against .git#branch=main  # Check for breaking changes
buf push                           # Publish to buf.build registry

# Regenerate after schema changes
buf generate && cd frontend && deno cache --reload main.ts
```

### Testing Strategy
```bash
# Comprehensive test runner (runs all test types)
deno run -A scripts/test-all.ts

# Individual test categories
cd frontend && deno test --coverage=./coverage  # Frontend unit tests
cd backend && go test -v -cover ./...           # Backend unit tests
deno run -A scripts/test-integration.ts        # Integration tests
deno run -A scripts/test-database.ts          # Database connectivity

# Test watching for development
cd frontend && deno task test:watch
cd backend && go test -v ./... -count=1        # Force re-run
```

### Production Operations
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Health checks
deno run -A scripts/health-check.ts

# Open development environment
deno run -A scripts/open-browser.ts
```

## Implementation Deep Dive

### Frontend Architecture (Deno Fresh 2.0)

#### Component Organization
```
frontend/
├── components/           # Server-rendered components
│   ├── layout/          # AppShell, TopBar (layout components)
│   └── todo/            # AddTaskForm, TaskItem, TaskList (domain components)
├── hooks/               # Custom state management
│   ├── useTodoClient.ts     # ConnectRPC client setup
│   ├── useTodoState.ts      # Preact signals state management
│   ├── useTodoActions.ts    # Business logic and RPC calls
│   └── useErrorBoundary.ts  # Error handling
├── islands/             # Client-side interactive components
│   └── TodoApp.tsx          # Main application island
├── routes/              # File-based routing
│   ├── index.tsx            # Homepage (SSR)
│   ├── _app.tsx             # App shell
│   └── api/[...path].ts     # API proxy for RPC calls
├── lib/gen/             # Generated TypeScript types
│   └── todo/v1/
│       ├── todo_pb.ts       # Protocol Buffer messages
│       └── todo_connect.ts  # ConnectRPC service definitions
└── static/              # Static assets and fallback CSS
```

#### State Management Pattern
```typescript
// Preact signals for reactive state
const tasks = useSignal<Task[]>([]);
const loading = useSignal(false);

// Business logic hooks combine RPC client with state
const { createTask, toggleTask, deleteTask } = useTodoActions();
```

### Backend Architecture (Go + ConnectRPC)

#### Clean Architecture Implementation
```
backend/
├── cmd/server/          # Application entry point
│   └── main.go             # Server setup, middleware, routing
├── internal/            # Business logic (private)
│   ├── service/            # RPC service implementations
│   │   ├── todo.go            # TodoService with all RPC methods
│   │   └── todo_test.go       # Service unit tests
│   ├── repository/         # Data access layer
│   │   ├── todo.go            # TodoRepository interface + MySQL impl
│   │   ├── todo_test.go       # Repository tests
│   │   └── mock_todo.go       # Mock for testing
│   ├── middleware/         # Cross-cutting concerns
│   │   ├── logger.go          # Structured logging
│   │   ├── error.go           # Error handling
│   │   └── middleware.go      # Request/response middleware
│   ├── validator/          # Input validation
│   │   └── todo.go            # Request validation logic
│   ├── db/                 # Database operations
│   │   └── db.go              # Connection, migrations
│   └── gen/               # Generated Protocol Buffer code
│       └── todo/v1/
│           ├── todo.pb.go        # Protocol Buffer messages
│           └── todov1connect/    # ConnectRPC service handlers
├── go.mod               # Go module dependencies
└── Dockerfile           # Multi-stage build with hot reload
```

#### Dependency Injection Pattern
```go
type TodoService struct {
    repo         repository.TodoRepository  // Interface for testability
    validator    *validator.TodoValidator
    errorHandler *middleware.ErrorHandler
}

// Constructor with dependency injection
func NewTodoService(db *sql.DB) *TodoService {
    return &TodoService{
        repo:         repository.NewMySQLTodoRepository(db),
        validator:    validator.NewTodoValidator(),
        errorHandler: middleware.NewErrorHandler(logger),
    }
}
```

### Protocol Buffer Schema Management

#### Schema Organization
```
proto/
├── buf.yaml             # Buf configuration
└── todo/v1/
    └── todo.proto       # Service and message definitions
```

#### Code Generation Pipeline
```yaml
# buf.gen.yaml - Generates for both frontend and backend
version: v2
plugins:
  - remote: buf.build/connectrpc/go
    out: backend/internal/gen
  - remote: buf.build/bufbuild/es  
    out: frontend/lib/gen
```

### Service Communication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                           │
│  Preact Islands + Signals State Management                     │
└─────────────────────┬───────────────────────────────────────────┘
                     │ HTTP/JSON (ConnectRPC Web)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Fresh Server (Port 8007)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   SSR Routes    │  │   API Proxy     │  │   Static Assets │  │
│  │   (index.tsx)   │  │  ([...path].ts) │  │   (styles.css)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                     │ Proxied RPC Calls
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                Go ConnectRPC Server (Port 3007)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Service       │  │   Repository    │  │   Middleware    │  │
│  │   (RPC Logic)   │  │  (Data Access)  │  │ (Cross-cutting) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                     │ SQL Queries
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database (Port 3307)                  │
│               Connection Pool + Transactions                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Example: Creating a Task

1. **Frontend**: User types in `AddTaskForm`, triggers `createTask()` action
2. **Signal Update**: `useTodoActions` calls `client.createTask({ title })`
3. **ConnectRPC**: HTTP POST to `/api/todo.v1.TodoService/CreateTask`
4. **Fresh Proxy**: `routes/api/[...path].ts` forwards to `backend:3007`
5. **Go Service**: `TodoService.CreateTask()` validates and processes request
6. **Repository**: MySQL insert with UUID generation and timestamps
7. **Response**: Type-safe task object returned through all layers
8. **UI Update**: Preact signals automatically re-render components

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

## Advanced Development Patterns

### Script Automation (Deno)

The project includes sophisticated Deno scripts for automation:

```typescript
// scripts/test-all.ts - Comprehensive test orchestration
class TestRunner {
  async run() {
    await this.runUnitTests();         // Frontend & backend unit tests
    await this.runIntegrationTests();  // RPC integration tests
    await this.runE2ETests();          // Full stack browser tests
    await this.generateReport();       // JSON test reports
  }
}

// Other automation scripts:
// scripts/health-check.ts      - Service health monitoring
// scripts/test-integration.ts  - ConnectRPC integration testing
// scripts/test-database.ts     - Database connectivity validation
// scripts/init-v2.ts          - Project structure initialization
```

### Testing Architecture

#### Multi-Layer Testing Strategy
1. **Unit Tests**: Service logic, repository interfaces, component behavior
2. **Integration Tests**: RPC calls, database operations, API contracts
3. **E2E Tests**: Full browser automation with Docker orchestration

#### Test Environment Management
```yaml
# docker-compose.test.yml
services:
  test-db:       # Isolated test database
  test-backend:  # Backend with test configuration
  test-frontend: # Frontend with test transport
  playwright:    # Browser automation container
```

### Production Deployment Patterns

#### Multi-Stage Docker Builds
```dockerfile
# Development stage with hot reload
FROM base AS development
RUN deno cache --reload main.ts
CMD ["deno", "task", "dev"]

# Production stage with optimized assets
FROM base AS production  
COPY --from=builder /app .
CMD ["deno", "run", "-A", "--node-modules-dir=auto", "main.ts"]
```

#### Environment Configuration
```bash
# Development (default)
FRONTEND_PORT=8007
BACKEND_PORT=3007
DATABASE_PORT=3307

# Production
BACKEND_URL=https://api.yourdomain.com
DATABASE_URL=mysql://user:pass@prod-db/todos
```

## Key Implementation Insights

### Fresh 2.0 Alpha Production Readiness
- **Stable Core**: Fresh 2.0 alpha powers deno.com (production-ready)
- **Plugin Limitations**: Tailwind plugin unreliable, use CSS fallbacks
- **Build Strategy**: Pre-built assets approach for Docker compatibility
- **JSR Migration**: Use `jsr:@fresh/core` over deprecated deno.land URLs

### ConnectRPC Integration Excellence
- **Type Safety**: End-to-end type safety from Protocol Buffers
- **Transport Flexibility**: HTTP/JSON for web, can upgrade to gRPC
- **Error Handling**: Built-in Connect error codes with proper propagation
- **Client Patterns**: Singleton client with transport configuration

### buf.build Package Management
- **Registry Configuration**: Simple `.npmrc` with custom registry URL
- **Version Control**: Commit-hash versioning for reproducible builds
- **Docker Integration**: Pre-built assets solve registry access issues
- **Type Distribution**: Automatic npm package publishing from buf.build

### Performance & Scalability
- **Islands Architecture**: Minimal client-side JavaScript
- **Connection Pooling**: MySQL connection pool (max 25 connections)
- **Signal Optimization**: Fine-grained reactivity with Preact signals
- **Hot Reload**: Both frontend (Deno) and backend (Air) development

### Security & Reliability
- **Input Validation**: Server-side validation for all RPC methods
- **Error Boundaries**: React-style error handling in Fresh islands
- **Health Checks**: Comprehensive service monitoring
- **CORS Configuration**: Proper cross-origin resource sharing

This project represents a sophisticated, production-ready implementation that balances modern architecture with practical development concerns, showcasing best practices for ConnectRPC + Fresh integration.