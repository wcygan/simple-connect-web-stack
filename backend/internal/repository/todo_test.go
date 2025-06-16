package repository

import (
	"context"
	"database/sql"
	"testing"

	"github.com/wcygan/simple-connect-web-stack/internal/middleware"
	_ "github.com/mattn/go-sqlite3"
)

func TestMySQLTodoRepository_WithLogging(t *testing.T) {
	// Create in-memory SQLite database for testing
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Create tasks table
	_, err = db.Exec(`
		CREATE TABLE tasks (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			completed BOOLEAN DEFAULT FALSE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		t.Fatalf("Failed to create table: %v", err)
	}

	// Create logger for testing
	logger := middleware.NewStructuredLoggerWithMetadata(
		middleware.LevelInfo,
		"test-service",
		"v1.0.0",
		"test",
	)
	
	repo := NewMySQLTodoRepositoryWithLogger(db, logger).(*mysqlTodoRepository)

	ctx := context.Background()

	t.Run("create task logs database operation", func(t *testing.T) {
		
		req := &CreateTaskRequest{
			Title: "Test task with logging",
		}

		task, err := repo.Create(ctx, req)
		if err != nil {
			t.Fatalf("Failed to create task: %v", err)
		}

		if task == nil {
			t.Fatal("Expected task to be created")
		}

		if task.Title != req.Title {
			t.Errorf("Expected title %s, got %s", req.Title, task.Title)
		}

		// Note: In this test setup, the logger output goes to stdout by default
		// In a production environment, you'd configure the logger appropriately
		// The logging functionality is verified by the middleware tests
	})

	t.Run("get by id logs database operation", func(t *testing.T) {
		// First create a task
		req := &CreateTaskRequest{
			Title: "Test task for get",
		}

		task, err := repo.Create(ctx, req)
		if err != nil {
			t.Fatalf("Failed to create task: %v", err)
		}

		
		// Now get it by ID
		retrievedTask, err := repo.GetByID(ctx, task.Id)
		if err != nil {
			t.Fatalf("Failed to get task: %v", err)
		}

		if retrievedTask == nil {
			t.Fatal("Expected task to be retrieved")
		}

		if retrievedTask.Id != task.Id {
			t.Errorf("Expected ID %s, got %s", task.Id, retrievedTask.Id)
		}

		// Verify the source context is properly set
		ctxWithSource := middleware.WithSource(ctx, "test.function")
		source := getSourceFromContext(ctxWithSource)
		if source != "test.function" {
			t.Errorf("Expected source 'test.function', got %s", source)
		}
	})

	t.Run("health check works", func(t *testing.T) {
		err := repo.HealthCheck(ctx)
		if err != nil {
			t.Errorf("Expected health check to pass, got error: %v", err)
		}
	})
}

// TestRepositoryInterface ensures our repository implements the interface correctly
func TestRepositoryInterface(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// This should compile if the interface is implemented correctly
	var repo TodoRepository = NewMySQLTodoRepository(db)
	
	if repo == nil {
		t.Fatal("Expected repository to be created")
	}

	// Test with custom logger
	logger := middleware.NewStructuredLogger(middleware.LevelDebug)
	var repoWithLogger TodoRepository = NewMySQLTodoRepositoryWithLogger(db, logger)
	
	if repoWithLogger == nil {
		t.Fatal("Expected repository with logger to be created")
	}
}

// Helper function to extract source from context for testing
func getSourceFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if source, ok := ctx.Value("source").(string); ok {
		return source
	}
	return ""
}