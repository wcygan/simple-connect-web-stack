package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/wcygan/simple-connect-web-stack/internal/db"
	"github.com/wcygan/simple-connect-web-stack/internal/service"
	"buf.build/gen/go/wcygan/simple-connect-web-stack/connectrpc/go/todo/v1/todov1connect"
)

func main() {
	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "root:root@tcp(localhost:3306)/todos?parseTime=true"
	}

	// Connect to database
	database, err := sql.Open("mysql", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Wait for database to be ready
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	for {
		if err := database.PingContext(ctx); err == nil {
			break
		}
		log.Println("Waiting for database to be ready...")
		time.Sleep(2 * time.Second)
		if ctx.Err() != nil {
			log.Fatalf("Database connection timeout: %v", ctx.Err())
		}
	}

	// Initialize database schema
	if err := db.InitDB(database); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create service
	todoService := service.NewTodoService(database)

	// Create HTTP mux
	mux := http.NewServeMux()

	// Mount the TodoService
	path, handler := todov1connect.NewTodoServiceHandler(todoService)
	mux.Handle(path, handler)

	// Add CORS middleware
	corsHandler := withCORS(mux)

	// Create server
	server := &http.Server{
		Addr:    ":3000",
		Handler: corsHandler,
	}

	// Start server in goroutine
	go func() {
		log.Println("Server starting on :3000")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Graceful shutdown
	log.Println("Shutting down server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// withCORS adds CORS headers to support browser requests
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from the frontend
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Connect-Protocol-Version")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		h.ServeHTTP(w, r)
	})
}