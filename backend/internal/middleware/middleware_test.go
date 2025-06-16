package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"
)

func TestNewMiddlewareStack(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	if stack == nil {
		t.Fatal("Expected middleware stack to be created")
	}
	
	if stack.logger != logger {
		t.Error("Expected logger to be set")
	}
	
	if stack.errorHandler == nil {
		t.Error("Expected error handler to be created")
	}
}

func TestMiddlewareStack_WrapHandler(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	// Create a simple test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	
	// Wrap the handler
	wrappedHandler := stack.WrapHandler(testHandler)
	
	if wrappedHandler == nil {
		t.Fatal("Expected wrapped handler to be returned")
	}
	
	// Test that the wrapped handler works
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	wrappedHandler.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	// Check that request ID was added
	if w.Header().Get("X-Request-ID") == "" {
		t.Error("Expected X-Request-ID header to be set")
	}
	
	// Check that logging occurred
	if len(logger.infoMessages) < 2 { // request and response logs
		t.Error("Expected request and response to be logged")
	}
}

func TestMiddlewareStack_WrapHandler_WithPanic(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	// Create a handler that panics
	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	})
	
	// Wrap the handler
	wrappedHandler := stack.WrapHandler(panicHandler)
	
	// Test that panic is recovered
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	wrappedHandler.ServeHTTP(w, req)
	
	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}
	
	// Check that panic was logged
	found := false
	for _, msg := range logger.errorMessages {
		if msg.Message == "Panic recovered" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected panic to be logged")
	}
}

func TestMiddlewareStack_GetConnectInterceptors(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	interceptors := stack.GetConnectInterceptors()
	
	if len(interceptors) != 1 {
		t.Errorf("Expected 1 interceptor, got %d", len(interceptors))
	}
	
	// Test that the interceptor works (basic smoke test)
	// In a real scenario, you'd need to set up a full Connect RPC test
	interceptor := interceptors[0]
	if interceptor == nil {
		t.Error("Expected interceptor to not be nil")
	}
}

func TestMiddlewareStack_ErrorHandler(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	errorHandler := stack.ErrorHandler()
	
	if errorHandler == nil {
		t.Error("Expected error handler to be returned")
	}
	
	if errorHandler != stack.errorHandler {
		t.Error("Expected same error handler instance")
	}
}

func TestMiddlewareStack_Logger(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	returnedLogger := stack.Logger()
	
	if returnedLogger == nil {
		t.Error("Expected logger to be returned")
	}
	
	if returnedLogger != logger {
		t.Error("Expected same logger instance")
	}
}

// Integration test for the full middleware stack
func TestMiddlewareStack_Integration(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	// Create a handler that uses error handling
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/ok":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		case "/error":
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Bad Request"))
		case "/panic":
			panic("test panic")
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	})
	
	wrappedHandler := stack.WrapHandler(testHandler)
	
	testCases := []struct {
		name           string
		path           string
		expectedStatus int
		expectPanic    bool
	}{
		{"success", "/ok", http.StatusOK, false},
		{"error", "/error", http.StatusBadRequest, false},
		{"not found", "/notfound", http.StatusNotFound, false},
		{"panic", "/panic", http.StatusInternalServerError, true},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			logger.reset()
			
			req := httptest.NewRequest("GET", tc.path, nil)
			w := httptest.NewRecorder()
			
			wrappedHandler.ServeHTTP(w, req)
			
			if w.Code != tc.expectedStatus {
				t.Errorf("Expected status %d, got %d", tc.expectedStatus, w.Code)
			}
			
			// Check that request was logged
			if len(logger.infoMessages) == 0 {
				t.Error("Expected request to be logged")
			}
			
			// Check request ID header
			if w.Header().Get("X-Request-ID") == "" {
				t.Error("Expected X-Request-ID header")
			}
			
			// Check panic logging
			if tc.expectPanic {
				found := false
				for _, msg := range logger.errorMessages {
					if msg.Message == "Panic recovered" {
						found = true
						break
					}
				}
				if !found {
					t.Error("Expected panic to be logged")
				}
			}
		})
	}
}

// Test Connect RPC interceptor functionality
func TestConnectInterceptor_Basic(t *testing.T) {
	logger := &mockLogger{}
	stack := NewMiddlewareStack(logger)
	
	interceptors := stack.GetConnectInterceptors()
	if len(interceptors) != 1 {
		t.Fatalf("Expected 1 interceptor, got %d", len(interceptors))
	}
	
	// Verify interceptor type
	interceptor := interceptors[0]
	if _, ok := interceptor.(connect.UnaryInterceptorFunc); !ok {
		t.Error("Expected UnaryInterceptorFunc")
	}
	
	// Note: Full integration testing of Connect interceptors requires
	// a complete Connect RPC setup which is complex to mock due to
	// private interface methods. The interceptor functionality is
	// tested in real scenarios through the service tests.
}