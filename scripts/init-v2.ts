#!/usr/bin/env -S deno run --allow-run --allow-write --allow-read

/**
 * Initialize the v2 project structure
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { $ } from "@david/dax";

const DIRS = [
  "frontend/routes",
  "frontend/islands", 
  "frontend/components",
  "frontend/lib",
  "frontend/tests",
  "backend/cmd/server",
  "backend/internal/service",
  "backend/internal/db",
  "backend/internal/models",
  "tests/integration",
  "tests/e2e",
];

console.log("🚀 Initializing v2 project structure...");

// Create directory structure
for (const dir of DIRS) {
  await ensureDir(dir);
  console.log(`✅ Created ${dir}`);
}

// Create backend go.mod
const goModContent = `module github.com/wcygan/simple-connect-web-stack

go 1.23

require (
    connectrpc.com/connect v1.17.0
    github.com/go-sql-driver/mysql v1.8.1
    github.com/google/uuid v1.6.0
    google.golang.org/protobuf v1.36.3
)
`;

await Deno.writeTextFile(join("backend", "go.mod"), goModContent);
console.log("✅ Created backend/go.mod");

// Create frontend deno.json
const frontendDenoContent = {
  "tasks": {
    "dev": "deno run -A --watch=static/,routes/ dev.ts",
    "build": "deno run -A dev.ts build",
    "start": "deno run -A main.ts",
    "update": "deno run -A -r https://fresh.deno.dev/update .",
    "test": "deno test -A"
  },
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@2.0.0-alpha.24/",
    "preact": "https://esm.sh/preact@10.24.3",
    "preact/": "https://esm.sh/preact@10.24.3/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.3.0",
    "@preact/signals-core": "https://esm.sh/*@preact/signals-core@1.8.0",
    "$std/": "https://deno.land/std@0.224.0/",
    "@connectrpc/connect": "npm:@connectrpc/connect@2.0.0",
    "@connectrpc/connect-web": "npm:@connectrpc/connect-web@2.0.0"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
};

await Deno.writeTextFile(
  join("frontend", "deno.json"),
  JSON.stringify(frontendDenoContent, null, 2)
);
console.log("✅ Created frontend/deno.json");

// Create a basic docker-compose.yml for v2
const dockerComposeContent = `version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: todos
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "root:root@tcp(db:3306)/todos?parseTime=true"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
    working_dir: /app
    command: air

  frontend:
    build: ./frontend
    ports:
      - "8000:8000"
    environment:
      BACKEND_URL: "http://backend:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
    working_dir: /app
    command: deno task dev

volumes:
  db_data:
`;

await Deno.writeTextFile("docker-compose.yml", dockerComposeContent);
console.log("✅ Created docker-compose.yml");

// Create backend Dockerfile
const backendDockerfile = `FROM golang:1.23-alpine

# Install air for hot reload
RUN go install github.com/air-verse/air@latest

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o server ./cmd/server

EXPOSE 3000

CMD ["air"]
`;

await Deno.writeTextFile(join("backend", "Dockerfile"), backendDockerfile);
console.log("✅ Created backend/Dockerfile");

// Create frontend Dockerfile
const frontendDockerfile = `FROM denoland/deno:2.1.4

WORKDIR /app

# Copy deps first for better caching
COPY deno.json ./
COPY fresh.gen.ts* ./
RUN deno cache fresh.gen.ts || true

# Copy source code
COPY . .

# Cache dependencies
RUN deno cache main.ts

EXPOSE 8000

CMD ["deno", "task", "start"]
`;

await Deno.writeTextFile(join("frontend", "Dockerfile"), frontendDockerfile);
console.log("✅ Created frontend/Dockerfile");

// Create .air.toml for backend hot reload
const airConfig = `root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ./cmd/server"
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  kill_delay = "0s"
  log = "build-errors.log"
  send_interrupt = false
  stop_on_error = true

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  time = false

[misc]
  clean_on_exit = false
`;

await Deno.writeTextFile(join("backend", ".air.toml"), airConfig);
console.log("✅ Created backend/.air.toml");

console.log("\n🎉 Project structure initialized!");
console.log("\nNext steps:");
console.log("1. Run 'buf generate' to generate code from proto files");
console.log("2. Run 'cd backend && go mod tidy' to download Go dependencies");
console.log("3. Run 'deno task up' to start the development environment");