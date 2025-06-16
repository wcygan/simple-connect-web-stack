package service

import (
	"context"
	"database/sql"
	"strings"

	"connectrpc.com/connect"
	"github.com/wcygan/simple-connect-web-stack/internal/middleware"
	"github.com/wcygan/simple-connect-web-stack/internal/repository"
	"github.com/wcygan/simple-connect-web-stack/internal/validator"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/emptypb"
)

// TodoService implements the TodoService RPC service
type TodoService struct {
	repo         repository.TodoRepository
	validator    *validator.TodoValidator
	errorHandler *middleware.ErrorHandler
}

// NewTodoService creates a new TodoService
func NewTodoService(db *sql.DB) *TodoService {
	logger := middleware.NewStructuredLogger(middleware.LevelInfo)
	return &TodoService{
		repo:         repository.NewMySQLTodoRepository(db),
		validator:    validator.NewTodoValidator(),
		errorHandler: middleware.NewErrorHandler(logger),
	}
}

// NewTodoServiceWithRepository creates a TodoService with a custom repository
func NewTodoServiceWithRepository(repo repository.TodoRepository) *TodoService {
	logger := middleware.NewStructuredLogger(middleware.LevelInfo)
	return &TodoService{
		repo:         repo,
		validator:    validator.NewTodoValidator(),
		errorHandler: middleware.NewErrorHandler(logger),
	}
}

// NewTodoServiceWithDependencies creates a TodoService with all dependencies
func NewTodoServiceWithDependencies(repo repository.TodoRepository, validator *validator.TodoValidator, errorHandler *middleware.ErrorHandler) *TodoService {
	return &TodoService{
		repo:         repo,
		validator:    validator,
		errorHandler: errorHandler,
	}
}

// CreateTask creates a new task
func (s *TodoService) CreateTask(
	ctx context.Context,
	req *connect.Request[todov1.CreateTaskRequest],
) (*connect.Response[todov1.CreateTaskResponse], error) {
	// Validate request
	if err := s.validator.ValidateCreateTask(req.Msg); err != nil {
		return nil, s.errorHandler.HandleValidationError(err)
	}

	// Create task
	createReq := &repository.CreateTaskRequest{
		Title: strings.TrimSpace(req.Msg.Title),
	}

	task, err := s.repo.Create(ctx, createReq)
	if err != nil {
		return nil, s.errorHandler.HandleRepositoryError(err)
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
	// Validate request
	if err := s.validator.ValidateGetTask(req.Msg); err != nil {
		return nil, s.errorHandler.HandleValidationError(err)
	}

	task, err := s.repo.GetByID(ctx, req.Msg.Id)
	if err != nil {
		return nil, s.errorHandler.HandleRepositoryError(err)
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
	// Validate request
	if err := s.validator.ValidateListTasks(req.Msg); err != nil {
		return nil, s.errorHandler.HandleValidationError(err)
	}

	// Convert to repository request
	filters := &repository.ListTasksRequest{
		Page:      req.Msg.Page,
		PageSize:  req.Msg.PageSize,
		Query:     req.Msg.Query,
		Status:    req.Msg.Status,
		SortBy:    req.Msg.SortBy,
		SortOrder: req.Msg.SortOrder,
	}

	tasks, pagination, err := s.repo.List(ctx, filters)
	if err != nil {
		return nil, s.errorHandler.HandleRepositoryError(err)
	}

	return connect.NewResponse(&todov1.ListTasksResponse{
		Tasks: tasks,
		Pagination: &todov1.PaginationMetadata{
			Page:        pagination.Page,
			PageSize:    pagination.PageSize,
			TotalPages:  pagination.TotalPages,
			TotalItems:  pagination.TotalItems,
			HasPrevious: pagination.HasPrevious,
			HasNext:     pagination.HasNext,
		},
	}), nil
}

// UpdateTask updates an existing task
func (s *TodoService) UpdateTask(
	ctx context.Context,
	req *connect.Request[todov1.UpdateTaskRequest],
) (*connect.Response[todov1.UpdateTaskResponse], error) {
	// Validate request
	if err := s.validator.ValidateUpdateTask(req.Msg); err != nil {
		return nil, s.errorHandler.HandleValidationError(err)
	}

	// Convert to repository request
	updateReq := &repository.UpdateTaskRequest{
		ID:        req.Msg.Id,
		Title:     strings.TrimSpace(req.Msg.Title),
		Completed: req.Msg.Completed,
	}

	task, err := s.repo.Update(ctx, updateReq)
	if err != nil {
		return nil, s.errorHandler.HandleRepositoryError(err)
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
	// Validate request
	if err := s.validator.ValidateDeleteTask(req.Msg); err != nil {
		return nil, s.errorHandler.HandleValidationError(err)
	}

	err := s.repo.Delete(ctx, req.Msg.Id)
	if err != nil {
		return nil, s.errorHandler.HandleRepositoryError(err)
	}

	return connect.NewResponse(&emptypb.Empty{}), nil
}

// HealthCheck returns the service health status
func (s *TodoService) HealthCheck(
	ctx context.Context,
	req *connect.Request[emptypb.Empty],
) (*connect.Response[todov1.HealthCheckResponse], error) {
	// Check repository health
	if err := s.repo.HealthCheck(ctx); err != nil {
		return nil, s.errorHandler.HandleRepositoryError(err)
	}

	return connect.NewResponse(&todov1.HealthCheckResponse{
		Status: "ok",
	}), nil
}

