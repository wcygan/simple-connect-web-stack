package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"connectrpc.com/connect"
	"github.com/google/uuid"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// TodoService implements the TodoService RPC service
type TodoService struct {
	db *sql.DB
}

// NewTodoService creates a new TodoService
func NewTodoService(db *sql.DB) *TodoService {
	return &TodoService{db: db}
}

// CreateTask creates a new task
func (s *TodoService) CreateTask(
	ctx context.Context,
	req *connect.Request[todov1.CreateTaskRequest],
) (*connect.Response[todov1.CreateTaskResponse], error) {
	// Validate title
	title := strings.TrimSpace(req.Msg.Title)
	if title == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("title cannot be empty"))
	}
	if len(title) > 255 {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("title cannot exceed 255 characters"))
	}

	// Generate UUID
	id := uuid.New().String()

	// Insert into database
	query := `
		INSERT INTO tasks (id, title, completed)
		VALUES (?, ?, FALSE)
	`
	_, err := s.db.ExecContext(ctx, query, id, title)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to create task: %w", err))
	}

	// Fetch the created task
	task, err := s.getTaskByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&todov1.CreateTaskResponse{
		Task: task,
	}), nil
}

// GetTask retrieves a task by ID
func (s *TodoService) GetTask(
	ctx context.Context,
	req *connect.Request[todov1.GetTaskRequest],
) (*connect.Response[todov1.GetTaskResponse], error) {
	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("id cannot be empty"))
	}

	task, err := s.getTaskByID(ctx, req.Msg.Id)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&todov1.GetTaskResponse{
		Task: task,
	}), nil
}

// ListTasks retrieves tasks with pagination and filtering
func (s *TodoService) ListTasks(
	ctx context.Context,
	req *connect.Request[todov1.ListTasksRequest],
) (*connect.Response[todov1.ListTasksResponse], error) {
	// Set defaults
	page := req.Msg.Page
	if page == 0 {
		page = 1
	}
	
	pageSize := req.Msg.PageSize
	if pageSize == 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// Build query
	conditions := []string{}
	args := []interface{}{}

	// Search query
	if req.Msg.Query != "" {
		conditions = append(conditions, "title LIKE ?")
		args = append(args, "%"+req.Msg.Query+"%")
	}

	// Status filter
	switch req.Msg.Status {
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
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&totalItems)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to count tasks: %w", err))
	}

	// Calculate pagination
	totalPages := (totalItems + pageSize - 1) / pageSize
	offset := (page - 1) * pageSize

	// Determine sort field and order
	sortField := "created_at"
	switch req.Msg.SortBy {
	case todov1.SortField_SORT_FIELD_UPDATED_AT:
		sortField = "updated_at"
	case todov1.SortField_SORT_FIELD_TITLE:
		sortField = "title"
	}

	sortOrder := "DESC"
	if req.Msg.SortOrder == todov1.SortOrder_SORT_ORDER_ASC {
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
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to query tasks: %w", err))
	}
	defer rows.Close()

	// Collect tasks
	tasks := []*todov1.Task{}
	for rows.Next() {
		var task todov1.Task
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(&task.Id, &task.Title, &task.Completed, &createdAt, &updatedAt)
		if err != nil {
			return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to scan task: %w", err))
		}

		if createdAt.Valid {
			task.CreatedAt = timestamppb.New(createdAt.Time)
		}
		if updatedAt.Valid {
			task.UpdatedAt = timestamppb.New(updatedAt.Time)
		}

		tasks = append(tasks, &task)
	}

	return connect.NewResponse(&todov1.ListTasksResponse{
		Tasks: tasks,
		Pagination: &todov1.PaginationMetadata{
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			TotalItems:  totalItems,
			HasPrevious: page > 1,
			HasNext:     page < totalPages,
		},
	}), nil
}

// UpdateTask updates an existing task
func (s *TodoService) UpdateTask(
	ctx context.Context,
	req *connect.Request[todov1.UpdateTaskRequest],
) (*connect.Response[todov1.UpdateTaskResponse], error) {
	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("id cannot be empty"))
	}

	// Check if task exists
	_, err := s.getTaskByID(ctx, req.Msg.Id)
	if err != nil {
		return nil, err
	}

	// Update task
	updates := []string{}
	args := []interface{}{}

	if req.Msg.Title != "" {
		title := strings.TrimSpace(req.Msg.Title)
		if len(title) > 255 {
			return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("title cannot exceed 255 characters"))
		}
		updates = append(updates, "title = ?")
		args = append(args, title)
	}

	// Always update completed status
	updates = append(updates, "completed = ?")
	args = append(args, req.Msg.Completed)

	// Add ID for WHERE clause
	args = append(args, req.Msg.Id)

	query := fmt.Sprintf(`
		UPDATE tasks
		SET %s
		WHERE id = ?
	`, strings.Join(updates, ", "))

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to update task: %w", err))
	}

	// Fetch updated task
	task, err := s.getTaskByID(ctx, req.Msg.Id)
	if err != nil {
		return nil, err
	}

	return connect.NewResponse(&todov1.UpdateTaskResponse{
		Task: task,
	}), nil
}

// DeleteTask deletes a task
func (s *TodoService) DeleteTask(
	ctx context.Context,
	req *connect.Request[todov1.DeleteTaskRequest],
) (*connect.Response[emptypb.Empty], error) {
	if req.Msg.Id == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("id cannot be empty"))
	}

	result, err := s.db.ExecContext(ctx, "DELETE FROM tasks WHERE id = ?", req.Msg.Id)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to delete task: %w", err))
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to check rows affected: %w", err))
	}

	if rowsAffected == 0 {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("task not found"))
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}

// HealthCheck returns the service health status
func (s *TodoService) HealthCheck(
	ctx context.Context,
	req *connect.Request[emptypb.Empty],
) (*connect.Response[todov1.HealthCheckResponse], error) {
	// Check if database is configured
	if s.db == nil {
		return nil, connect.NewError(connect.CodeUnavailable, errors.New("database not configured"))
	}
	
	// Check database connection
	if err := s.db.PingContext(ctx); err != nil {
		return nil, connect.NewError(connect.CodeUnavailable, fmt.Errorf("database unavailable: %w", err))
	}

	return connect.NewResponse(&todov1.HealthCheckResponse{
		Status: "ok",
	}), nil
}

// getTaskByID is a helper function to fetch a task by ID
func (s *TodoService) getTaskByID(ctx context.Context, id string) (*todov1.Task, error) {
	var task todov1.Task
	var createdAt, updatedAt sql.NullTime

	query := `
		SELECT id, title, completed, created_at, updated_at
		FROM tasks
		WHERE id = ?
	`

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&task.Id, &task.Title, &task.Completed, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("task not found"))
	}
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, fmt.Errorf("failed to get task: %w", err))
	}

	if createdAt.Valid {
		task.CreatedAt = timestamppb.New(createdAt.Time)
	}
	if updatedAt.Valid {
		task.UpdatedAt = timestamppb.New(updatedAt.Time)
	}

	return &task, nil
}