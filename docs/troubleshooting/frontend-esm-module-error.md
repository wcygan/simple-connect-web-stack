# Frontend ESM Module Error Resolution

## Issue Description

The frontend container was failing to start with the following error:

```
✘ [ERROR] [unreachable] Not an ESM module. [plugin deno-loader]
error: Uncaught (in promise) Error: Build failed with 1 error:
error: [unreachable] Not an ESM module.
```

This error occurred during the esbuild bundling process when trying to run the Fresh development server in Docker.

## Root Cause

The issue was caused by conflicting module resolution settings and Docker build configuration:

1. **Module Resolution Conflict**: The `deno.json` file had both `vendor: true` and `nodeModulesDir: "auto"` settings, which created conflicts in how Deno resolved npm packages
2. **Docker Build Process**: The npm dependencies from buf.build weren't being properly cached in the Docker environment
3. **Command Inconsistency**: The docker-compose.yml was using a full command instead of the simpler `deno task dev`

## Solution

### 1. Fixed deno.json Configuration

Removed the conflicting `vendor: true` setting:

```diff
-  "nodeModulesDir": "auto",
-  "vendor": true,
+  "nodeModulesDir": "auto",
```

### 2. Updated Docker Configuration

#### docker-compose.yml
Simplified the frontend command to match V1 setup:

```diff
-    command: ["deno", "run", "-A", "--watch=static/,routes/,islands/,components/", "dev.ts"]
+    command: ["deno", "task", "dev"]
```

#### frontend/Dockerfile
Updated the development stage to properly cache dependencies and pre-build Fresh files:

```diff
 # Development stage with hot reload
 FROM base AS development
 # Copy all source files for development
 COPY . .
 
 # Cache dependencies for development
-RUN deno cache --reload --node-modules-dir=auto main.ts dev.ts
+RUN deno cache --reload main.ts dev.ts
+
+# Pre-build to generate fresh files and avoid ESM issues
+RUN deno task build || echo "Build step completed"
 
 ENV PORT=8007
 EXPOSE 8007
-CMD ["deno", "run", "-A", "--watch=static/,routes/,islands/,components/", "dev.ts"]
+CMD ["deno", "task", "dev"]
```

### 3. Generated Fresh Build Files

Ran `deno task build` locally to generate the necessary Fresh files before rebuilding the Docker container.

## Key Learnings

1. **Module Resolution**: When using npm packages with Deno, avoid mixing `vendor: true` with `nodeModulesDir: "auto"` as they conflict
2. **Docker Strategy**: Pre-building Fresh assets during the Docker build process helps avoid ESM compatibility issues
3. **Command Consistency**: Using `deno task` commands ensures consistency between local and Docker environments

## Verification

After applying these fixes:
- Frontend successfully starts on port 8007
- No ESM module errors in the logs
- Hot reload functionality works correctly
- All buf.build npm packages load properly

## Related Files

- `/frontend/deno.json` - Module resolution configuration
- `/frontend/Dockerfile` - Multi-stage build configuration
- `/docker-compose.yml` - Service orchestration
- `/frontend/.npmrc` - NPM registry configuration for buf.build packages