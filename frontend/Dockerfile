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