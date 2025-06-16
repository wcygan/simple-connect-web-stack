package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestLogLevel(t *testing.T) {
	tests := []struct {
		level    LogLevel
		expected string
	}{
		{LevelDebug, "DEBUG"},
		{LevelInfo, "INFO"},
		{LevelWarn, "WARN"},
		{LevelError, "ERROR"},
		{LogLevel(99), "UNKNOWN"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			if got := tt.level.String(); got != tt.expected {
				t.Errorf("LogLevel.String() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestGetLogLevel(t *testing.T) {
	tests := []struct {
		input    string
		expected LogLevel
	}{
		{"DEBUG", LevelDebug},
		{"debug", LevelDebug},
		{"INFO", LevelInfo},
		{"info", LevelInfo},
		{"WARN", LevelWarn},
		{"warn", LevelWarn},
		{"WARNING", LevelWarn},
		{"warning", LevelWarn},
		{"ERROR", LevelError},
		{"error", LevelError},
		{"unknown", LevelInfo}, // default
		{"", LevelInfo},        // default
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := GetLogLevel(tt.input); got != tt.expected {
				t.Errorf("GetLogLevel(%v) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestStructuredLogger(t *testing.T) {
	var buf bytes.Buffer
	logger := &StructuredLogger{
		level:  LevelDebug,
		logger: log.New(&buf, "", 0),
	}

	ctx := context.Background()
	fields := map[string]interface{}{
		"key1": "value1",
		"key2": 42,
	}

	t.Run("debug logging", func(t *testing.T) {
		buf.Reset()
		logger.Debug(ctx, "debug message", fields)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Level != "DEBUG" {
			t.Errorf("Expected level DEBUG, got %s", entry.Level)
		}
		if entry.Message != "debug message" {
			t.Errorf("Expected message 'debug message', got %s", entry.Message)
		}
		if entry.Fields["key1"] != "value1" {
			t.Error("Expected fields to be preserved")
		}
	})

	t.Run("info logging", func(t *testing.T) {
		buf.Reset()
		logger.Info(ctx, "info message", fields)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Level != "INFO" {
			t.Errorf("Expected level INFO, got %s", entry.Level)
		}
		if entry.Message != "info message" {
			t.Errorf("Expected message 'info message', got %s", entry.Message)
		}
	})

	t.Run("warn logging", func(t *testing.T) {
		buf.Reset()
		logger.Warn(ctx, "warn message", fields)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Level != "WARN" {
			t.Errorf("Expected level WARN, got %s", entry.Level)
		}
		if entry.Message != "warn message" {
			t.Errorf("Expected message 'warn message', got %s", entry.Message)
		}
	})

	t.Run("error logging", func(t *testing.T) {
		buf.Reset()
		testErr := errors.New("test error")
		logger.Error(ctx, "error message", testErr, fields)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Level != "ERROR" {
			t.Errorf("Expected level ERROR, got %s", entry.Level)
		}
		if entry.Message != "error message" {
			t.Errorf("Expected message 'error message', got %s", entry.Message)
		}
		if entry.Error != "test error" {
			t.Errorf("Expected error 'test error', got %s", entry.Error)
		}
	})

	t.Run("log level filtering", func(t *testing.T) {
		// Create logger with WARN level
		warnLogger := &StructuredLogger{
			level:  LevelWarn,
			logger: log.New(&buf, "", 0),
		}
		
		buf.Reset()
		warnLogger.Debug(ctx, "debug message", nil)
		warnLogger.Info(ctx, "info message", nil)
		
		// Should not log debug or info messages
		if buf.Len() > 0 {
			t.Error("Expected no output for debug/info messages with WARN level")
		}
		
		warnLogger.Warn(ctx, "warn message", nil)
		if buf.Len() == 0 {
			t.Error("Expected output for warn message with WARN level")
		}
	})

	t.Run("with request ID", func(t *testing.T) {
		buf.Reset()
		ctxWithID := WithRequestID(ctx, "test-request-id")
		logger.Info(ctxWithID, "message with request ID", nil)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.RequestID != "test-request-id" {
			t.Errorf("Expected request ID 'test-request-id', got %s", entry.RequestID)
		}
	})
}

func TestRequestIDMiddleware(t *testing.T) {
	handler := RequestIDMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check that request ID is in context
		requestID := getRequestID(r.Context())
		if requestID == "" {
			t.Error("Expected request ID in context")
		}
		
		// Check that request ID is in response headers
		headerID := w.Header().Get("X-Request-ID")
		if headerID == "" {
			t.Error("Expected request ID in response headers")
		}
		
		if requestID != headerID {
			t.Error("Request ID in context should match header")
		}
		
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	handler.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	if w.Header().Get("X-Request-ID") == "" {
		t.Error("Expected X-Request-ID header in response")
	}
}

func TestGetRequestID(t *testing.T) {
	t.Run("nil context", func(t *testing.T) {
		id := getRequestID(nil)
		if id != "" {
			t.Errorf("Expected empty string for nil context, got %s", id)
		}
	})

	t.Run("context without request ID", func(t *testing.T) {
		ctx := context.Background()
		id := getRequestID(ctx)
		if id != "" {
			t.Errorf("Expected empty string for context without request ID, got %s", id)
		}
	})

	t.Run("context with request ID", func(t *testing.T) {
		ctx := WithRequestID(context.Background(), "test-id")
		id := getRequestID(ctx)
		if id != "test-id" {
			t.Errorf("Expected 'test-id', got %s", id)
		}
	})

	t.Run("context with wrong type", func(t *testing.T) {
		ctx := context.WithValue(context.Background(), "request_id", 123)
		id := getRequestID(ctx)
		if id != "" {
			t.Errorf("Expected empty string for wrong type, got %s", id)
		}
	})
}

func TestWithRequestID(t *testing.T) {
	ctx := context.Background()
	ctxWithID := WithRequestID(ctx, "test-request-id")
	
	if ctxWithID == ctx {
		t.Error("Expected new context to be different from original")
	}
	
	id := getRequestID(ctxWithID)
	if id != "test-request-id" {
		t.Errorf("Expected 'test-request-id', got %s", id)
	}
}

func TestNewStructuredLogger(t *testing.T) {
	logger := NewStructuredLogger(LevelInfo)
	
	if logger == nil {
		t.Fatal("Expected logger to be created")
	}
	
	if logger.level != LevelInfo {
		t.Errorf("Expected level INFO, got %v", logger.level)
	}
	
	if logger.logger == nil {
		t.Error("Expected internal logger to be set")
	}
	
	// Test that service metadata is set
	if logger.service == "" {
		t.Error("Expected service name to be set")
	}
	
	if logger.version == "" {
		t.Error("Expected version to be set")
	}
	
	if logger.environment == "" {
		t.Error("Expected environment to be set")
	}
}

func TestNewStructuredLoggerWithMetadata(t *testing.T) {
	logger := NewStructuredLoggerWithMetadata(LevelDebug, "test-service", "v1.0.0", "test")
	
	if logger == nil {
		t.Fatal("Expected logger to be created")
	}
	
	if logger.service != "test-service" {
		t.Errorf("Expected service 'test-service', got %s", logger.service)
	}
	
	if logger.version != "v1.0.0" {
		t.Errorf("Expected version 'v1.0.0', got %s", logger.version)
	}
	
	if logger.environment != "test" {
		t.Errorf("Expected environment 'test', got %s", logger.environment)
	}
}

func TestLogDatabaseOperation(t *testing.T) {
	var buf bytes.Buffer
	logger := &StructuredLogger{
		level:       LevelInfo,
		logger:      log.New(&buf, "", 0),
		service:     "test-service",
		version:     "v1.0.0",
		environment: "test",
	}

	ctx := context.Background()
	duration := 50 * time.Millisecond

	t.Run("successful operation", func(t *testing.T) {
		buf.Reset()
		logger.LogDatabaseOperation(ctx, "INSERT users", duration, true, 1)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Message != "Database operation completed" {
			t.Errorf("Expected 'Database operation completed', got %s", entry.Message)
		}
		
		if entry.Fields["operation"] != "INSERT users" {
			t.Error("Expected operation field to be set")
		}
		
		if entry.Fields["category"] != "database" {
			t.Error("Expected category to be 'database'")
		}
		
		if entry.Service != "test-service" {
			t.Error("Expected service metadata to be included")
		}
	})

	t.Run("failed operation", func(t *testing.T) {
		buf.Reset()
		logger.LogDatabaseOperation(ctx, "UPDATE users", duration, false, 0)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Message != "Database operation failed" {
			t.Errorf("Expected 'Database operation failed', got %s", entry.Message)
		}
		
		if entry.Level != "WARN" {
			t.Errorf("Expected WARN level, got %s", entry.Level)
		}
	})
}

func TestLogServiceCall(t *testing.T) {
	var buf bytes.Buffer
	logger := &StructuredLogger{
		level:       LevelInfo,
		logger:      log.New(&buf, "", 0),
		service:     "test-service",
		version:     "v1.0.0",
		environment: "test",
	}

	ctx := context.Background()
	duration := 100 * time.Millisecond

	t.Run("successful call", func(t *testing.T) {
		buf.Reset()
		logger.LogServiceCall(ctx, "auth-service", "POST", "/api/login", 200, duration)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Message != "Service call completed" {
			t.Errorf("Expected 'Service call completed', got %s", entry.Message)
		}
		
		if entry.Fields["service"] != "auth-service" {
			t.Error("Expected service field to be set")
		}
		
		if entry.Fields["success"] != true {
			t.Error("Expected success to be true")
		}
	})

	t.Run("failed call", func(t *testing.T) {
		buf.Reset()
		logger.LogServiceCall(ctx, "auth-service", "POST", "/api/login", 401, duration)
		
		var entry LogEntry
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("Failed to parse log JSON: %v", err)
		}
		
		if entry.Message != "Service call failed" {
			t.Errorf("Expected 'Service call failed', got %s", entry.Message)
		}
		
		if entry.Level != "ERROR" {
			t.Errorf("Expected ERROR level, got %s", entry.Level)
		}
		
		if entry.Fields["success"] != false {
			t.Error("Expected success to be false")
		}
	})
}

func TestLogMetrics(t *testing.T) {
	var buf bytes.Buffer
	logger := &StructuredLogger{
		level:       LevelInfo,
		logger:      log.New(&buf, "", 0),
		service:     "test-service",
		version:     "v1.0.0",
		environment: "test",
	}

	ctx := context.Background()
	metrics := map[string]interface{}{
		"cpu_usage":    85.5,
		"memory_usage": 1024,
		"goroutines":   42,
	}

	buf.Reset()
	logger.LogMetrics(ctx, metrics)
	
	var entry LogEntry
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log JSON: %v", err)
	}
	
	if entry.Message != "Performance metrics" {
		t.Errorf("Expected 'Performance metrics', got %s", entry.Message)
	}
	
	if entry.Fields["category"] != "metrics" {
		t.Error("Expected category to be 'metrics'")
	}
	
	if entry.Fields["cpu_usage"] != 85.5 {
		t.Error("Expected cpu_usage metric to be preserved")
	}
	
	if entry.Fields["memory_usage"] != float64(1024) {
		t.Error("Expected memory_usage metric to be preserved")
	}
}

func TestWithSource(t *testing.T) {
	ctx := context.Background()
	ctxWithSource := WithSource(ctx, "test.function")
	
	source := getSource(ctxWithSource)
	if source != "test.function" {
		t.Errorf("Expected 'test.function', got %s", source)
	}
}