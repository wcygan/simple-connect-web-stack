package middleware

import (
	"net/http"

	"connectrpc.com/connect"
)

// MiddlewareStack combines multiple middlewares into a single handler
type MiddlewareStack struct {
	errorHandler *ErrorHandler
	logger       Logger
}

// NewMiddlewareStack creates a new middleware stack
func NewMiddlewareStack(logger Logger) *MiddlewareStack {
	errorHandler := NewErrorHandler(logger)
	return &MiddlewareStack{
		errorHandler: errorHandler,
		logger:       logger,
	}
}

// WrapHandler applies all HTTP middlewares to a handler
func (ms *MiddlewareStack) WrapHandler(h http.Handler) http.Handler {
	// Apply middlewares in reverse order (last applied is executed first)
	handler := h
	handler = ms.errorHandler.LoggingMiddleware(handler)
	handler = ms.errorHandler.RecoveryMiddleware(handler)
	handler = RequestIDMiddleware(handler)
	return handler
}

// GetConnectInterceptors returns Connect RPC interceptors
func (ms *MiddlewareStack) GetConnectInterceptors() []connect.Interceptor {
	return []connect.Interceptor{
		connect.UnaryInterceptorFunc(ms.errorHandler.ConnectErrorInterceptor()),
	}
}

// ErrorHandler returns the error handler for manual use
func (ms *MiddlewareStack) ErrorHandler() *ErrorHandler {
	return ms.errorHandler
}

// Logger returns the logger for manual use
func (ms *MiddlewareStack) Logger() Logger {
	return ms.logger
}