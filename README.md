# simple-connect-web-stack

Modern todo application using ConnectRPC + Go backend with Deno Fresh frontend.

## Quick Start

```bash
# Initialize project structure
deno run -A scripts/init-v2.ts

# Generate code from protobuf
buf generate

# Start development environment
deno task up
```

## Architecture

**v2 Stack:**
- Frontend: Deno Fresh 2.0 + Preact Signals
- Backend: Go + ConnectRPC 
- Protocol: Protocol Buffers
- Database: MySQL 8.0

**v1 → v2 Migration:**
- REST API → RPC with Protocol Buffers
- Rust/Axum → Go/ConnectRPC
- Same frontend architecture (Deno Fresh)

## Project Structure

```
/frontend/  - Deno Fresh frontend (unchanged from v1)
/backend/   - Go + ConnectRPC backend
/proto/     - Protocol Buffer definitions
```

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidance.

Previous version documentation:
- [v1 Architecture](/v1) - Rust/Axum REST implementation