# Configuration Guide

This document provides comprehensive configuration information for the Simple Connect Web Stack.

## Overview

The application uses environment variables for configuration, with different settings for development, testing, and production environments.

## Environment Files

### .env (Development)

The main environment file for local development:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=todos
MYSQL_USER=taskuser
MYSQL_PASSWORD=taskpassword

# Application URLs
DATABASE_URL=taskuser:taskpassword@tcp(mysql:3306)/todos?parseTime=true
BACKEND_URL=http://backend:3007

# Environment Settings
GO_ENV=development
DENO_ENV=development
```

### .env.example (Template)

Template for creating your own environment configuration:

```bash
# Environment Configuration for Simple Connect Web Stack
# Copy this file to .env and update values for your environment

# Database Configuration
MYSQL_ROOT_PASSWORD=secure_root_password_change_me
MYSQL_DATABASE=tasks_db
MYSQL_USER=taskuser
MYSQL_PASSWORD=secure_password_change_me

# Backend Configuration
DATABASE_URL=mysql://taskuser:secure_password_change_me@mysql:3306/tasks_db?parseTime=true
APP_BIND_ADDRESS=0.0.0.0:3007
GO_ENV=production

# Frontend Configuration
BACKEND_URL=http://backend:3007
PORT=8007
DENO_ENV=production

# Production Data Paths
DATA_PATH=./data

# SSL Configuration (for HTTPS)
SSL_CERT_PATH=./nginx/ssl/cert.pem
SSL_KEY_PATH=./nginx/ssl/key.pem

# Monitoring and Logging
LOG_LEVEL=info
ENABLE_METRICS=true

# Security Settings
SESSION_SECRET=change_this_session_secret_in_production
JWT_SECRET=change_this_jwt_secret_in_production

# Resource Limits
MYSQL_MAX_CONNECTIONS=200
BACKEND_MAX_MEMORY=1G
FRONTEND_MAX_MEMORY=512M
```

---

## Environment Variables Reference

### Database Configuration

| Variable | Description | Default | Required | Environment |
|----------|-------------|---------|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root user password | `root` | ✅ | All |
| `MYSQL_DATABASE` | Database name to create/use | `todos` | ✅ | All |
| `MYSQL_USER` | Application database user | `taskuser` | ✅ | All |
| `MYSQL_PASSWORD` | Application database password | `taskpassword` | ✅ | All |
| `DATABASE_URL` | Go MySQL connection string | See below | ✅ | Backend |
| `MYSQL_MAX_CONNECTIONS` | Max database connections | `200` | ❌ | Production |

#### Database URL Format

The `DATABASE_URL` must use the Go MySQL driver format:

```bash
# Correct format for Go mysql driver
DATABASE_URL=username:password@tcp(host:port)/database?parseTime=true

# Examples
DATABASE_URL=taskuser:taskpassword@tcp(mysql:3306)/todos?parseTime=true
DATABASE_URL=taskuser:password123@tcp(localhost:3307)/todos?parseTime=true
```

**Important**: Do NOT use the `mysql://` prefix - this is for other drivers.

### Application Configuration

| Variable | Description | Default | Required | Environment |
|----------|-------------|---------|----------|-------------|
| `BACKEND_URL` | Frontend → Backend API URL | `http://backend:3007` | ✅ | Frontend |
| `APP_BIND_ADDRESS` | Backend server bind address | `0.0.0.0:3007` | ❌ | Backend |
| `PORT` | Frontend server port | `8007` | ❌ | Frontend |
| `GO_ENV` | Go environment mode | `development` | ❌ | Backend |
| `DENO_ENV` | Deno environment mode | `development` | ❌ | Frontend |

### Security Configuration

| Variable | Description | Default | Required | Environment |
|----------|-------------|---------|----------|-------------|
| `SESSION_SECRET` | Session signing secret | - | 🔒 | Production |
| `JWT_SECRET` | JWT token signing secret | - | 🔒 | Production |
| `SSL_CERT_PATH` | SSL certificate file path | - | ❌ | Production |
| `SSL_KEY_PATH` | SSL private key file path | - | ❌ | Production |

### Monitoring and Logging

| Variable | Description | Default | Required | Environment |
|----------|-------------|---------|----------|-------------|
| `LOG_LEVEL` | Application log level | `info` | ❌ | All |
| `ENABLE_METRICS` | Enable metrics collection | `true` | ❌ | All |
| `DATA_PATH` | Data directory path | `./data` | ❌ | Production |

### Resource Limits

| Variable | Description | Default | Required | Environment |
|----------|-------------|---------|----------|-------------|
| `BACKEND_MAX_MEMORY` | Backend memory limit | `1G` | ❌ | Production |
| `FRONTEND_MAX_MEMORY` | Frontend memory limit | `512M` | ❌ | Production |

---

## Environment-Specific Configuration

### Development Environment

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
ENABLE_METRICS=false
```

**Characteristics:**
- Simple, insecure passwords for ease of development
- Debug logging enabled
- Metrics disabled for performance
- Hot reload and development tools enabled

### Testing Environment

**File**: `docker-compose.test.yml` environment section

```yaml
environment:
  MYSQL_ROOT_PASSWORD: testroot
  MYSQL_DATABASE: test_tasks_db
  MYSQL_USER: testuser
  MYSQL_PASSWORD: testpass
  DATABASE_URL: testuser:testpass@tcp(test-db:3306)/test_tasks_db?parseTime=true
  GO_ENV: test
  DENO_ENV: test
  TEST_MODE: "true"
```

**Characteristics:**
- Isolated test database
- Different ports to avoid conflicts
- Test-specific configurations
- Ephemeral data (reset between test runs)

### Production Environment

**File**: Create your own `.env.production`

```bash
# Production-secured settings
MYSQL_ROOT_PASSWORD=super_secure_root_password
MYSQL_DATABASE=tasks_production
MYSQL_USER=taskapp
MYSQL_PASSWORD=very_secure_password_here

DATABASE_URL=taskapp:very_secure_password_here@tcp(mysql:3306)/tasks_production?parseTime=true
BACKEND_URL=https://api.yourdomain.com

GO_ENV=production
DENO_ENV=production
LOG_LEVEL=info
ENABLE_METRICS=true

# Security
SESSION_SECRET=your_session_secret_64_chars_min
JWT_SECRET=your_jwt_secret_64_chars_min

# SSL
SSL_CERT_PATH=/etc/ssl/certs/app.crt
SSL_KEY_PATH=/etc/ssl/private/app.key

# Resource limits
MYSQL_MAX_CONNECTIONS=200
BACKEND_MAX_MEMORY=2G
FRONTEND_MAX_MEMORY=1G
```

**Characteristics:**
- Strong, unique passwords
- HTTPS URLs
- SSL certificate configuration
- Resource limits and optimization
- Security secrets properly configured

---

## Port Configuration

### Default Ports

| Service | Development | Test | Production | Purpose |
|---------|-------------|------|------------|---------|
| Frontend | 8007 | 8071 | 80/443 | Web interface |
| Backend | 3007 | 30071 | 3007 | API server |
| Database | 3307 | 33061 | 3306 | MySQL |

### Changing Ports

To avoid conflicts, modify ports in both `docker-compose.yml` and environment variables:

**docker-compose.yml:**
```yaml
services:
  frontend:
    ports:
      - "8080:8007"  # External:Internal
    environment:
      PORT: "8007"   # Keep internal port
  
  backend:
    ports:
      - "3080:3007"  # External:Internal
```

**Environment variables:**
```bash
# Update BACKEND_URL to match external port
BACKEND_URL=http://localhost:3080
```

---

## Protocol Buffer Configuration

### Buf Configuration

**File**: `buf.yaml`

```yaml
version: v2
modules:
  - path: proto
lint:
  use:
    - BASIC
    - COMMENTS
    - UNARY_RPC
breaking:
  use:
    - FILE
    - PACKAGE
```

### Code Generation

**File**: `buf.gen.yaml`

```yaml
version: v2
managed:
  enabled: true
plugins:
  # Go server code
  - remote: buf.build/protocolbuffers/go
    out: backend/internal/gen
    opt:
      - paths=source_relative
  
  # Go ConnectRPC server
  - remote: buf.build/connectrpc/go
    out: backend/internal/gen
    opt:
      - paths=source_relative
  
  # TypeScript client code
  - remote: buf.build/bufbuild/es
    out: frontend/lib/gen
    opt:
      - target=ts
  
  # TypeScript ConnectRPC client
  - remote: buf.build/connectrpc/es
    out: frontend/lib/gen
    opt:
      - target=ts
```

### Buf Schema Registry

The project uses buf.build for schema management:

- **Registry**: https://buf.build/wcygan/simple-connect-web-stack
- **Generated Packages**: Available via npm
- **Breaking Change Detection**: Automated on push

---

## Docker Configuration

### Development Docker Compose

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-todos}
      MYSQL_USER: ${MYSQL_USER:-taskuser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-taskpassword}
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-utaskuser", "-ptaskpassword"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 30s

  backend:
    build:
      context: ./backend
      target: development
    environment:
      DATABASE_URL: ${DATABASE_URL:-taskuser:taskpassword@tcp(mysql:3306)/todos?parseTime=true}
      GO_ENV: ${GO_ENV:-development}
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "3007:3007"

  frontend:
    build:
      context: ./frontend
      target: development
    environment:
      BACKEND_URL: ${BACKEND_URL:-http://backend:3007}
      DENO_ENV: ${DENO_ENV:-development}
    depends_on:
      - backend
    ports:
      - "8007:8007"

volumes:
  mysql_data:
```

### Production Docker Compose

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

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
```

---

## Configuration Validation

### Environment Validation Script

Create a script to validate environment configuration:

**File**: `scripts/validate-env.ts`

```typescript
import { load } from "@std/dotenv";

const requiredVars = [
  'MYSQL_ROOT_PASSWORD',
  'MYSQL_DATABASE', 
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'DATABASE_URL'
];

const optionalVars = [
  'BACKEND_URL',
  'GO_ENV',
  'DENO_ENV',
  'LOG_LEVEL'
];

async function validateEnvironment() {
  const env = await load();
  
  console.log('🔍 Validating environment configuration...\n');
  
  let hasErrors = false;
  
  // Check required variables
  for (const varName of requiredVars) {
    if (!env[varName]) {
      console.log(`❌ Missing required variable: ${varName}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: configured`);
    }
  }
  
  // Check optional variables
  console.log('\n📋 Optional variables:');
  for (const varName of optionalVars) {
    if (env[varName]) {
      console.log(`✅ ${varName}: ${env[varName]}`);
    } else {
      console.log(`⚠️  ${varName}: using default`);
    }
  }
  
  // Validate DATABASE_URL format
  if (env.DATABASE_URL && env.DATABASE_URL.startsWith('mysql://')) {
    console.log('\n❌ DATABASE_URL format error:');
    console.log('   Found: mysql://...');
    console.log('   Expected: username:password@tcp(host:port)/database?parseTime=true');
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.log('\n🚨 Configuration errors found. Please check your .env file.');
    Deno.exit(1);
  }
  
  console.log('\n✅ Environment configuration is valid!');
}

if (import.meta.main) {
  await validateEnvironment();
}
```

**Usage:**
```bash
deno run -A scripts/validate-env.ts
```

---

## Security Considerations

### Secrets Management

**Never commit secrets to version control:**

```bash
# Add to .gitignore
.env
.env.local
.env.production
*.key
*.pem
```

**Use secure secret generation:**

```bash
# Generate secure passwords
openssl rand -base64 32

# Generate session secrets
openssl rand -hex 64
```

### Environment Isolation

**Development vs Production:**

```bash
# Development - use simple values
MYSQL_PASSWORD=password

# Production - use strong values
MYSQL_PASSWORD=$(openssl rand -base64 32)
```

### Docker Secrets

For Docker Swarm or Kubernetes:

```yaml
services:
  backend:
    secrets:
      - mysql_password
    environment:
      MYSQL_PASSWORD_FILE: /run/secrets/mysql_password

secrets:
  mysql_password:
    external: true
```

---

## Troubleshooting

### Common Configuration Issues

#### 1. Database Connection Failures

**Error**: `default addr for network 'mysql:3306' unknown`

**Solution**: Check DATABASE_URL format:
```bash
# Wrong
DATABASE_URL=mysql://user:pass@host:port/db

# Correct
DATABASE_URL=user:pass@tcp(host:port)/db?parseTime=true
```

#### 2. Port Conflicts

**Error**: `port already in use`

**Solution**: Check for conflicting services:
```bash
lsof -i :8007  # Check frontend port
lsof -i :3007  # Check backend port
lsof -i :3307  # Check database port
```

#### 3. Environment Variable Not Loading

**Error**: Variables not being read

**Solution**: Verify file location and format:
```bash
# Check file exists
ls -la .env

# Check file format (no spaces around =)
cat .env | grep "="
```

### Configuration Debugging

Enable debug mode to see configuration loading:

```bash
# Backend
GO_ENV=development LOG_LEVEL=debug

# Frontend  
DENO_ENV=development DEBUG=true
```

---

For more advanced configuration topics, see:
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Deno Configuration](https://deno.land/manual/getting_started/configuration_file)
- [Go Configuration Best Practices](https://golang.org/doc/code.html)