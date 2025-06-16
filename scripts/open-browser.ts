#!/usr/bin/env deno run -A

/**
 * Opens the Simple Connect Web Stack frontend in the default browser
 */

import { cyan, green, yellow, red } from "jsr:@std/fmt@^1.0.8/colors";

const FRONTEND_URL = "http://localhost:8007";
const BACKEND_API_URL = "http://localhost:3007";

async function checkServiceHealth(url: string, name: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: name === "Frontend" ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: name !== "Frontend" ? "{}" : undefined,
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function openBrowser(url: string): Promise<void> {
  const platform = Deno.build.os;
  
  try {
    switch (platform) {
      case "darwin": // macOS
        await new Deno.Command("open", { args: [url] }).output();
        break;
      case "windows":
        await new Deno.Command("cmd", { args: ["/c", "start", url] }).output();
        break;
      case "linux":
        await new Deno.Command("xdg-open", { args: [url] }).output();
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    throw new Error(`Failed to open browser: ${error.message}`);
  }
}

async function main() {
  console.log(cyan("🌐 Opening Simple Connect Web Stack..."));
  console.log();

  // Check if services are running
  console.log("🔍 Checking service health...");
  
  const frontendHealthy = await checkServiceHealth(FRONTEND_URL, "Frontend");
  const backendHealthy = await checkServiceHealth(`${BACKEND_API_URL}/todo.v1.TodoService/HealthCheck`, "Backend");

  console.log(`  Frontend (${FRONTEND_URL}): ${frontendHealthy ? green("✅ Running") : red("❌ Not available")}`);
  console.log(`  Backend API (${BACKEND_API_URL}): ${backendHealthy ? green("✅ Running") : red("❌ Not available")}`);
  console.log();

  if (!frontendHealthy && !backendHealthy) {
    console.log(red("❌ No services are running!"));
    console.log(yellow("💡 Try running: deno task up"));
    Deno.exit(1);
  }

  if (!frontendHealthy) {
    console.log(yellow("⚠️  Frontend is not running, but attempting to open browser anyway..."));
    console.log(yellow("💡 The page may not load until you start the frontend with: deno task up"));
    console.log();
  }

  try {
    console.log(green(`🚀 Opening ${FRONTEND_URL} in your default browser...`));
    await openBrowser(FRONTEND_URL);
    console.log(green("✅ Browser opened successfully!"));
    
    if (frontendHealthy && backendHealthy) {
      console.log();
      console.log(cyan("📱 Application is ready to use!"));
      console.log(`   Frontend: ${FRONTEND_URL}`);
      console.log(`   Backend API: ${BACKEND_API_URL}`);
    }
  } catch (error) {
    console.log(red(`❌ Failed to open browser: ${error.message}`));
    console.log();
    console.log(yellow("🔗 Please manually open your browser and navigate to:"));
    console.log(cyan(`   ${FRONTEND_URL}`));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}