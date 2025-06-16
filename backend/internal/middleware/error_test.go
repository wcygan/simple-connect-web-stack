package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"connectrpc.com/connect"
)

// mockLogger implements Logger interface for testing
type mockLogger struct {
	infoMessages  []LogCall
	errorMessages []LogCall
	warnMessages  []LogCall
}

type LogCall struct {
	Message string
	Error   error
	Fields  map[string]interface{}
}

func (m *mockLogger) Info(ctx context.Context, msg string, fields map[string]interface{}) {
	m.infoMessages = append(m.infoMessages, LogCall{Message: msg, Fields: fields})
}

func (m *mockLogger) Error(ctx context.Context, msg string, err error, fields map[string]interface{}) {
	m.errorMessages = append(m.errorMessages, LogCall{Message: msg, Error: err, Fields: fields})
}

func (m *mockLogger) Warn(ctx context.Context, msg string, fields map[string]interface{}) {
	m.warnMessages = append(m.warnMessages, LogCall{Message: msg, Fields: fields})
}

func (m *mockLogger) reset() {
	m.infoMessages = nil
	m.errorMessages = nil
	m.warnMessages = nil
}

func TestNewErrorHandler(t *testing.T) {
	t.Run("with logger", func(t *testing.T) {
		logger := &mockLogger{}
		handler := NewErrorHandler(logger)
		if handler == nil {
			t.Fatal("Expected error handler to be created")
		}
		if handler.logger != logger {
			t.Error("Expected logger to be set")
		}
	})

	t.Run("with nil logger", func(t *testing.T) {
		handler := NewErrorHandler(nil)
		if handler == nil {
			t.Fatal("Expected error handler to be created")
		}
		if _, ok := handler.logger.(*DefaultLogger); !ok {
			t.Error("Expected default logger to be used")
		}
	})
}

func TestRecoveryMiddleware(t *testing.T) {
	logger := &mockLogger{}
	errorHandler := NewErrorHandler(logger)

	t.Run("normal request", func(t *testing.T) {
		logger.reset()
		
		handler := errorHandler.RecoveryMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		}))

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		if len(logger.errorMessages) != 0 {
			t.Error("Expected no error messages for normal request")
		}
	})

	t.Run("panic recovery", func(t *testing.T) {
		logger.reset()
		
		handler := errorHandler.RecoveryMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			panic("test panic")
		}))

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		if w.Code != http.StatusInternalServerError {
			t.Errorf("Expected status 500, got %d", w.Code)
		}
		
		if len(logger.errorMessages) != 1 {
			t.Errorf("Expected 1 error message, got %d", len(logger.errorMessages))
		}
		
		if !strings.Contains(logger.errorMessages[0].Message, "Panic recovered") {
			t.Error("Expected panic recovery message")
		}
		
		// Check response body contains error JSON
		body := w.Body.String()
		if !strings.Contains(body, "INTERNAL_ERROR") {
			t.Error("Expected error response in body")
		}
	})
}

func TestLoggingMiddleware(t *testing.T) {
	logger := &mockLogger{}
	errorHandler := NewErrorHandler(logger)

	t.Run("successful request", func(t *testing.T) {
		logger.reset()
		
		handler := errorHandler.LoggingMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		}))

		req := httptest.NewRequest("GET", "/test?param=value", nil)
		req.Header.Set("User-Agent", "test-agent")
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		// Should have request and response log entries
		if len(logger.infoMessages) < 2 {
			t.Errorf("Expected at least 2 info messages, got %d", len(logger.infoMessages))
		}
		
		// Check request log
		requestLog := logger.infoMessages[0]
		if requestLog.Message != "HTTP request" {
			t.Error("Expected HTTP request message")
		}
		if requestLog.Fields["method"] != "GET" {
			t.Error("Expected GET method in log")
		}
		if requestLog.Fields["path"] != "/test" {
			t.Error("Expected /test path in log")
		}
		
		// Check response log
		responseLog := logger.infoMessages[1]
		if responseLog.Message != "HTTP response" {
			t.Error("Expected HTTP response message")
		}
		if responseLog.Fields["status_code"] != 200 {
			t.Error("Expected status code 200 in log")
		}
	})

	t.Run("error request", func(t *testing.T) {
		logger.reset()
		
		handler := errorHandler.LoggingMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request"))
		}))

		req := httptest.NewRequest("POST", "/test", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		// Should have request log and error response log
		if len(logger.infoMessages) != 1 {
			t.Errorf("Expected 1 info message, got %d", len(logger.infoMessages))
		}
		if len(logger.errorMessages) != 1 {
			t.Errorf("Expected 1 error message, got %d", len(logger.errorMessages))
		}
		
		errorLog := logger.errorMessages[0]
		if errorLog.Message != "HTTP error response" {
			t.Error("Expected HTTP error response message")
		}
		if errorLog.Fields["status_code"] != 400 {
			t.Error("Expected status code 400 in error log")
		}
	})
}

func TestValidationErrorHandler(t *testing.T) {
	logger := &mockLogger{}
	errorHandler := NewErrorHandler(logger)

	t.Run("nil error", func(t *testing.T) {
		result := errorHandler.HandleValidationError(nil)
		if result != nil {
			t.Error("Expected nil result for nil error")
		}
	})

	t.Run("validation error", func(t *testing.T) {
		logger.reset()
		
		testErr := errors.New("validation failed")
		result := errorHandler.HandleValidationError(testErr)
		
		if result == nil {
			t.Fatal("Expected error result")
		}
		
		connectErr := result.(*connect.Error)
		if connectErr.Code() != connect.CodeInvalidArgument {
			t.Errorf("Expected InvalidArgument code, got %v", connectErr.Code())
		}
		
		if len(logger.warnMessages) != 1 {
			t.Errorf("Expected 1 warning message, got %d", len(logger.warnMessages))
		}
		
		if logger.warnMessages[0].Message != "Validation error" {
			t.Error("Expected validation error message")
		}
	})
}

func TestRepositoryErrorHandler(t *testing.T) {
	logger := &mockLogger{}
	errorHandler := NewErrorHandler(logger)

	testCases := []struct {
		name         string
		error        string
		expectedCode connect.Code
	}{
		{"nil error", "", connect.CodeUnknown},
		{"not found error", "record not found", connect.CodeNotFound},
		{"duplicate error", "duplicate key constraint", connect.CodeAlreadyExists},
		{"timeout error", "connection timeout", connect.CodeUnavailable},
		{"generic error", "some database error", connect.CodeInternal},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			logger.reset()
			
			var testErr error
			if tc.error != "" {
				testErr = errors.New(tc.error)
			}
			
			result := errorHandler.HandleRepositoryError(testErr)
			
			if tc.error == "" {
				if result != nil {
					t.Error("Expected nil result for nil error")
				}
				return
			}
			
			if result == nil {
				t.Fatal("Expected error result")
			}
			
			connectErr := result.(*connect.Error)
			if connectErr.Code() != tc.expectedCode {
				t.Errorf("Expected %v code, got %v", tc.expectedCode, connectErr.Code())
			}
			
			if len(logger.errorMessages) != 1 {
				t.Errorf("Expected 1 error message, got %d", len(logger.errorMessages))
			}
		})
	}
}

func TestContains(t *testing.T) {
	testCases := []struct {
		s        string
		substr   string
		expected bool
	}{
		{"hello world", "world", true},
		{"hello world", "hello", true},
		{"hello world", "lo wo", true},
		{"hello world", "xyz", false},
		{"hello", "hello world", false},
		{"", "test", false},
		{"test", "", true},
	}

	for _, tc := range testCases {
		t.Run(tc.s+"_contains_"+tc.substr, func(t *testing.T) {
			result := contains(tc.s, tc.substr)
			if result != tc.expected {
				t.Errorf("contains(%q, %q) = %v, expected %v", tc.s, tc.substr, result, tc.expected)
			}
		})
	}
}

func TestResponseWriter(t *testing.T) {
	w := httptest.NewRecorder()
	rw := &responseWriter{ResponseWriter: w, statusCode: 200}

	// Test default status code
	if rw.statusCode != 200 {
		t.Errorf("Expected default status code 200, got %d", rw.statusCode)
	}

	// Test WriteHeader
	rw.WriteHeader(404)
	if rw.statusCode != 404 {
		t.Errorf("Expected status code 404, got %d", rw.statusCode)
	}

	// Test that underlying writer got the status
	if w.Code != 404 {
		t.Errorf("Expected underlying writer status 404, got %d", w.Code)
	}
}

// Integration test for middleware stack
func TestMiddlewareIntegration(t *testing.T) {
	logger := &mockLogger{}
	errorHandler := NewErrorHandler(logger)

	// Create a handler that might panic
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/panic" {
			panic("test panic")
		}
		if r.URL.Path == "/error" {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with all middleware
	handler := errorHandler.RecoveryMiddleware(
		errorHandler.LoggingMiddleware(testHandler),
	)

	t.Run("normal request", func(t *testing.T) {
		logger.reset()
		
		req := httptest.NewRequest("GET", "/normal", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		// Should have request and response logs
		if len(logger.infoMessages) < 2 {
			t.Error("Expected request and response log messages")
		}
	})

	t.Run("panic request", func(t *testing.T) {
		logger.reset()
		
		req := httptest.NewRequest("GET", "/panic", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		if w.Code != http.StatusInternalServerError {
			t.Errorf("Expected status 500, got %d", w.Code)
		}
		
		// Should have request log, response error log, and panic error log
		if len(logger.errorMessages) < 1 {
			t.Error("Expected panic error log message")
		}
		
		// Check that panic was logged
		found := false
		for _, msg := range logger.errorMessages {
			if strings.Contains(msg.Message, "Panic recovered") {
				found = true
				break
			}
		}
		if !found {
			t.Error("Expected panic recovery log message")
		}
	})
}