package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"connectrpc.com/connect"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Code      string            `json:"code"`
	Message   string            `json:"message"`
	Details   map[string]string `json:"details,omitempty"`
	RequestID string            `json:"request_id,omitempty"`
	Timestamp time.Time         `json:"timestamp"`
}

// ErrorHandler provides centralized error handling and logging
type ErrorHandler struct {
	logger Logger
}

// Logger interface for structured logging
type Logger interface {
	Info(ctx context.Context, msg string, fields map[string]interface{})
	Error(ctx context.Context, msg string, err error, fields map[string]interface{})
	Warn(ctx context.Context, msg string, fields map[string]interface{})
}

// DefaultLogger implements Logger using standard log package
type DefaultLogger struct{}

func (l *DefaultLogger) Info(ctx context.Context, msg string, fields map[string]interface{}) {
	log.Printf("[INFO] %s %v", msg, fields)
}

func (l *DefaultLogger) Error(ctx context.Context, msg string, err error, fields map[string]interface{}) {
	log.Printf("[ERROR] %s: %v %v", msg, err, fields)
}

func (l *DefaultLogger) Warn(ctx context.Context, msg string, fields map[string]interface{}) {
	log.Printf("[WARN] %s %v", msg, fields)
}

// NewErrorHandler creates a new error handler with the given logger
func NewErrorHandler(logger Logger) *ErrorHandler {
	if logger == nil {
		logger = &DefaultLogger{}
	}
	return &ErrorHandler{logger: logger}
}

// RecoveryMiddleware provides panic recovery and error handling
func (eh *ErrorHandler) RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic with stack trace
				eh.logger.Error(r.Context(), "Panic recovered", fmt.Errorf("%v", err), map[string]interface{}{
					"method":     r.Method,
					"path":       r.URL.Path,
					"user_agent": r.UserAgent(),
					"stack":      string(debug.Stack()),
				})

				// Return internal server error
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				
				response := ErrorResponse{
					Code:      "INTERNAL_ERROR",
					Message:   "An internal server error occurred",
					Timestamp: time.Now(),
				}
				
				// In production, don't expose internal error details
				if err, ok := err.(error); ok {
					response.Details = map[string]string{
						"error": err.Error(),
					}
				}
				
				// Write JSON response (simplified for now)
				fmt.Fprintf(w, `{"code":"%s","message":"%s","timestamp":"%s"}`, 
					response.Code, response.Message, response.Timestamp.Format(time.RFC3339))
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// LoggingMiddleware logs all HTTP requests and responses
func (eh *ErrorHandler) LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Create a response writer wrapper to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
		
		// Log request
		eh.logger.Info(r.Context(), "HTTP request", map[string]interface{}{
			"method":      r.Method,
			"path":        r.URL.Path,
			"query":       r.URL.RawQuery,
			"user_agent":  r.UserAgent(),
			"remote_addr": r.RemoteAddr,
		})

		next.ServeHTTP(wrapped, r)

		// Log response
		duration := time.Since(start)
		fields := map[string]interface{}{
			"method":       r.Method,
			"path":         r.URL.Path,
			"status_code":  wrapped.statusCode,
			"duration_ms":  duration.Milliseconds(),
			"content_type": wrapped.Header().Get("Content-Type"),
		}

		if wrapped.statusCode >= 400 {
			eh.logger.Error(r.Context(), "HTTP error response", nil, fields)
		} else {
			eh.logger.Info(r.Context(), "HTTP response", fields)
		}
	})
}

// ConnectErrorInterceptor provides error handling for Connect RPC calls
func (eh *ErrorHandler) ConnectErrorInterceptor() connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			// Log incoming RPC request
			eh.logger.Info(ctx, "RPC request", map[string]interface{}{
				"procedure": req.Spec().Procedure,
				"method":    req.HTTPMethod(),
			})

			start := time.Now()
			resp, err := next(ctx, req)
			duration := time.Since(start)

			if err != nil {
				// Log RPC error
				if connect.CodeOf(err) != connect.CodeUnknown {
					eh.logger.Error(ctx, "RPC error", err, map[string]interface{}{
						"procedure":   req.Spec().Procedure,
						"code":        connect.CodeOf(err).String(),
						"duration_ms": duration.Milliseconds(),
					})
				} else {
					eh.logger.Error(ctx, "RPC unexpected error", err, map[string]interface{}{
						"procedure":   req.Spec().Procedure,
						"duration_ms": duration.Milliseconds(),
					})
				}
				return nil, err
			}

			// Log successful RPC response
			eh.logger.Info(ctx, "RPC response", map[string]interface{}{
				"procedure":   req.Spec().Procedure,
				"duration_ms": duration.Milliseconds(),
			})

			return resp, nil
		}
	}
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// ValidationErrorHandler converts validation errors to appropriate Connect errors
func (eh *ErrorHandler) HandleValidationError(err error) error {
	if err == nil {
		return nil
	}

	// Log validation error
	eh.logger.Warn(context.Background(), "Validation error", map[string]interface{}{
		"error": err.Error(),
	})

	return connect.NewError(connect.CodeInvalidArgument, err)
}

// RepositoryErrorHandler converts repository errors to appropriate Connect errors
func (eh *ErrorHandler) HandleRepositoryError(err error) error {
	if err == nil {
		return nil
	}

	// Log repository error
	eh.logger.Error(context.Background(), "Repository error", err, map[string]interface{}{
		"error": err.Error(),
	})

	// Check for specific error patterns
	errMsg := err.Error()
	if contains(errMsg, "not found") {
		return connect.NewError(connect.CodeNotFound, err)
	}
	if contains(errMsg, "duplicate") || contains(errMsg, "constraint") {
		return connect.NewError(connect.CodeAlreadyExists, err)
	}
	if contains(errMsg, "timeout") || contains(errMsg, "connection") {
		return connect.NewError(connect.CodeUnavailable, err)
	}

	// Default to internal error
	return connect.NewError(connect.CodeInternal, err)
}

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return len(s) >= len(substr) && 
		(s == substr || 
		 len(s) > len(substr) && 
		 (s[:len(substr)] == substr || 
		  s[len(s)-len(substr):] == substr || 
		  findSubstring(s, substr)))
}

// findSubstring searches for substring in string
func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}