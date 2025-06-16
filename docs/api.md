# API Documentation

This document provides comprehensive documentation for the Simple Connect Web Stack API using ConnectRPC.

## Overview

The Simple Connect Web Stack uses [ConnectRPC](https://connectrpc.com/) for type-safe communication between the frontend and backend. All APIs are defined using Protocol Buffers and generate TypeScript and Go client code automatically.

### Base Information

- **Protocol**: ConnectRPC over HTTP/JSON
- **Base URL**: `http://localhost:3007`
- **Content-Type**: `application/json`
- **Schema Registry**: [buf.build/wcygan/simple-connect-web-stack](https://buf.build/wcygan/simple-connect-web-stack)

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Error Handling

ConnectRPC uses standardized error codes and formats:

```json
{
  "code": "invalid_argument",
  "message": "Task title cannot be empty",
  "details": []
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `ok` | Success | 200 |
| `invalid_argument` | Request validation failed | 400 |
| `not_found` | Resource not found | 404 |
| `internal` | Server error | 500 |
| `unavailable` | Service unavailable | 503 |

## TodoService

The `TodoService` provides complete CRUD operations for todo tasks with advanced features like pagination, filtering, and search.

### Service Definition

```protobuf
service TodoService {
  rpc CreateTask(CreateTaskRequest) returns (CreateTaskResponse);
  rpc GetTask(GetTaskRequest) returns (GetTaskResponse);
  rpc ListTasks(ListTasksRequest) returns (ListTasksResponse);
  rpc UpdateTask(UpdateTaskRequest) returns (UpdateTaskResponse);
  rpc DeleteTask(DeleteTaskRequest) returns (google.protobuf.Empty);
  rpc HealthCheck(google.protobuf.Empty) returns (HealthCheckResponse);
}
```

---

## Task Model

### Task

Represents a todo item with metadata.

```protobuf
message Task {
  string id = 1;                               // UUID v4
  string title = 2;                            // Task title (max 255 chars)
  bool completed = 3;                          // Completion status
  google.protobuf.Timestamp created_at = 4;    // Creation timestamp
  google.protobuf.Timestamp updated_at = 5;    // Last update timestamp
}
```

#### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `string` | Unique identifier (UUID v4) | Read-only, auto-generated |
| `title` | `string` | Task description | Required, max 255 characters |
| `completed` | `bool` | Whether the task is completed | Default: `false` |
| `created_at` | `Timestamp` | When the task was created | Read-only, auto-generated |
| `updated_at` | `Timestamp` | When the task was last modified | Auto-updated |

---

## API Endpoints

### 1. Create Task

Creates a new todo task.

**Endpoint**: `POST /todo.v1.TodoService/CreateTask`

#### Request

```protobuf
message CreateTaskRequest {
  string title = 1; // Required, max 255 chars
}
```

#### Response

```protobuf
message CreateTaskResponse {
  Task task = 1;
}
```

#### Example

**Request:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/CreateTask \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn ConnectRPC"}'
```

**Response:**
```json
{
  "task": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Learn ConnectRPC",
    "completed": false,
    "createdAt": "2025-06-16T10:30:00Z",
    "updatedAt": "2025-06-16T10:30:00Z"
  }
}
```

#### Error Cases

| Condition | Error Code | Message |
|-----------|------------|---------|
| Empty title | `invalid_argument` | "Task title cannot be empty" |
| Title too long | `invalid_argument` | "Task title exceeds 255 characters" |

---

### 2. Get Task

Retrieves a specific task by ID.

**Endpoint**: `POST /todo.v1.TodoService/GetTask`

#### Request

```protobuf
message GetTaskRequest {
  string id = 1; // Task UUID
}
```

#### Response

```protobuf
message GetTaskResponse {
  Task task = 1;
}
```

#### Example

**Request:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/GetTask \
  -H "Content-Type: application/json" \
  -d '{"id": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Response:**
```json
{
  "task": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Learn ConnectRPC",
    "completed": false,
    "createdAt": "2025-06-16T10:30:00Z",
    "updatedAt": "2025-06-16T10:30:00Z"
  }
}
```

#### Error Cases

| Condition | Error Code | Message |
|-----------|------------|---------|
| Invalid UUID | `invalid_argument` | "Invalid task ID format" |
| Task not found | `not_found` | "Task not found" |

---

### 3. List Tasks

Retrieves a paginated list of tasks with optional filtering and search.

**Endpoint**: `POST /todo.v1.TodoService/ListTasks`

#### Request

```protobuf
message ListTasksRequest {
  // Pagination
  uint32 page = 1;          // Page number (1-based), default: 1
  uint32 page_size = 2;     // Items per page, default: 20, max: 100
  
  // Filters
  string query = 3;         // Search in title
  StatusFilter status = 4;  // Filter by completion status
  
  // Sorting
  SortField sort_by = 5;    // Field to sort by
  SortOrder sort_order = 6; // Sort direction
}
```

#### Enums

**StatusFilter:**
```protobuf
enum StatusFilter {
  STATUS_FILTER_UNSPECIFIED = 0;
  STATUS_FILTER_ALL = 1;        // All tasks (default)
  STATUS_FILTER_COMPLETED = 2;  // Only completed tasks
  STATUS_FILTER_PENDING = 3;    // Only pending tasks
}
```

**SortField:**
```protobuf
enum SortField {
  SORT_FIELD_UNSPECIFIED = 0;
  SORT_FIELD_CREATED_AT = 1;    // Sort by creation date (default)
  SORT_FIELD_UPDATED_AT = 2;    // Sort by last update
  SORT_FIELD_TITLE = 3;         // Sort alphabetically by title
}
```

**SortOrder:**
```protobuf
enum SortOrder {
  SORT_ORDER_UNSPECIFIED = 0;
  SORT_ORDER_ASC = 1;           // Ascending
  SORT_ORDER_DESC = 2;          // Descending (default)
}
```

#### Response

```protobuf
message ListTasksResponse {
  repeated Task tasks = 1;
  PaginationMetadata pagination = 2;
}

message PaginationMetadata {
  uint32 page = 1;         // Current page
  uint32 page_size = 2;    // Items per page
  uint32 total_pages = 3;  // Total number of pages
  uint32 total_items = 4;  // Total number of items
  bool has_previous = 5;   // Whether there's a previous page
  bool has_next = 6;       // Whether there's a next page
}
```

#### Examples

**Basic List (First 10 tasks):**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/ListTasks \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 10}'
```

**Search with Filter:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/ListTasks \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 20,
    "query": "ConnectRPC",
    "status": "STATUS_FILTER_PENDING",
    "sortBy": "SORT_FIELD_TITLE",
    "sortOrder": "SORT_ORDER_ASC"
  }'
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Learn ConnectRPC",
      "completed": false,
      "createdAt": "2025-06-16T10:30:00Z",
      "updatedAt": "2025-06-16T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

#### Error Cases

| Condition | Error Code | Message |
|-----------|------------|---------|
| Page size > 100 | `invalid_argument` | "Page size cannot exceed 100" |
| Page < 1 | `invalid_argument` | "Page must be >= 1" |

---

### 4. Update Task

Updates an existing task's title and/or completion status.

**Endpoint**: `POST /todo.v1.TodoService/UpdateTask`

#### Request

```protobuf
message UpdateTaskRequest {
  string id = 1;        // Task UUID
  string title = 2;     // New title (optional)
  bool completed = 3;   // New completion status
}
```

#### Response

```protobuf
message UpdateTaskResponse {
  Task task = 1;
}
```

#### Example

**Update completion status:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/UpdateTask \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Learn ConnectRPC (Updated)",
    "completed": true
  }'
```

**Response:**
```json
{
  "task": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Learn ConnectRPC (Updated)",
    "completed": true,
    "createdAt": "2025-06-16T10:30:00Z",
    "updatedAt": "2025-06-16T10:35:00Z"
  }
}
```

#### Error Cases

| Condition | Error Code | Message |
|-----------|------------|---------|
| Invalid UUID | `invalid_argument` | "Invalid task ID format" |
| Task not found | `not_found` | "Task not found" |
| Title too long | `invalid_argument` | "Task title exceeds 255 characters" |

---

### 5. Delete Task

Deletes a task permanently.

**Endpoint**: `POST /todo.v1.TodoService/DeleteTask`

#### Request

```protobuf
message DeleteTaskRequest {
  string id = 1; // Task UUID
}
```

#### Response

Returns empty response (`google.protobuf.Empty`) on success.

#### Example

**Request:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/DeleteTask \
  -H "Content-Type: application/json" \
  -d '{"id": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Response:**
```json
{}
```

#### Error Cases

| Condition | Error Code | Message |
|-----------|------------|---------|
| Invalid UUID | `invalid_argument` | "Invalid task ID format" |
| Task not found | `not_found` | "Task not found" |

---

### 6. Health Check

Checks if the service is healthy and operational.

**Endpoint**: `POST /todo.v1.TodoService/HealthCheck`

#### Request

Empty request (`google.protobuf.Empty`).

#### Response

```protobuf
message HealthCheckResponse {
  string status = 1; // "ok" when healthy
}
```

#### Example

**Request:**
```bash
curl -X POST http://localhost:3007/todo.v1.TodoService/HealthCheck \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## Client Generation

### TypeScript Client

Generated TypeScript clients are available via buf.build:

```typescript
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";

const transport = createConnectTransport({
  baseUrl: "http://localhost:3007",
});

const client = createClient(TodoService, transport);

// Usage
const response = await client.createTask({ title: "New Task" });
```

### Go Client

```go
import (
    "connectrpc.com/connect"
    todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
    "buf.build/gen/go/wcygan/simple-connect-web-stack/connectrpc/go/todo/v1/todov1connect"
)

client := todov1connect.NewTodoServiceClient(
    http.DefaultClient,
    "http://localhost:3007",
)

// Usage
response, err := client.CreateTask(context.Background(), connect.NewRequest(&todov1.CreateTaskRequest{
    Title: "New Task",
}))
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting based on:

- IP address
- User authentication
- API key

## Monitoring

Use the health check endpoint for monitoring:

```bash
# Simple health check
curl -f http://localhost:3007/todo.v1.TodoService/HealthCheck

# With timeout
timeout 5s curl -f http://localhost:3007/todo.v1.TodoService/HealthCheck
```

## Testing

### Using buf curl

Test endpoints directly with buf CLI:

```bash
# Install buf (if not already installed)
brew install bufbuild/buf/buf

# Test create task
buf curl --schema proto --data '{"title": "Test task"}' \
  http://localhost:3007/todo.v1.TodoService/CreateTask

# Test list tasks
buf curl --schema proto --data '{"page": 1, "pageSize": 10}' \
  http://localhost:3007/todo.v1.TodoService/ListTasks
```

### Integration Tests

The project includes comprehensive integration tests:

```bash
# Run all tests
deno task test

# Run only integration tests
deno task test:integration

# Run with coverage
deno task test:coverage
```

## Performance Considerations

### Pagination

- Maximum page size is 100 items
- Use appropriate page sizes based on client needs
- Consider implementing cursor-based pagination for large datasets

### Searching

- Search is performed using MySQL LIKE queries
- Consider implementing full-text search for better performance
- Use database indexing on frequently searched fields

### Caching

- Currently no caching is implemented
- Consider adding Redis for frequently accessed data
- Implement appropriate cache invalidation strategies

---

For more information about ConnectRPC, visit the [official documentation](https://connectrpc.com/docs/).