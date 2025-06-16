# Docker Build Solution for buf.build npm Packages

## Problem Summary

When building a Deno Fresh application in Docker that uses buf.build npm packages for Protocol Buffers, the build fails with authentication errors even though the packages are public and don't require authentication.

### Error Encountered

```
error: missing field `shasum` at line 1 column 434
```

This occurs when Docker tries to access buf.build's custom npm registry during the build process.

## Root Cause

1. **Custom npm Registry**: buf.build packages are hosted on a custom npm registry (`https://buf.build/gen/npm/v1/`)
2. **Docker Context**: The `.npmrc` file with the custom registry configuration isn't properly utilized during Docker builds
3. **ESM Module Issues**: Fresh's build process encounters "Not an ESM module" errors with certain buf.build packages

## Solution: Pre-built Assets Approach

Instead of building during Docker image creation, use pre-built assets from local development.

### Implementation Steps

1. **Configure .npmrc** (already in place):
```
@buf:registry=https://buf.build/gen/npm/v1/
```

2. **Update deno.json** with proper configuration:
```json
{
  "nodeModulesDir": "auto",
  "vendor": true,
  "imports": {
    "@buf/wcygan_simple-connect-web-stack.bufbuild_es": "npm:@buf/wcygan_simple-connect-web-stack.bufbuild_es@^2.5.2-20250615194027-1ba9625cc7f0.1",
    // ... other imports
  }
}
```

3. **Build locally** before Docker:
```bash
deno task build
```

4. **Create optimized Dockerfile**:
```dockerfile
# Use pre-built assets approach
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

5. **Update .dockerignore** to include pre-built assets:
```
# Development files
.vscode/
.git/

# Logs
*.log

# Temporary files
*.tmp
*.temp

# OS files
.DS_Store
Thumbs.db

# Include pre-built assets
!_fresh/
!node_modules/
```

## Alternative Approaches Considered

### 1. Vendor Dependencies (Not viable in Deno 2)
- `deno vendor` command was removed in Deno 2
- Replaced by `"vendor": true` configuration option

### 2. Multi-stage Build with Authentication
- Would require authentication tokens in Docker build
- Not necessary for public packages

### 3. Direct npm Specifiers
- Would require rewriting all imports
- Not maintainable

### 4. Development Mode in Docker
- Results in continuous build failures due to ESM issues
- Not suitable for production

## Port Migration

To avoid conflicts with OrbStack and other services:

- Frontend: 8000 → 8007
- Backend: 3000 → 3007  
- Database: 3306 → 3307

### Configuration Updates

**docker-compose.yml**:
```yaml
services:
  frontend:
    ports:
      - "8007:8007"
    environment:
      PORT: "8007"
      BACKEND_URL: "http://backend:3007"
```

**Backend port configuration**:
```go
port := os.Getenv("PORT")
if port == "" {
    port = "3007"
}
```

**Frontend API proxy**:
```typescript
const backendUrl = `${Deno.env.get("BACKEND_URL") || "http://localhost:3007"}${url.pathname.replace('/api', '')}${url.search}`;
```

## Verification Steps

1. **Test locally**:
```bash
deno task build
deno task dev
```

2. **Build Docker image**:
```bash
docker-compose build frontend
```

3. **Run full stack**:
```bash
docker-compose up -d
```

4. **Verify connectivity**:
```bash
# Frontend
curl http://localhost:8007/

# Backend health check
curl -X POST http://localhost:3007/todo.v1.TodoService/HealthCheck \
  -H "Content-Type: application/json" -d '{}'

# API proxy test
curl -X POST http://localhost:8007/api/todo.v1.TodoService/ListTasks \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 20}'
```

## Key Takeaways

1. **Public buf.build packages don't require authentication** - The `.npmrc` file only needs the registry URL
2. **Pre-built assets are more reliable** than building in Docker when using custom npm registries
3. **ESM module compatibility** can be an issue with some npm packages in Fresh's build process
4. **Port configuration** should be environment-based for flexibility
5. **Deno 2 changes** - Vendor command removed, replaced with configuration options

## Benefits of This Approach

- **No authentication required** in Docker builds
- **Faster Docker builds** - No compilation step
- **Deterministic builds** - Same assets in dev and production
- **Simplified Dockerfile** - Fewer build steps and dependencies
- **Works with public buf.build packages** out of the box

## Future Improvements

1. Consider GitHub Actions for automated builds with proper caching
2. Investigate Fresh's ESM compatibility for a pure Docker build solution
3. Implement build caching strategies for faster local development
4. Create a multi-stage Dockerfile that falls back to pre-built assets if build fails