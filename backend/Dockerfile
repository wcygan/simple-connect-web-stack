# Multi-stage Dockerfile for development, testing, and production

# Base stage with common dependencies
FROM golang:1.24-alpine AS base
RUN apk add --no-cache git ca-certificates tzdata
WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum* ./
RUN go mod download

# Development stage with hot reload
FROM base AS development
# Install air for hot reload
RUN go install github.com/air-verse/air@latest
# Copy source code
COPY . .
EXPOSE 3007
CMD ["air"]

# Test stage with testing dependencies and tools
FROM base AS test
# Install testing tools
RUN go install github.com/golang/mock/mockgen@latest
RUN go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
RUN go install gotest.tools/gotestsum@latest

# Copy source code
COPY . .

# Run tests and generate coverage
RUN go test -v ./... -coverprofile=coverage.out
RUN go tool cover -html=coverage.out -o coverage.html

# Create test binary for integration tests
RUN go build -o test-server ./cmd/server

# Set up test environment
ENV GO_ENV=test
ENV TEST_MODE=true

EXPOSE 3007
CMD ["./test-server"]

# Build stage for production
FROM base AS builder
COPY . .
# Build with optimizations for production
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o server ./cmd/server

# Production stage
FROM alpine:latest AS production
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .
EXPOSE 3007
CMD ["./server"]

# Default to development stage
FROM development
