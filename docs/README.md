# Documentation Index

Welcome to the Simple Connect Web Stack documentation. This comprehensive guide covers everything from getting started to advanced deployment strategies.

## 📚 Documentation Structure

### Core Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[Project README](../README.md)** | Main project overview and quick start | Everyone |
| **[API Reference](./api.md)** | Complete ConnectRPC API documentation | Developers |
| **[Configuration Guide](./configuration.md)** | Environment and configuration management | DevOps, Developers |
| **[Deployment Guide](./deployment.md)** | Development to production deployment | DevOps, SRE |
| **[CHANGELOG](../CHANGELOG.md)** | Version history and breaking changes | Everyone |

### Quick Navigation

#### 🚀 Getting Started
- [Quick Start Guide](../README.md#quick-start) - Get up and running in 5 minutes
- [Architecture Overview](../README.md#architecture) - Understand the system design
- [Development Setup](./deployment.md#development-deployment) - Set up local development

#### 🔧 Development
- [Development Commands](../README.md#development-commands) - Essential development tasks
- [API Documentation](./api.md) - Complete API reference
- [Testing Guide](../README.md#testing) - Comprehensive testing strategies
- [Hot Reload Setup](./deployment.md#hot-reload-development) - Development workflow

#### 📊 API Integration
- [ConnectRPC Services](./api.md#todoservice) - RPC service definitions
- [Client Generation](./api.md#client-generation) - TypeScript and Go clients
- [Error Handling](./api.md#error-handling) - Error codes and responses
- [Example Usage](./api.md#examples) - Practical API examples

#### ⚙️ Configuration
- [Environment Variables](./configuration.md#environment-variables-reference) - Complete configuration reference
- [Docker Configuration](./configuration.md#docker-configuration) - Container orchestration
- [Security Settings](./configuration.md#security-configuration) - Production security
- [Troubleshooting](./configuration.md#troubleshooting) - Common configuration issues

#### 🚀 Deployment
- [Production Deployment](./deployment.md#production-deployment) - Production-ready setup
- [Docker Compose](./deployment.md#container-orchestration) - Container orchestration
- [Reverse Proxy](./deployment.md#reverse-proxy-configuration) - Nginx/Traefik setup
- [Monitoring](./deployment.md#monitoring-and-health-checks) - Health checks and metrics

---

## 🏗️ Architecture Quick Reference

### Technology Stack
- **Frontend**: Deno Fresh 2.0 + Preact + Tailwind CSS
- **Backend**: Go 1.24 + ConnectRPC + MySQL 8.0
- **Protocol**: Protocol Buffers via buf.build
- **Infrastructure**: Docker + Docker Compose

### Service Communication
```
Frontend (8007) → ConnectRPC → Backend (3007) → MySQL (3307)
```

### Key Features
- **Type Safety**: End-to-end type safety with Protocol Buffers
- **Hot Reload**: Development-optimized workflow
- **Testing**: Comprehensive test suite with Docker isolation
- **Production Ready**: Optimized builds and monitoring

---

## 📖 Quick Reference Guides

### Essential Commands

#### Development
```bash
deno task up          # Start all services
deno task dev         # Development with hot reload
deno task health      # Health check all services
deno task logs        # View service logs
```

#### Testing
```bash
deno task test        # Run all tests
deno task test:unit   # Unit tests only
deno task test:e2e    # End-to-end tests
deno task test:coverage # Coverage reports
```

#### Production
```bash
deno task deploy     # Full production deployment
deno task up:rebuild # Complete rebuild
deno task monitor    # Resource monitoring
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `CreateTask` | `/todo.v1.TodoService/CreateTask` | Create new task |
| `ListTasks` | `/todo.v1.TodoService/ListTasks` | List with pagination |
| `GetTask` | `/todo.v1.TodoService/GetTask` | Get specific task |
| `UpdateTask` | `/todo.v1.TodoService/UpdateTask` | Update task |
| `DeleteTask` | `/todo.v1.TodoService/DeleteTask` | Delete task |
| `HealthCheck` | `/todo.v1.TodoService/HealthCheck` | Service health |

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | - | MySQL connection string |
| `BACKEND_URL` | `http://backend:3007` | Frontend → Backend URL |
| `GO_ENV` | `development` | Go environment mode |
| `DENO_ENV` | `development` | Deno environment mode |

---

## 🚦 Getting Started Paths

### For New Developers

1. **[Read the Project README](../README.md)** - Understand the project
2. **[Follow Quick Start](../README.md#quick-start)** - Get it running
3. **[Review API Documentation](./api.md)** - Understand the API
4. **[Set up Development Environment](./deployment.md#development-deployment)** - Local development

### For DevOps Engineers

1. **[Review Architecture](../README.md#architecture)** - System overview
2. **[Study Configuration Guide](./configuration.md)** - Environment setup
3. **[Follow Deployment Guide](./deployment.md)** - Production deployment
4. **[Set up Monitoring](./deployment.md#monitoring-and-health-checks)** - Health checks

### For Frontend Developers

1. **[Understand ConnectRPC Integration](./api.md#client-generation)** - Client usage
2. **[Review TypeScript Client Examples](./api.md#typescript-client)** - Implementation patterns
3. **[Set up Hot Reload](./deployment.md#hot-reload-development)** - Development workflow
4. **[Run Frontend Tests](../README.md#testing)** - Testing approach

### For Backend Developers

1. **[Study Go ConnectRPC Implementation](./api.md#todoservice)** - Service patterns
2. **[Review Protocol Buffer Definitions](./api.md#task-model)** - Data models
3. **[Understand Testing Strategy](../README.md#testing)** - Go testing patterns
4. **[Set up Development Environment](./deployment.md#development-deployment)** - Backend development

---

## 🔍 Deep Dive Topics

### Advanced Configuration
- [Multi-Environment Setup](./configuration.md#environment-specific-configuration)
- [Security Configuration](./configuration.md#security-configuration)
- [Docker Optimization](./deployment.md#production-optimizations)
- [Resource Limits](./configuration.md#resource-limits)

### API Development
- [Protocol Buffer Best Practices](./api.md#protocol-buffer-configuration)
- [Error Handling Patterns](./api.md#error-handling)
- [Client Code Generation](./api.md#client-generation)
- [Testing ConnectRPC Services](./api.md#testing)

### Production Operations
- [Deployment Strategies](./deployment.md#production-deployment)
- [Monitoring and Alerting](./deployment.md#monitoring-and-health-checks)
- [Performance Optimization](./api.md#performance-considerations)
- [Security Hardening](./deployment.md#security-best-practices)

### Troubleshooting
- [Common Issues](./configuration.md#troubleshooting)
- [Debug Techniques](./deployment.md#debug-mode)
- [Performance Debugging](./deployment.md#performance-debugging)
- [Container Issues](./deployment.md#common-deployment-issues)

---

## 🆘 Need Help?

### Quick Solutions

| Problem | Solution |
|---------|----------|
| **Port conflicts** | Check [Port Configuration](./configuration.md#port-configuration) |
| **Database errors** | See [Configuration Troubleshooting](./configuration.md#troubleshooting) |
| **Build failures** | Review [Deployment Issues](./deployment.md#common-deployment-issues) |
| **API errors** | Check [API Error Handling](./api.md#error-handling) |

### Support Channels

1. **Documentation**: Start here for comprehensive guides
2. **Issues**: [GitHub Issues](https://github.com/wcygan/simple-connect-web-stack/issues) for bugs and features
3. **Discussions**: [GitHub Discussions](https://github.com/wcygan/simple-connect-web-stack/discussions) for questions

### Contributing

Want to improve the documentation?

1. **Fork** the repository
2. **Edit** the relevant documentation file
3. **Test** your changes locally
4. **Submit** a pull request

Documentation follows [CommonMark](https://commonmark.org/) specification.

---

## 📋 Checklists

### Development Setup Checklist

- [ ] Clone repository
- [ ] Install prerequisites (Deno, Docker)
- [ ] Run `deno task up`
- [ ] Verify services at localhost:8007
- [ ] Run `deno task test`
- [ ] Set up hot reload development

### Production Deployment Checklist

- [ ] Create production environment file
- [ ] Configure secure passwords and secrets
- [ ] Set up SSL certificates (if needed)
- [ ] Run `deno task deploy`
- [ ] Verify health checks pass
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy

### API Integration Checklist

- [ ] Review API documentation
- [ ] Generate client code
- [ ] Implement error handling
- [ ] Add request/response logging
- [ ] Write integration tests
- [ ] Set up monitoring

---

## 🔄 Version Information

This documentation is for **Simple Connect Web Stack v2.0.0**.

- **Current Version**: 2.0.0 (ConnectRPC)
- **Previous Version**: 1.0.0 (REST API)
- **Breaking Changes**: See [CHANGELOG.md](../CHANGELOG.md#breaking-changes)
- **Migration Guide**: [v1 → v2 Migration](../CHANGELOG.md#v1--v2-migration)

### Documentation Updates

The documentation is updated with each release. For the latest changes:

- **Latest**: Check [commit history](https://github.com/wcygan/simple-connect-web-stack/commits/main/docs)
- **Releases**: See [GitHub Releases](https://github.com/wcygan/simple-connect-web-stack/releases)
- **Changelog**: Review [CHANGELOG.md](../CHANGELOG.md)

---

**Happy coding! 🚀**