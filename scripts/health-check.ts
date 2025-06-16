#!/usr/bin/env -S deno run --allow-all

/**
 * Health Check Script for Simple Connect Web Stack
 * Verifies all services are running and responsive
 */

import { $ } from "@david/dax";
import { delay } from "@std/async";

interface ServiceHealth {
  name: string;
  url: string;
  status: "healthy" | "unhealthy" | "unknown";
  responseTime?: number;
  error?: string;
}

class HealthChecker {
  private services: Array<{ name: string; url: string; healthPath?: string }> = [
    { 
      name: "Frontend", 
      url: "http://localhost:8007",
      healthPath: "/" 
    },
    { 
      name: "Backend", 
      url: "http://localhost:3007",
      healthPath: "/todo.v1.TodoService/HealthCheck" 
    },
    { 
      name: "Database", 
      url: "localhost:3307",
      // MySQL doesn't have HTTP health check, we'll check via backend
    },
  ];

  async checkAllServices(): Promise<ServiceHealth[]> {
    console.log("🔍 Checking service health...\n");
    
    const results: ServiceHealth[] = [];
    
    for (const service of this.services) {
      console.log(`  Checking ${service.name}...`);
      const health = await this.checkService(service);
      results.push(health);
      
      const statusIcon = health.status === "healthy" ? "✅" : 
                        health.status === "unhealthy" ? "❌" : "⚠️";
      const responseInfo = health.responseTime ? ` (${health.responseTime}ms)` : "";
      const errorInfo = health.error ? ` - ${health.error}` : "";
      
      console.log(`  ${statusIcon} ${service.name}: ${health.status}${responseInfo}${errorInfo}`);
    }
    
    return results;
  }

  private async checkService(service: { name: string; url: string; healthPath?: string }): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      if (service.name === "Database") {
        // Check database via backend health check
        return await this.checkDatabase();
      }
      
      const healthUrl = service.healthPath ? 
        `${service.url}${service.healthPath}` : 
        service.url;
      
      let response: Response;
      
      if (service.name === "Backend") {
        // Backend uses ConnectRPC POST requests
        response = await fetch(healthUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } else {
        // Frontend uses regular GET
        response = await fetch(healthUrl);
      }
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: service.name,
          url: service.url,
          status: "healthy",
          responseTime,
        };
      } else {
        return {
          name: service.name,
          url: service.url,
          status: "unhealthy",
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: service.name,
        url: service.url,
        status: "unhealthy",
        responseTime,
        error: error.message,
      };
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    // Check database connectivity via backend
    try {
      const response = await fetch("http://localhost:3007/todo.v1.TodoService/HealthCheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          name: "Database",
          url: "localhost:3307",
          status: data.status === "ok" ? "healthy" : "unhealthy",
        };
      } else {
        return {
          name: "Database",
          url: "localhost:3307",
          status: "unhealthy",
          error: "Backend health check failed",
        };
      }
    } catch (error) {
      return {
        name: "Database",
        url: "localhost:3307",
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  async checkDockerContainers(): Promise<void> {
    console.log("\n🐳 Docker Container Status:");
    try {
      const result = await $`docker-compose ps --format table`.text();
      console.log(result);
    } catch (error) {
      console.log(`❌ Failed to get container status: ${error.message}`);
    }
  }

  async checkDockerResources(): Promise<void> {
    console.log("\n📊 Resource Usage:");
    try {
      const result = await $`docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"`.text();
      console.log(result);
    } catch (error) {
      console.log(`❌ Failed to get resource stats: ${error.message}`);
    }
  }

  async performIntegrationTest(): Promise<boolean> {
    console.log("\n🧪 Running Quick Integration Test...");
    
    try {
      // Test creating a health check task
      const createResponse = await fetch("http://localhost:3007/todo.v1.TodoService/CreateTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Health Check Test Task" }),
      });

      if (!createResponse.ok) {
        console.log("❌ Failed to create test task");
        return false;
      }

      const createData = await createResponse.json();
      const taskId = createData.task?.id;

      if (!taskId) {
        console.log("❌ No task ID returned");
        return false;
      }

      // Test retrieving the task
      const getResponse = await fetch("http://localhost:3007/todo.v1.TodoService/GetTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });

      if (!getResponse.ok) {
        console.log("❌ Failed to retrieve test task");
        return false;
      }

      // Clean up - delete the test task
      await fetch("http://localhost:3007/todo.v1.TodoService/DeleteTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });

      console.log("✅ Integration test passed");
      return true;
    } catch (error) {
      console.log(`❌ Integration test failed: ${error.message}`);
      return false;
    }
  }

  generateReport(results: ServiceHealth[], integrationPassed: boolean): void {
    console.log("\n" + "=".repeat(50));
    console.log("📋 HEALTH CHECK REPORT");
    console.log("=".repeat(50));
    
    const healthy = results.filter(r => r.status === "healthy").length;
    const total = results.length;
    const allHealthy = healthy === total;
    
    console.log(`\n📈 Service Health: ${healthy}/${total} services healthy`);
    console.log(`🧪 Integration Test: ${integrationPassed ? "PASSED" : "FAILED"}`);
    console.log(`🎯 Overall Status: ${allHealthy && integrationPassed ? "HEALTHY" : "ISSUES DETECTED"}`);
    
    if (!allHealthy) {
      console.log("\n⚠️  Issues detected:");
      results
        .filter(r => r.status !== "healthy")
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.error || "unhealthy"}`);
        });
    }

    console.log("\n💡 Quick Commands:");
    console.log("  deno task logs     - View service logs");
    console.log("  deno task status   - Check container status");  
    console.log("  deno task restart  - Restart all services");
    console.log("  deno task monitor  - Monitor resource usage");
  }
}

async function main() {
  console.log("🏥 Simple Connect Web Stack - Health Check");
  console.log("=" .repeat(50));
  
  const checker = new HealthChecker();
  
  // Check service health
  const healthResults = await checker.checkAllServices();
  
  // Check Docker status
  await checker.checkDockerContainers();
  
  // Check resource usage
  await checker.checkDockerResources();
  
  // Run integration test
  const integrationPassed = await checker.performIntegrationTest();
  
  // Generate report
  checker.generateReport(healthResults, integrationPassed);
  
  // Exit with appropriate code
  const allHealthy = healthResults.every(r => r.status === "healthy");
  const overallHealthy = allHealthy && integrationPassed;
  
  Deno.exit(overallHealthy ? 0 : 1);
}

if (import.meta.main) {
  await main();
}