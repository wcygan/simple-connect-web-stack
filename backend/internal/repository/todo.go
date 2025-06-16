package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wcygan/simple-connect-web-stack/internal/middleware"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// TodoRepository defines the interface for todo data operations
type TodoRepository interface {
	Create(ctx context.Context, task *CreateTaskRequest) (*todov1.Task, error)
	GetByID(ctx context.Context, id string) (*todov1.Task, error)
	List(ctx context.Context, filters *ListTasksRequest) ([]*todov1.Task, *PaginationResult, error)
	Update(ctx context.Context, req *UpdateTaskRequest) (*todov1.Task, error)
	Delete(ctx context.Context, id string) error
	HealthCheck(ctx context.Context) error
}

// CreateTaskRequest represents the data needed to create a new task
type CreateTaskRequest struct {
	Title string
}

// UpdateTaskRequest represents the data needed to update a task
type UpdateTaskRequest struct {
	ID        string
	Title     string
	Completed bool
}

// ListTasksRequest represents filters for listing tasks
type ListTasksRequest struct {
	Page      uint32
	PageSize  uint32
	Query     string
	Status    todov1.StatusFilter
	SortBy    todov1.SortField
	SortOrder todov1.SortOrder
}

// PaginationResult contains pagination metadata
type PaginationResult struct {
	Page        uint32
	PageSize    uint32
	TotalPages  uint32
	TotalItems  uint32
	HasPrevious bool
	HasNext     bool
}

// mysqlTodoRepository implements TodoRepository using MySQL
type mysqlTodoRepository struct {
	db     *sql.DB
	logger *middleware.StructuredLogger
}

// NewMySQLTodoRepository creates a new MySQL-based todo repository
func NewMySQLTodoRepository(db *sql.DB) TodoRepository {
	return &mysqlTodoRepository{
		db:     db,
		logger: middleware.NewStructuredLogger(middleware.LevelInfo),
	}
}

// NewMySQLTodoRepositoryWithLogger creates a new MySQL repository with custom logger
func NewMySQLTodoRepositoryWithLogger(db *sql.DB, logger *middleware.StructuredLogger) TodoRepository {
	return &mysqlTodoRepository{
		db:     db,
		logger: logger,
	}
}

// Create creates a new task in the database
func (r *mysqlTodoRepository) Create(ctx context.Context, req *CreateTaskRequest) (*todov1.Task, error) {
	start := time.Now()
	ctx = middleware.WithSource(ctx, "repository.Create")
	
	id := uuid.New().String()

	query := `
		INSERT INTO tasks (id, title, completed)
		VALUES (?, ?, FALSE)
	`
	
	result, err := r.db.ExecContext(ctx, query, id, req.Title)
	duration := time.Since(start)
	
	var rowsAffected int64
	if result != nil {
		rowsAffected, _ = result.RowsAffected()
	}
	
	// Log database operation
	r.logger.LogDatabaseOperation(ctx, "INSERT tasks", duration, err == nil, rowsAffected)
	
	if err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	return r.GetByID(ctx, id)
}

// GetByID retrieves a task by its ID
func (r *mysqlTodoRepository) GetByID(ctx context.Context, id string) (*todov1.Task, error) {
	start := time.Now()
	ctx = middleware.WithSource(ctx, "repository.GetByID")
	
	var task todov1.Task
	var createdAt, updatedAt sql.NullTime

	query := `
		SELECT id, title, completed, created_at, updated_at
		FROM tasks
		WHERE id = ?
	`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&task.Id, &task.Title, &task.Completed, &createdAt, &updatedAt,
	)
	duration := time.Since(start)
	
	// Log database operation
	rowsReturned := int64(0)
	if err == nil {
		rowsReturned = 1
	}
	r.logger.LogDatabaseOperation(ctx, "SELECT task by ID", duration, err == nil || err == sql.ErrNoRows, rowsReturned)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("task not found: %s", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	if createdAt.Valid {
		task.CreatedAt = timestamppb.New(createdAt.Time)
	}
	if updatedAt.Valid {
		task.UpdatedAt = timestamppb.New(updatedAt.Time)
	}

	return &task, nil
}

// List retrieves tasks with pagination and filtering
func (r *mysqlTodoRepository) List(ctx context.Context, filters *ListTasksRequest) ([]*todov1.Task, *PaginationResult, error) {
	// Set defaults
	page := filters.Page
	if page == 0 {
		page = 1
	}
	
	pageSize := filters.PageSize
	if pageSize == 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// Build query conditions
	conditions := []string{}
	args := []interface{}{}

	// Search query
	if filters.Query != "" {
		conditions = append(conditions, "title LIKE ?")
		args = append(args, "%"+filters.Query+"%")
	}

	// Status filter
	switch filters.Status {
	case todov1.StatusFilter_STATUS_FILTER_COMPLETED:
		conditions = append(conditions, "completed = TRUE")
	case todov1.StatusFilter_STATUS_FILTER_PENDING:
		conditions = append(conditions, "completed = FALSE")
	}

	// Build WHERE clause
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total items
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", whereClause)
	var totalItems uint32
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&totalItems)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to count tasks: %w", err)
	}

	// Calculate pagination
	totalPages := (totalItems + pageSize - 1) / pageSize
	offset := (page - 1) * pageSize

	// Determine sort field and order
	sortField := "created_at"
	switch filters.SortBy {
	case todov1.SortField_SORT_FIELD_UPDATED_AT:
		sortField = "updated_at"
	case todov1.SortField_SORT_FIELD_TITLE:
		sortField = "title"
	}

	sortOrder := "DESC"
	if filters.SortOrder == todov1.SortOrder_SORT_ORDER_ASC {
		sortOrder = "ASC"
	}

	// Query tasks
	query := fmt.Sprintf(`
		SELECT id, title, completed, created_at, updated_at
		FROM tasks
		%s
		ORDER BY %s %s
		LIMIT ? OFFSET ?
	`, whereClause, sortField, sortOrder)

	args = append(args, pageSize, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	// Collect tasks
	tasks := []*todov1.Task{}
	for rows.Next() {
		var task todov1.Task
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(&task.Id, &task.Title, &task.Completed, &createdAt, &updatedAt)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to scan task: %w", err)
		}

		if createdAt.Valid {
			task.CreatedAt = timestamppb.New(createdAt.Time)
		}
		if updatedAt.Valid {
			task.UpdatedAt = timestamppb.New(updatedAt.Time)
		}

		tasks = append(tasks, &task)
	}

	pagination := &PaginationResult{
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  totalPages,
		TotalItems:  totalItems,
		HasPrevious: page > 1,
		HasNext:     page < totalPages,
	}

	return tasks, pagination, nil
}

// Update modifies an existing task
func (r *mysqlTodoRepository) Update(ctx context.Context, req *UpdateTaskRequest) (*todov1.Task, error) {
	// Check if task exists
	_, err := r.GetByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	// Update task
	updates := []string{}
	args := []interface{}{}

	if req.Title != "" {
		updates = append(updates, "title = ?")
		args = append(args, req.Title)
	}

	// Always update completed status
	updates = append(updates, "completed = ?")
	args = append(args, req.Completed)

	// Add ID for WHERE clause
	args = append(args, req.ID)

	query := fmt.Sprintf(`
		UPDATE tasks
		SET %s
		WHERE id = ?
	`, strings.Join(updates, ", "))

	_, err = r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	return r.GetByID(ctx, req.ID)
}

// Delete removes a task from the database
func (r *mysqlTodoRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM tasks WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("task not found: %s", id)
	}

	return nil
}

// HealthCheck verifies the database connection
func (r *mysqlTodoRepository) HealthCheck(ctx context.Context) error {
	return r.db.PingContext(ctx)
}