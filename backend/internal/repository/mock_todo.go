package repository

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/google/uuid"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// MockTodoRepository is an in-memory implementation for testing
type MockTodoRepository struct {
	mu           sync.RWMutex
	tasks        map[string]*todov1.Task
	healthError  error
	createError  error
	getError     error
	listError    error
	updateError  error
	deleteError  error
}

// NewMockTodoRepository creates a new mock repository
func NewMockTodoRepository() *MockTodoRepository {
	return &MockTodoRepository{
		tasks: make(map[string]*todov1.Task),
	}
}

// SetHealthError makes health check return the specified error
func (m *MockTodoRepository) SetHealthError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.healthError = err
}

// SetCreateError makes create operations return the specified error
func (m *MockTodoRepository) SetCreateError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.createError = err
}

// SetGetError makes get operations return the specified error
func (m *MockTodoRepository) SetGetError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.getError = err
}

// SetListError makes list operations return the specified error
func (m *MockTodoRepository) SetListError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.listError = err
}

// SetUpdateError makes update operations return the specified error
func (m *MockTodoRepository) SetUpdateError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.updateError = err
}

// SetDeleteError makes delete operations return the specified error
func (m *MockTodoRepository) SetDeleteError(err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deleteError = err
}

// Create creates a new task
func (m *MockTodoRepository) Create(ctx context.Context, req *CreateTaskRequest) (*todov1.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.createError != nil {
		return nil, m.createError
	}

	id := uuid.New().String()
	now := timestamppb.Now()
	
	task := &todov1.Task{
		Id:        id,
		Title:     req.Title,
		Completed: false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	m.tasks[id] = task
	return task, nil
}

// GetByID retrieves a task by ID
func (m *MockTodoRepository) GetByID(ctx context.Context, id string) (*todov1.Task, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.getError != nil {
		return nil, m.getError
	}

	task, exists := m.tasks[id]
	if !exists {
		return nil, fmt.Errorf("task not found: %s", id)
	}

	return task, nil
}

// List retrieves tasks with pagination and filtering
func (m *MockTodoRepository) List(ctx context.Context, filters *ListTasksRequest) ([]*todov1.Task, *PaginationResult, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.listError != nil {
		return nil, nil, m.listError
	}

	// Convert map to slice
	allTasks := make([]*todov1.Task, 0, len(m.tasks))
	for _, task := range m.tasks {
		allTasks = append(allTasks, task)
	}

	// Apply filters
	var filteredTasks []*todov1.Task
	for _, task := range allTasks {
		// Query filter
		if filters.Query != "" && !strings.Contains(strings.ToLower(task.Title), strings.ToLower(filters.Query)) {
			continue
		}

		// Status filter
		switch filters.Status {
		case todov1.StatusFilter_STATUS_FILTER_COMPLETED:
			if !task.Completed {
				continue
			}
		case todov1.StatusFilter_STATUS_FILTER_PENDING:
			if task.Completed {
				continue
			}
		}

		filteredTasks = append(filteredTasks, task)
	}

	// Apply pagination
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

	totalItems := uint32(len(filteredTasks))
	totalPages := (totalItems + pageSize - 1) / pageSize
	offset := (page - 1) * pageSize

	// Get page slice
	var pageTasks []*todov1.Task
	if offset < uint32(len(filteredTasks)) {
		end := offset + pageSize
		if end > uint32(len(filteredTasks)) {
			end = uint32(len(filteredTasks))
		}
		pageTasks = filteredTasks[offset:end]
	}

	pagination := &PaginationResult{
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  totalPages,
		TotalItems:  totalItems,
		HasPrevious: page > 1,
		HasNext:     page < totalPages,
	}

	return pageTasks, pagination, nil
}

// Update modifies an existing task
func (m *MockTodoRepository) Update(ctx context.Context, req *UpdateTaskRequest) (*todov1.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.updateError != nil {
		return nil, m.updateError
	}

	task, exists := m.tasks[req.ID]
	if !exists {
		return nil, fmt.Errorf("task not found: %s", req.ID)
	}

	// Update fields
	if req.Title != "" {
		task.Title = req.Title
	}
	task.Completed = req.Completed
	task.UpdatedAt = timestamppb.Now()

	return task, nil
}

// Delete removes a task
func (m *MockTodoRepository) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.deleteError != nil {
		return m.deleteError
	}

	_, exists := m.tasks[id]
	if !exists {
		return fmt.Errorf("task not found: %s", id)
	}

	delete(m.tasks, id)
	return nil
}

// HealthCheck verifies the repository is healthy
func (m *MockTodoRepository) HealthCheck(ctx context.Context) error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.healthError
}

// Reset clears all tasks and errors
func (m *MockTodoRepository) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.tasks = make(map[string]*todov1.Task)
	m.healthError = nil
	m.createError = nil
	m.getError = nil
	m.listError = nil
	m.updateError = nil
	m.deleteError = nil
}

// AddTask adds a task directly (for testing setup)
func (m *MockTodoRepository) AddTask(task *todov1.Task) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.tasks[task.Id] = task
}

// GetAllTasks returns all tasks (for testing verification)
func (m *MockTodoRepository) GetAllTasks() []*todov1.Task {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	tasks := make([]*todov1.Task, 0, len(m.tasks))
	for _, task := range m.tasks {
		tasks = append(tasks, task)
	}
	return tasks
}