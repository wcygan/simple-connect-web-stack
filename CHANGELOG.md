# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Resolved Docker build failures with buf.build npm packages
- Fixed port conflicts with OrbStack by migrating to new ports (8007, 3007, 3307)
- Addressed ESM module errors in Fresh build process
- Corrected Fresh 2.0 routing issues by removing deprecated createDefine pattern

### Changed
- Updated all services to use new port configuration
- Modified Docker build strategy to use pre-built assets
- Enhanced frontend Dockerfile to avoid authentication requirements
- Improved API proxy configuration for new backend port

### Added
- Comprehensive documentation for Docker buf.build solution
- Port configuration via environment variables
- .npmrc file for buf.build registry configuration
- Docker build troubleshooting guide

## [2.0.0] - 2025-06-15

### Changed
- **BREAKING**: Migrated from REST API to ConnectRPC with Protocol Buffers
- **BREAKING**: Replaced Rust/Axum backend with Go/ConnectRPC implementation
- **BREAKING**: Updated all API endpoints to use RPC protocol
- Maintained Deno Fresh frontend architecture from v1

### Added
- Protocol Buffer service definitions for todo operations
- Auto-generated TypeScript and Go clients via buf.build
- ConnectRPC server implementation in Go
- Type-safe communication between frontend and backend
- buf.yaml configuration for code generation
- Integration with buf.build schema registry

### Technical Stack
- Frontend: Deno Fresh 2.0 + Preact Signals + ConnectRPC Web
- Backend: Go + ConnectRPC + MySQL driver
- Protocol: Protocol Buffers 3
- Database: MySQL 8.0

## [1.0.0] - 2025-06-01

### Added
- Initial release with Rust/Axum backend
- REST API for todo operations
- Deno Fresh frontend with Preact
- MySQL database integration
- Docker Compose orchestration
- Hot reload for development

### Technical Stack
- Frontend: Deno Fresh + Preact Signals
- Backend: Rust + Axum + SQLx
- API: REST with JSON
- Database: MySQL 8.0