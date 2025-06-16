#!/usr/bin/env -S deno run --allow-all

/**
 * Comprehensive test runner for the Simple Connect Web Stack
 * Orchestrates unit, integration, and e2e tests with proper reporting
 */

import { $ } from "@david/dax";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";

interface TestResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  output?: string;
  error?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalDuration: number;
  passed: number;
  failed: number;
  skipped: number;
}

class TestRunner {
  private results: TestSuite[] = [];
  private startTime = Date.now();

  async run() {
    console.log("🚀 Starting comprehensive test suite for Simple Connect Web Stack\n");

    // Ensure test results directory exists
    await ensureDir("test-results");

    try {
      // Run tests in order based on dependencies
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runE2ETests();
      
      // Generate final report
      await this.generateReport();
      
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      Deno.exit(1);
    }
  }

  private async runUnitTests(): Promise<void> {
    console.log("📋 Running Unit Tests...\n");
    
    const suite: TestSuite = {
      name: "Unit Tests",
      results: [],
      totalDuration: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // Frontend unit tests
    await this.runTest(suite, "Frontend Unit Tests", async () => {
      return await $`cd frontend && deno test --coverage=./coverage --reporter=json`.quiet();
    });

    // Backend unit tests
    await this.runTest(suite, "Backend Unit Tests", async () => {
      return await $`cd backend && go test -v -json -coverprofile=coverage.out ./...`.quiet();
    });

    this.results.push(suite);
    this.logSuiteResults(suite);
  }

  private async runIntegrationTests(): Promise<void> {
    console.log("\n🔗 Running Integration Tests...\n");

    const suite: TestSuite = {
      name: "Integration Tests",
      results: [],
      totalDuration: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // Start test environment
    await this.runTest(suite, "Setup Test Environment", async () => {
      return await $`docker-compose -f docker-compose.test.yml up -d test-db test-backend`.quiet();
    });

    // Wait for services to be ready
    await this.runTest(suite, "Wait for Services", async () => {
      return await this.waitForServices();
    });

    // Run integration tests
    await this.runTest(suite, "ConnectRPC Integration", async () => {
      return await $`deno run -A scripts/test-integration.ts`.quiet();
    });

    // Run database tests
    await this.runTest(suite, "Database Integration", async () => {
      return await $`deno run -A scripts/test-database.ts`.quiet();
    });

    this.results.push(suite);
    this.logSuiteResults(suite);
  }

  private async runE2ETests(): Promise<void> {
    console.log("\n🌐 Running End-to-End Tests...\n");

    const suite: TestSuite = {
      name: "E2E Tests",
      results: [],
      totalDuration: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // Start full stack
    await this.runTest(suite, "Setup Full Stack", async () => {
      return await $`docker-compose -f docker-compose.test.yml up -d test-frontend`.quiet();
    });

    // Run E2E tests
    await this.runTest(suite, "Browser Tests", async () => {
      return await $`docker-compose -f docker-compose.test.yml run --rm playwright npm test`.quiet();
    });

    this.results.push(suite);
    this.logSuiteResults(suite);
  }

  private async runTest(
    suite: TestSuite,
    name: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`  ⏳ ${name}...`);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        name,
        status: "passed",
        duration,
        output: result?.stdout
      };

      suite.results.push(testResult);
      suite.passed++;
      suite.totalDuration += duration;

      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        name,
        status: "failed",
        duration,
        error: error.message,
        output: error.stdout
      };

      suite.results.push(testResult);
      suite.failed++;
      suite.totalDuration += duration;

      console.log(`  ❌ ${name} (${duration}ms)`);
      console.log(`     Error: ${error.message}`);
    }
  }

  private async waitForServices(): Promise<any> {
    const maxRetries = 30;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Check if backend is healthy
        const response = await fetch("http://localhost:30071/todo.v1.TodoService/HealthCheck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });

        if (response.ok) {
          return { stdout: "Services are ready" };
        }
      } catch {
        // Service not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error("Services failed to start within timeout");
  }

  private logSuiteResults(suite: TestSuite): void {
    const total = suite.passed + suite.failed + suite.skipped;
    console.log(`\n📊 ${suite.name} Results:`);
    console.log(`   Passed: ${suite.passed}/${total}`);
    console.log(`   Failed: ${suite.failed}/${total}`);
    console.log(`   Duration: ${suite.totalDuration}ms`);
  }

  private async generateReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    const totalTests = totalPassed + totalFailed;

    console.log("\n" + "=".repeat(60));
    console.log("📈 FINAL TEST REPORT");
    console.log("=".repeat(60));
    
    for (const suite of this.results) {
      console.log(`\n${suite.name}:`);
      console.log(`  ✅ Passed: ${suite.passed}`);
      console.log(`  ❌ Failed: ${suite.failed}`);
      console.log(`  ⏱️  Duration: ${suite.totalDuration}ms`);
    }

    console.log(`\n📋 SUMMARY:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed} (${Math.round((totalPassed / totalTests) * 100)}%)`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Total Duration: ${totalDuration}ms`);

    // Write JSON report
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: { totalTests, totalPassed, totalFailed },
      suites: this.results
    };

    await Deno.writeTextFile(
      join("test-results", "test-report.json"),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n📁 Detailed report saved to: test-results/test-report.json`);

    // Cleanup test environment
    console.log("\n🧹 Cleaning up test environment...");
    try {
      await $`docker-compose -f docker-compose.test.yml down`.quiet();
    } catch {
      // Ignore cleanup errors
    }

    // Exit with appropriate code
    if (totalFailed > 0) {
      console.log("\n❌ Some tests failed. See report for details.");
      Deno.exit(1);
    } else {
      console.log("\n🎉 All tests passed!");
      Deno.exit(0);
    }
  }
}

// Run the test suite
if (import.meta.main) {
  const runner = new TestRunner();
  await runner.run();
}