package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// LogLevel represents the logging level
type LogLevel int

const (
	LevelDebug LogLevel = iota
	LevelInfo
	LevelWarn
	LevelError
)

func (l LogLevel) String() string {
	switch l {
	case LevelDebug:
		return "DEBUG"
	case LevelInfo:
		return "INFO"
	case LevelWarn:
		return "WARN"
	case LevelError:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}

// StructuredLogger provides structured logging with JSON output
type StructuredLogger struct {
	level       LogLevel
	logger      *log.Logger
	service     string
	version     string
	environment string
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp   time.Time              `json:"timestamp"`
	Level       string                 `json:"level"`
	Message     string                 `json:"message"`
	Error       string                 `json:"error,omitempty"`
	Fields      map[string]interface{} `json:"fields,omitempty"`
	RequestID   string                 `json:"request_id,omitempty"`
	Service     string                 `json:"service,omitempty"`
	Version     string                 `json:"version,omitempty"`
	Environment string                 `json:"environment,omitempty"`
	Source      string                 `json:"source,omitempty"`
}

// NewStructuredLogger creates a new structured logger
func NewStructuredLogger(level LogLevel) *StructuredLogger {
	return &StructuredLogger{
		level:       level,
		logger:      log.New(os.Stdout, "", 0), // No prefix/flags, we'll format ourselves
		service:     getEnvOrDefault("SERVICE_NAME", "todo-service"),
		version:     getEnvOrDefault("SERVICE_VERSION", "dev"),
		environment: getEnvOrDefault("ENVIRONMENT", "development"),
	}
}

// NewStructuredLoggerWithMetadata creates a logger with custom metadata
func NewStructuredLoggerWithMetadata(level LogLevel, service, version, environment string) *StructuredLogger {
	return &StructuredLogger{
		level:       level,
		logger:      log.New(os.Stdout, "", 0),
		service:     service,
		version:     version,
		environment: environment,
	}
}

// Debug logs a debug message
func (sl *StructuredLogger) Debug(ctx context.Context, msg string, fields map[string]interface{}) {
	if sl.level <= LevelDebug {
		sl.log(ctx, LevelDebug, msg, nil, fields)
	}
}

// Info logs an info message
func (sl *StructuredLogger) Info(ctx context.Context, msg string, fields map[string]interface{}) {
	if sl.level <= LevelInfo {
		sl.log(ctx, LevelInfo, msg, nil, fields)
	}
}

// Warn logs a warning message
func (sl *StructuredLogger) Warn(ctx context.Context, msg string, fields map[string]interface{}) {
	if sl.level <= LevelWarn {
		sl.log(ctx, LevelWarn, msg, nil, fields)
	}
}

// Error logs an error message
func (sl *StructuredLogger) Error(ctx context.Context, msg string, err error, fields map[string]interface{}) {
	if sl.level <= LevelError {
		sl.log(ctx, LevelError, msg, err, fields)
	}
}

// log outputs a structured log entry
func (sl *StructuredLogger) log(ctx context.Context, level LogLevel, msg string, err error, fields map[string]interface{}) {
	entry := LogEntry{
		Timestamp:   time.Now().UTC(),
		Level:       level.String(),
		Message:     msg,
		Fields:      fields,
		Service:     sl.service,
		Version:     sl.version,
		Environment: sl.environment,
	}

	if err != nil {
		entry.Error = err.Error()
	}

	// Extract request ID from context if available
	if requestID := getRequestID(ctx); requestID != "" {
		entry.RequestID = requestID
	}

	// Add source information from context if available
	if source := getSource(ctx); source != "" {
		entry.Source = source
	}

	// Marshal to JSON
	jsonData, jsonErr := json.Marshal(entry)
	if jsonErr != nil {
		// Fallback to simple logging if JSON marshaling fails
		sl.logger.Printf("[%s] %s (JSON marshal error: %v)", level.String(), msg, jsonErr)
		return
	}

	sl.logger.Println(string(jsonData))
}

// getRequestID extracts request ID from context
func getRequestID(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if id, ok := ctx.Value("request_id").(string); ok {
		return id
	}
	return ""
}

// RequestIDMiddleware adds a unique request ID to each request context
func RequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Generate a simple request ID (in production, use a proper UUID library)
		requestID := fmt.Sprintf("%d", time.Now().UnixNano())
		
		// Add request ID to context
		ctx := context.WithValue(r.Context(), "request_id", requestID)
		r = r.WithContext(ctx)
		
		// Add request ID to response headers for debugging
		w.Header().Set("X-Request-ID", requestID)
		
		next.ServeHTTP(w, r)
	})
}

// WithRequestID adds a request ID to the context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, "request_id", requestID)
}

// GetLogLevel parses log level from string
func GetLogLevel(level string) LogLevel {
	switch level {
	case "DEBUG", "debug":
		return LevelDebug
	case "INFO", "info":
		return LevelInfo
	case "WARN", "warn", "WARNING", "warning":
		return LevelWarn
	case "ERROR", "error":
		return LevelError
	default:
		return LevelInfo // Default to info level
	}
}

// getEnvOrDefault gets environment variable or returns default value
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getSource extracts source information from context
func getSource(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if source, ok := ctx.Value("source").(string); ok {
		return source
	}
	return ""
}

// WithSource adds source information to the context
func WithSource(ctx context.Context, source string) context.Context {
	return context.WithValue(ctx, "source", source)
}

// Performance logging helpers

// LogDatabaseOperation logs database operation with performance metrics
func (sl *StructuredLogger) LogDatabaseOperation(ctx context.Context, operation string, duration time.Duration, success bool, rowsAffected int64) {
	fields := map[string]interface{}{
		"operation":      operation,
		"duration_ms":    duration.Milliseconds(),
		"duration_ns":    duration.Nanoseconds(),
		"success":        success,
		"rows_affected":  rowsAffected,
		"category":       "database",
	}

	if success {
		sl.Info(ctx, "Database operation completed", fields)
	} else {
		sl.Warn(ctx, "Database operation failed", fields)
	}
}

// LogServiceCall logs external service calls with performance metrics
func (sl *StructuredLogger) LogServiceCall(ctx context.Context, service string, method string, url string, statusCode int, duration time.Duration) {
	fields := map[string]interface{}{
		"service":       service,
		"method":        method,
		"url":           url,
		"status_code":   statusCode,
		"duration_ms":   duration.Milliseconds(),
		"category":      "service_call",
		"success":       statusCode >= 200 && statusCode < 300,
	}

	if statusCode >= 400 {
		sl.Error(ctx, "Service call failed", nil, fields)
	} else {
		sl.Info(ctx, "Service call completed", fields)
	}
}

// LogMetrics logs performance metrics
func (sl *StructuredLogger) LogMetrics(ctx context.Context, metrics map[string]interface{}) {
	enrichedFields := map[string]interface{}{
		"category": "metrics",
	}
	
	// Merge metrics into fields
	for k, v := range metrics {
		enrichedFields[k] = v
	}
	
	sl.Info(ctx, "Performance metrics", enrichedFields)
}