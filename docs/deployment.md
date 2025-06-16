# Deployment Guide

This comprehensive guide covers deployment strategies for the Simple Connect Web Stack from development to production.

## Overview

The Simple Connect Web Stack supports multiple deployment scenarios:

- **Local Development**: Hot reload with Docker Compose
- **Testing**: Isolated test environments
- **Staging**: Production-like environment for testing
- **Production**: Optimized production deployment

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4GB | 8GB+ |
| **Disk** | 10GB | 20GB+ |
| **Docker** | 20.10+ | Latest |
| **Docker Compose** | 2.0+ | Latest |

### Software Dependencies

```bash
# Required
- Docker & Docker Compose
- Git

# Optional (for development)
- Deno 2.3.6+
- Go 1.24+
- Buf CLI
```

---

## Quick Deployment

### 1. Production Deployment (Fastest)

```bash
# Clone and deploy
git clone https://github.com/wcygan/simple-connect-web-stack.git
cd simple-connect-web-stack

# Create production environment file
cp .env.example .env.production
# Edit .env.production with your values

# Deploy all services
deno task deploy

# Verify deployment
deno task health
```

### 2. Development Setup

```bash
# Clone repository
git clone https://github.com/wcygan/simple-connect-web-stack.git
cd simple-connect-web-stack

# Start development environment
deno task up

# Open application
open http://localhost:8007
```

---

## Development Deployment

### Local Development Environment

The development environment provides hot reload for both frontend and backend.

#### Quick Start

```bash
# 1. Start all services
deno task up

# 2. View logs
deno task logs

# 3. Check health
deno task health

# 4. Access services
# Frontend: http://localhost:8007
# Backend API: http://localhost:3007
# Database: localhost:3307
```

#### Development Commands

| Command | Description |
|---------|-------------|
| `deno task up` | Start all services |
| `deno task down` | Stop all services |
| `deno task restart` | Restart all services |
| `deno task logs` | View service logs |
| `deno task status` | Check service status |
| `deno task health` | Run health checks |
| `deno task monitor` | Monitor resource usage |

#### Hot Reload Development

For maximum development efficiency with hot reload:

```bash
# Terminal 1: Start database only
docker-compose up -d mysql

# Terminal 2: Backend with hot reload
cd backend && air

# Terminal 3: Frontend with hot reload  
cd frontend && deno task dev

# Access frontend at http://localhost:8000
# Backend API at http://localhost:3007
```

### Development Configuration

**File**: `.env`
```bash
# Development-optimized settings
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=todos
MYSQL_USER=taskuser
MYSQL_PASSWORD=taskpassword

DATABASE_URL=taskuser:taskpassword@tcp(mysql:3306)/todos?parseTime=true
BACKEND_URL=http://backend:3007

GO_ENV=development
DENO_ENV=development
LOG_LEVEL=debug
```

---

## Testing Deployment

### Isolated Test Environment

The test environment uses separate containers and databases to avoid conflicts.

#### Running Tests

```bash
# Run all tests
deno task test

# Specific test suites
deno task test:unit              # Unit tests
deno task test:integration       # Integration tests
deno task test:e2e              # End-to-end tests

# Test environment management
deno task test:setup            # Start test environment
deno task test:teardown         # Stop test environment
deno task test:reset            # Reset test data
```

#### Test Environment Ports

| Service | Development | Test |
|---------|-------------|------|
| Frontend | 8007 | 8071 |
| Backend | 3007 | 30071 |
| Database | 3307 | 33061 |

#### Test Configuration

**File**: `docker-compose.test.yml`
```yaml
services:
  test-db:
    image: mysql:8.0
    ports:
      - "33061:3306"
    environment:
      MYSQL_ROOT_PASSWORD: testroot
      MYSQL_DATABASE: test_tasks_db
      MYSQL_USER: testuser
      MYSQL_PASSWORD: testpass
    volumes:
      - ./tests/fixtures/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
      - ./tests/fixtures/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql:ro
```

---

## Production Deployment

### Production-Ready Deployment

Production deployment includes optimization, security, and monitoring.

#### Complete Production Setup

```bash
# 1. Prepare environment
cp .env.example .env.production
# Edit .env.production with secure values

# 2. Build and deploy
deno task deploy:production

# 3. Verify deployment
deno task health

# 4. Monitor services
deno task monitor
```

#### Production Commands

| Command | Description |
|---------|-------------|
| `deno task deploy` | Full production build and deploy |
| `deno task deploy:build` | Build optimized containers |
| `deno task deploy:up` | Start production services |
| `deno task up:rebuild` | Complete rebuild and restart |
| `deno task restart:rebuild` | Clean rebuild with cleanup |

### Production Configuration

**File**: `.env.production`
```bash
# Production configuration
MYSQL_ROOT_PASSWORD=ultra_secure_root_password_here
MYSQL_DATABASE=tasks_production
MYSQL_USER=taskapp
MYSQL_PASSWORD=very_secure_app_password_here

DATABASE_URL=taskapp:very_secure_app_password_here@tcp(mysql:3306)/tasks_production?parseTime=true
BACKEND_URL=https://api.yourdomain.com

GO_ENV=production
DENO_ENV=production
LOG_LEVEL=info
ENABLE_METRICS=true

# Security
SESSION_SECRET=generate_64_char_random_secret_here
JWT_SECRET=generate_64_char_random_secret_here

# SSL (if using HTTPS)
SSL_CERT_PATH=/etc/ssl/certs/app.crt
SSL_KEY_PATH=/etc/ssl/private/app.key

# Resource limits
MYSQL_MAX_CONNECTIONS=200
BACKEND_MAX_MEMORY=2G
FRONTEND_MAX_MEMORY=1G
```

### Production Optimizations

#### Multi-Stage Docker Builds

**Backend Dockerfile:**
```dockerfile
# Build stage
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Production stage
FROM alpine:latest AS production
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /app/server .
EXPOSE 3007
CMD ["./server"]
```

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM denoland/deno:2.3.6 AS builder
WORKDIR /app
COPY deno.json deno.lock* .npmrc ./
COPY . .
RUN deno task build

# Production stage
FROM denoland/deno:2.3.6 AS production
WORKDIR /app
COPY --from=builder /app/_fresh ./
COPY --from=builder /app/deno.json ./
COPY --from=builder /app/main.ts ./
EXPOSE 8007
CMD ["deno", "run", "-A", "main.ts"]
```

#### Docker Compose Production

**File**: `docker-compose.prod.yml`
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      target: production
    environment:
      BACKEND_URL: http://backend:3007
      DENO_ENV: production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: ${FRONTEND_MAX_MEMORY:-512M}
          cpus: '0.5'

  backend:
    build:
      context: ./backend
      target: production
    environment:
      DATABASE_URL: ${DATABASE_URL}
      GO_ENV: production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: ${BACKEND_MAX_MEMORY:-1G}
          cpus: '1.0'

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

volumes:
  mysql_data:
    driver: local
```

---

## Container Orchestration

### Docker Compose

#### Development Stack
```bash
# Start development stack
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=2

# View service logs
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec mysql mysql -u taskuser -ptaskpassword todos
```

#### Production Stack
```bash
# Deploy production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rolling updates
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps backend

# Health monitoring
docker-compose ps
docker stats
```

### Kubernetes (Advanced)

For larger deployments, consider Kubernetes:

**Deployment Example:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: todo-backend
  template:
    metadata:
      labels:
        app: todo-backend
    spec:
      containers:
      - name: backend
        image: simple-connect-web-stack-backend:latest
        ports:
        - containerPort: 3007
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          limits:
            memory: "1Gi"
            cpu: "500m"
```

---

## Reverse Proxy Configuration

### Nginx Configuration

**File**: `nginx/nginx.conf`
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3007;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend:8007;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /todo.v1.TodoService/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # ConnectRPC specific headers
            proxy_set_header Connect-Protocol-Version 1;
            proxy_set_header Content-Type application/json;
        }

        # Health check
        location /health {
            proxy_pass http://backend/todo.v1.TodoService/HealthCheck;
            access_log off;
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    }
}
```

### Traefik Configuration (Alternative)

**File**: `docker-compose.traefik.yml`
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.services.frontend.loadbalancer.server.port=8007"

  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.services.backend.loadbalancer.server.port=3007"
```

---

## Monitoring and Health Checks

### Health Check Script

**File**: `scripts/health-check.ts`
```typescript
import { delay } from "@std/async/delay";

interface HealthStatus {
  service: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
}

async function checkHealth(): Promise<HealthStatus[]> {
  const checks = [
    { name: "Frontend", url: "http://localhost:8007" },
    { name: "Backend", url: "http://localhost:3007/todo.v1.TodoService/HealthCheck" },
    { name: "Database", url: "http://localhost:3007/todo.v1.TodoService/HealthCheck" }
  ];

  const results: HealthStatus[] = [];

  for (const check of checks) {
    const start = Date.now();
    try {
      const response = await fetch(check.url, {
        method: check.name === "Frontend" ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: check.name !== "Frontend" ? "{}" : undefined
      });
      
      const responseTime = Date.now() - start;
      
      results.push({
        service: check.name,
        healthy: response.ok,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`
      });
    } catch (error) {
      results.push({
        service: check.name,
        healthy: false,
        responseTime: Date.now() - start,
        error: error.message
      });
    }
  }

  return results;
}

// Usage in monitoring
if (import.meta.main) {
  const status = await checkHealth();
  console.log("🏥 Health Check Results:");
  status.forEach(s => {
    const icon = s.healthy ? "✅" : "❌";
    console.log(`${icon} ${s.service}: ${s.responseTime}ms`);
    if (s.error) console.log(`   Error: ${s.error}`);
  });
}
```

### Prometheus Metrics (Optional)

Add metrics collection for production monitoring:

**Backend metrics (Go):**
```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request duration",
        },
        []string{"method", "endpoint"},
    )
)

// In main()
prometheus.MustRegister(requestDuration)
http.Handle("/metrics", promhttp.Handler())
```

---

## CI/CD Pipeline

### GitHub Actions

**File**: `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.3.6
      
      - name: Run tests
        run: deno task test:ci

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Add your deployment commands
          echo "Deploying to production..."
          deno task deploy:production
```

### GitLab CI

**File**: `.gitlab-ci.yml`
```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: denoland/deno:2.3.6
  script:
    - deno task test:ci

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - docker-compose -f docker-compose.prod.yml up -d
  only:
    - main
```

---

## Troubleshooting

### Common Deployment Issues

#### 1. Port Conflicts

**Error**: `Port already in use`

**Solution**:
```bash
# Check what's using the port
lsof -i :8007
lsof -i :3007
lsof -i :3307

# Stop conflicting services
docker stop $(docker ps -q)

# Use different ports
deno task up:build  # Will use configured ports
```

#### 2. Database Connection Issues

**Error**: `Failed to connect to database`

**Solution**:
```bash
# Check database health
docker-compose exec mysql mysqladmin ping -h localhost -u taskuser -ptaskpassword

# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: taskuser:taskpassword@tcp(mysql:3306)/todos?parseTime=true

# Reset database
deno task down:clean && deno task up
```

#### 3. Memory Issues

**Error**: `Container killed (OOMKilled)`

**Solution**:
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G  # Increase from 1G
```

#### 4. SSL Certificate Issues

**Error**: `SSL certificate not found`

**Solution**:
```bash
# Generate self-signed certificates for testing
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# For production, use Let's Encrypt
certbot certonly --standalone -d yourdomain.com
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set debug environment
export GO_ENV=development
export DENO_ENV=development
export LOG_LEVEL=debug

# Start with verbose logging
docker-compose up --build
```

### Performance Debugging

```bash
# Monitor resource usage
deno task monitor

# Check container logs
docker-compose logs -f --tail=100

# Database performance
docker-compose exec mysql mysql -u taskuser -ptaskpassword -e "SHOW PROCESSLIST;"
```

---

## Security Best Practices

### Environment Security

1. **Never commit secrets to version control**
2. **Use strong, unique passwords**
3. **Enable SSL/TLS in production**
4. **Regularly update dependencies**
5. **Use security scanning tools**

### Network Security

```bash
# Firewall configuration
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw deny 3007   # Block direct backend access
ufw deny 3307   # Block direct database access
```

### Container Security

```yaml
# Add security context to containers
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    user: "1000:1000"
```

---

This deployment guide provides comprehensive coverage from development to production. For specific cloud providers (AWS, GCP, Azure), additional provider-specific configurations may be needed.