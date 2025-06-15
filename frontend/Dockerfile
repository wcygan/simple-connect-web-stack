FROM denoland/deno:2.1.4

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
