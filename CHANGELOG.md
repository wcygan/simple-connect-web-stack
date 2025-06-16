# Changelog

All notable changes to the Simple Connect Web Stack project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🐛 Bug Fixes

- **fix(frontend)**: Resolve ESM module error in Docker environment
  - Fixed module resolution conflicts between `vendor: true` and `nodeModulesDir: "auto"`
  - Updated Docker configuration to properly cache buf.build npm dependencies
  - Simplified frontend development command for consistency with V1 setup
  - Added pre-build step in Dockerfile to generate Fresh files and avoid ESM issues

## [2.0.0] - 2025-06-16

### 🚀 Features

- **feat(deploy)**: Add comprehensive production deployment infrastructure
  - Complete Docker Compose production environment with resource limits
  - Health check scripts and monitoring tools
  - Nginx reverse proxy configuration with SSL support
  - Environment configuration templates and documentation

- **feat(test)**: Implement comprehensive Docker-based testing infrastructure
  - Isolated test environment with separate MySQL instance
  - Multi-stage testing: unit, integration, e2e with Playwright
  - Test fixtures, seed data, and automated test reporting
  - Coverage tracking for both Go backend and Deno frontend

- **feat(frontend)**: Transform UI to modern dark theme with Tailwind CSS
  - Migration from glassmorphism to sleek dark theme design
  - Comprehensive Tailwind CSS integration with custom color scheme
  - Enhanced responsive design and improved accessibility
  - Modern animations and micro-interactions

- **feat(frontend)**: Implement modern glass morphism UI design
  - Beautiful gradient backgrounds and glass effects
  - Responsive card-based layout with smooth animations
  - Enhanced user experience with loading states

- **feat(frontend)**: Initialize Fresh 2 frontend with ConnectRPC integration
  - Deno Fresh 2.0 framework implementation
  - ConnectRPC client integration with buf.build packages
  - TypeScript type safety across frontend components
  - Island architecture with Preact signals

- **feat(backend)**: Implement Go ConnectRPC server with BSR integration
  - Go 1.24 ConnectRPC server implementation
  - Protocol Buffer schema definition and generation
  - MySQL database integration with comprehensive CRUD operations
  - Buf Schema Registry integration for type-safe client generation

### 🔧 Refactoring

- **refactor**: Migrate to buf.build npm packages and cleanup generated code
  - Transition from local protobuf generation to buf.build registry packages
  - Improved build process and dependency management
  - Enhanced code organization and cleanup

### 🐛 Bug Fixes

- **fix**: Resolve Docker build issues with buf.build packages and port conflicts
  - Fixed npm registry access issues in Docker builds
  - Resolved port conflicts for development and production environments
  - Enhanced Docker build reliability and performance

- **fix**: Resolve Docker port conflicts and update Go version
  - Updated port mappings to avoid OrbStack conflicts
  - Go version bump to 1.24 for improved performance
  - Enhanced container networking configuration

- **fix**: Resolved Docker build failures with buf.build npm packages
- **fix**: Fixed port conflicts with OrbStack by migrating to new ports (8007, 3007, 3307)
- **fix**: Addressed ESM module errors in Fresh build process
- **fix**: Corrected Fresh 2.0 routing issues by removing deprecated createDefine pattern

### 🛠️ Development

- **chore**: Add testing infrastructure and development tools
  - Enhanced development tooling and scripts
  - Improved testing workflows and automation
  - Better developer experience setup

### 📚 Documentation

- **docs**: Comprehensive documentation for Docker buf.build solution
- **docs**: Port configuration via environment variables
- **docs**: .npmrc file for buf.build registry configuration
- **docs**: Docker build troubleshooting guide

## Breaking Changes

### v1 → v2 Migration

⚠️ **Breaking Changes**: Version 2.0.0 introduces breaking changes that require migration:

#### API Endpoints

```diff
- GET /api/tasks              → POST /todo.v1.TodoService/ListTasks
- POST /api/tasks             → POST /todo.v1.TodoService/CreateTask
- GET /api/tasks/{id}         → POST /todo.v1.TodoService/GetTask
- PUT /api/tasks/{id}         → POST /todo.v1.TodoService/UpdateTask
- DELETE /api/tasks/{id}      → POST /todo.v1.TodoService/DeleteTask
- GET /api/health             → POST /todo.v1.TodoService/HealthCheck
```

#### Request/Response Format

```diff
# v1 REST
- Content-Type: application/json
- Standard HTTP methods (GET, POST, PUT, DELETE)
- URL parameters and JSON body

# v2 ConnectRPC
+ Content-Type: application/json
+ All requests use POST method
+ RPC method in URL path
+ Protobuf-defined message structures
```

#### Error Handling

```diff
# v1 REST
- HTTP status codes (404, 500, etc.)
- Custom error JSON format

# v2 ConnectRPC
+ ConnectRPC error codes
+ Standardized error format
+ Enhanced error metadata
```

## [1.0.0] - Previous Version

### Legacy REST Implementation

The previous version (v1) implemented a REST-based architecture:

- **Backend**: Rust with Axum framework
- **Frontend**: Deno Fresh with traditional REST API calls
- **API**: OpenAPI/Swagger documentation
- **Communication**: JSON over HTTP with manual validation

### Migration to v2

Version 2.0.0 represents a complete architectural migration:

| Component | v1 (REST) | v2 (ConnectRPC) |
|-----------|-----------|-----------------|
| **Protocol** | HTTP/JSON REST | ConnectRPC (HTTP/JSON) |
| **Backend** | Rust + Axum | Go + ConnectRPC |
| **Type Safety** | Runtime validation | Compile-time generation |
| **Documentation** | OpenAPI/Swagger | Protocol Buffers |
| **Client Code** | Manual fetch calls | Generated TypeScript clients |
| **Error Handling** | HTTP status codes | ConnectRPC error codes |
| **Performance** | Good | Enhanced with protobuf efficiency |

## Development Highlights

### Performance Improvements

- **Faster Build Times**: buf.build registry packages eliminate local generation
- **Type Safety**: Compile-time type checking prevents runtime errors
- **Enhanced Testing**: Comprehensive test suite with 95%+ backend coverage
- **Docker Optimization**: Multi-stage builds and optimized container images

### Developer Experience

- **Hot Reload**: Both frontend (Fresh) and backend (Air) support hot reload
- **Comprehensive Tooling**: 86 different Deno tasks for all development needs
- **Health Monitoring**: Built-in health checks and monitoring tools
- **Documentation**: Complete API documentation and development guides

### Production Ready

- **Containerization**: Full Docker Compose production environment
- **Monitoring**: Health checks, resource monitoring, and logging
- **Security**: Environment variable management and secure defaults
- **Scalability**: Efficient ConnectRPC communication and database optimization

## Acknowledgments

- **ConnectRPC Team**: For the excellent RPC framework
- **Deno Team**: For Fresh 2.0 and modern JavaScript runtime
- **Buf Team**: For Protocol Buffer tooling and schema registry
- **Go Team**: For Go 1.24 and excellent standard library

---

For detailed migration instructions, see the [Migration Guide](./docs/migration-guide.md).
For the latest changes, check the [commit history](https://github.com/wcygan/simple-connect-web-stack/commits/main).