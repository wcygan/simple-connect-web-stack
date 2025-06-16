package service

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"testing"
	"time"

	"connectrpc.com/connect"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// Test fixtures
var (
	testTaskID    = "test-task-123"
	testTaskTitle = "Test Task Title"
	testTime      = time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
)

func setupMockDB(t *testing.T) (*sql.DB, sqlmock.Sqlmock, *TodoService) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	
	service := NewTodoService(db)
	return db, mock, service
}

func TestTodoService_HealthCheck(t *testing.T) {
	tests := []struct {
		name      string
		setupMock func(sqlmock.Sqlmock)
		wantError bool
		errorCode connect.Code
	}{
		{
			name: "healthy database",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectPing()
			},
			wantError: false,
		},
		{
			name: "database ping fails",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectPing().WillReturnError(sql.ErrConnDone)
			},
			wantError: true,
			errorCode: connect.CodeUnavailable,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, service := setupMockDB(t)
			defer db.Close()

			tt.setupMock(mock)

			ctx := context.Background()
			req := connect.NewRequest(&emptypb.Empty{})

			resp, err := service.HealthCheck(ctx, req)

			if tt.wantError {
				assert.Error(t, err)
				assert.Equal(t, tt.errorCode, connect.CodeOf(err))
			} else {
				assert.NoError(t, err)
				assert.Equal(t, "ok", resp.Msg.Status)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestTodoService_HealthCheck_NilDatabase(t *testing.T) {
	service := &TodoService{db: nil}
	
	ctx := context.Background()
	req := connect.NewRequest(&emptypb.Empty{})
	
	_, err := service.HealthCheck(ctx, req)
	
	assert.Error(t, err)
	assert.Equal(t, connect.CodeUnavailable, connect.CodeOf(err))
	assert.Contains(t, err.Error(), "database not configured")
}

func TestTodoService_CreateTask(t *testing.T) {
	tests := []struct {
		name      string
		title     string
		setupMock func(sqlmock.Sqlmock)
		wantError bool
		errorCode connect.Code
	}{
		{
			name:  "valid task creation",
			title: testTaskTitle,
			setupMock: func(mock sqlmock.Sqlmock) {
				// Expect INSERT
				mock.ExpectExec("INSERT INTO tasks").
					WithArgs(sqlmock.AnyArg(), testTaskTitle).
					WillReturnResult(sqlmock.NewResult(1, 1))
				
				// Expect SELECT for getTaskByID
				rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow(testTaskID, testTaskTitle, false, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
					WithArgs(sqlmock.AnyArg()).
					WillReturnRows(rows)
			},
			wantError: false,
		},
		{
			name:      "empty title",
			title:     "",
			setupMock: func(mock sqlmock.Sqlmock) {},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
		{
			name:      "whitespace only title",
			title:     "   ",
			setupMock: func(mock sqlmock.Sqlmock) {},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
		{
			name:      "title too long",
			title:     string(make([]byte, 256)),
			setupMock: func(mock sqlmock.Sqlmock) {},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
		{
			name:  "database insert error",
			title: testTaskTitle,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("INSERT INTO tasks").
					WithArgs(sqlmock.AnyArg(), testTaskTitle).
					WillReturnError(sql.ErrConnDone)
			},
			wantError: true,
			errorCode: connect.CodeInternal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, service := setupMockDB(t)
			defer db.Close()

			tt.setupMock(mock)

			ctx := context.Background()
			req := connect.NewRequest(&todov1.CreateTaskRequest{
				Title: tt.title,
			})

			resp, err := service.CreateTask(ctx, req)

			if tt.wantError {
				assert.Error(t, err)
				assert.Equal(t, tt.errorCode, connect.CodeOf(err))
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp.Msg.Task)
				assert.Equal(t, testTaskTitle, resp.Msg.Task.Title)
				assert.False(t, resp.Msg.Task.Completed)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestTodoService_GetTask(t *testing.T) {
	tests := []struct {
		name      string
		taskID    string
		setupMock func(sqlmock.Sqlmock)
		wantError bool
		errorCode connect.Code
	}{
		{
			name:   "existing task",
			taskID: testTaskID,
			setupMock: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow(testTaskID, testTaskTitle, false, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
					WithArgs(testTaskID).
					WillReturnRows(rows)
			},
			wantError: false,
		},
		{
			name:   "task not found",
			taskID: "nonexistent",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
					WithArgs("nonexistent").
					WillReturnError(sql.ErrNoRows)
			},
			wantError: true,
			errorCode: connect.CodeNotFound,
		},
		{
			name:      "empty ID",
			taskID:    "",
			setupMock: func(mock sqlmock.Sqlmock) {},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, service := setupMockDB(t)
			defer db.Close()

			tt.setupMock(mock)

			ctx := context.Background()
			req := connect.NewRequest(&todov1.GetTaskRequest{
				Id: tt.taskID,
			})

			resp, err := service.GetTask(ctx, req)

			if tt.wantError {
				assert.Error(t, err)
				assert.Equal(t, tt.errorCode, connect.CodeOf(err))
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp.Msg.Task)
				assert.Equal(t, testTaskID, resp.Msg.Task.Id)
				assert.Equal(t, testTaskTitle, resp.Msg.Task.Title)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestTodoService_ListTasks(t *testing.T) {
	tests := []struct {
		name      string
		request   *todov1.ListTasksRequest
		setupMock func(sqlmock.Sqlmock)
		wantTasks int
		wantError bool
	}{
		{
			name: "default pagination",
			request: &todov1.ListTasksRequest{},
			setupMock: func(mock sqlmock.Sqlmock) {
				// Count query
				mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks").
					WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
				
				// List query
				rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow("task-1", "Task 1", false, testTime, testTime).
					AddRow("task-2", "Task 2", true, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks ORDER BY created_at DESC LIMIT \\? OFFSET \\?").
					WithArgs(uint32(20), uint32(0)).
					WillReturnRows(rows)
			},
			wantTasks: 2,
			wantError: false,
		},
		{
			name: "with search query",
			request: &todov1.ListTasksRequest{
				Query: "test",
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				// Count query with WHERE clause
				mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks WHERE title LIKE \\?").
					WithArgs("%test%").
					WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
				
				// List query with WHERE clause
				rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow("task-1", "Test Task", false, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE title LIKE \\? ORDER BY created_at DESC LIMIT \\? OFFSET \\?").
					WithArgs("%test%", uint32(20), uint32(0)).
					WillReturnRows(rows)
			},
			wantTasks: 1,
			wantError: false,
		},
		{
			name: "with status filter - completed",
			request: &todov1.ListTasksRequest{
				Status: todov1.StatusFilter_STATUS_FILTER_COMPLETED,
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				// Count query
				mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks WHERE completed = TRUE").
					WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))
				
				// List query
				rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow("task-2", "Task 2", true, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE completed = TRUE ORDER BY created_at DESC LIMIT \\? OFFSET \\?").
					WithArgs(uint32(20), uint32(0)).
					WillReturnRows(rows)
			},
			wantTasks: 1,
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, service := setupMockDB(t)
			defer db.Close()

			tt.setupMock(mock)

			ctx := context.Background()
			req := connect.NewRequest(tt.request)

			resp, err := service.ListTasks(ctx, req)

			if tt.wantError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Len(t, resp.Msg.Tasks, tt.wantTasks)
				assert.NotNil(t, resp.Msg.Pagination)
				
				// Check pagination metadata
				assert.Equal(t, uint32(1), resp.Msg.Pagination.Page)
				assert.Equal(t, uint32(20), resp.Msg.Pagination.PageSize)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestTodoService_UpdateTask(t *testing.T) {
	tests := []struct {
		name      string
		request   *todov1.UpdateTaskRequest
		setupMock func(sqlmock.Sqlmock)
		wantError bool
		errorCode connect.Code
	}{
		{
			name: "valid update",
			request: &todov1.UpdateTaskRequest{
				Id:        testTaskID,
				Title:     "Updated Title",
				Completed: true,
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				// Check if task exists
				rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow(testTaskID, testTaskTitle, false, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
					WithArgs(testTaskID).
					WillReturnRows(rows)
				
				// Update task
				mock.ExpectExec("UPDATE tasks SET title = \\?, completed = \\? WHERE id = \\?").
					WithArgs("Updated Title", true, testTaskID).
					WillReturnResult(sqlmock.NewResult(1, 1))
				
				// Fetch updated task
				updatedRows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
					AddRow(testTaskID, "Updated Title", true, testTime, testTime)
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
					WithArgs(testTaskID).
					WillReturnRows(updatedRows)
			},
			wantError: false,
		},
		{
			name: "task not found",
			request: &todov1.UpdateTaskRequest{
				Id:        "nonexistent",
				Completed: true,
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
					WithArgs("nonexistent").
					WillReturnError(sql.ErrNoRows)
			},
			wantError: true,
			errorCode: connect.CodeNotFound,
		},
		{
			name: "empty ID",
			request: &todov1.UpdateTaskRequest{
				Id: "",
			},
			setupMock: func(mock sqlmock.Sqlmock) {},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, service := setupMockDB(t)
			defer db.Close()

			tt.setupMock(mock)

			ctx := context.Background()
			req := connect.NewRequest(tt.request)

			resp, err := service.UpdateTask(ctx, req)

			if tt.wantError {
				assert.Error(t, err)
				assert.Equal(t, tt.errorCode, connect.CodeOf(err))
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp.Msg.Task)
				if tt.request.Title != "" {
					assert.Equal(t, tt.request.Title, resp.Msg.Task.Title)
				}
				assert.Equal(t, tt.request.Completed, resp.Msg.Task.Completed)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestTodoService_DeleteTask(t *testing.T) {
	tests := []struct {
		name      string
		taskID    string
		setupMock func(sqlmock.Sqlmock)
		wantError bool
		errorCode connect.Code
	}{
		{
			name:   "successful deletion",
			taskID: testTaskID,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM tasks WHERE id = \\?").
					WithArgs(testTaskID).
					WillReturnResult(sqlmock.NewResult(0, 1))
			},
			wantError: false,
		},
		{
			name:   "task not found",
			taskID: "nonexistent",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("DELETE FROM tasks WHERE id = \\?").
					WithArgs("nonexistent").
					WillReturnResult(sqlmock.NewResult(0, 0))
			},
			wantError: true,
			errorCode: connect.CodeNotFound,
		},
		{
			name:      "empty ID",
			taskID:    "",
			setupMock: func(mock sqlmock.Sqlmock) {},
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, service := setupMockDB(t)
			defer db.Close()

			tt.setupMock(mock)

			ctx := context.Background()
			req := connect.NewRequest(&todov1.DeleteTaskRequest{
				Id: tt.taskID,
			})

			_, err := service.DeleteTask(ctx, req)

			if tt.wantError {
				assert.Error(t, err)
				assert.Equal(t, tt.errorCode, connect.CodeOf(err))
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

// Integration test helpers
func TestTodoService_Integration_CreateAndRetrieve(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	db, mock, service := setupMockDB(t)
	defer db.Close()

	// Mock the full create flow
	taskTitle := "Integration Test Task"
	
	// INSERT mock
	mock.ExpectExec("INSERT INTO tasks").
		WithArgs(sqlmock.AnyArg(), taskTitle).
		WillReturnResult(sqlmock.NewResult(1, 1))
	
	// SELECT mock for created task
	createdRows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
		AddRow(testTaskID, taskTitle, false, testTime, testTime)
	mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(createdRows)
	
	// SELECT mock for get task
	getRows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
		AddRow(testTaskID, taskTitle, false, testTime, testTime)
	mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
		WithArgs(testTaskID).
		WillReturnRows(getRows)

	ctx := context.Background()

	// Create task
	createReq := connect.NewRequest(&todov1.CreateTaskRequest{
		Title: taskTitle,
	})
	
	createResp, err := service.CreateTask(ctx, createReq)
	require.NoError(t, err)
	require.NotNil(t, createResp.Msg.Task)
	
	createdTaskID := createResp.Msg.Task.Id
	assert.NotEmpty(t, createdTaskID)
	assert.Equal(t, taskTitle, createResp.Msg.Task.Title)

	// Retrieve task
	getReq := connect.NewRequest(&todov1.GetTaskRequest{
		Id: createdTaskID,
	})
	
	getResp, err := service.GetTask(ctx, getReq)
	require.NoError(t, err)
	require.NotNil(t, getResp.Msg.Task)
	
	assert.Equal(t, createdTaskID, getResp.Msg.Task.Id)
	assert.Equal(t, taskTitle, getResp.Msg.Task.Title)
	assert.False(t, getResp.Msg.Task.Completed)

	assert.NoError(t, mock.ExpectationsWereMet())
}

// Benchmark tests
func BenchmarkTodoService_CreateTask(b *testing.B) {
	db, mock, service := setupMockDB(b)
	defer db.Close()

	// Set up repeatable mocks for benchmark
	for i := 0; i < b.N; i++ {
		mock.ExpectExec("INSERT INTO tasks").
			WithArgs(sqlmock.AnyArg(), "Benchmark Task").
			WillReturnResult(sqlmock.NewResult(1, 1))
		
		rows := sqlmock.NewRows([]string{"id", "title", "completed", "created_at", "updated_at"}).
			AddRow(uuid.New().String(), "Benchmark Task", false, testTime, testTime)
		mock.ExpectQuery("SELECT id, title, completed, created_at, updated_at FROM tasks WHERE id = ?").
			WithArgs(sqlmock.AnyArg()).
			WillReturnRows(rows)
	}

	ctx := context.Background()
	req := connect.NewRequest(&todov1.CreateTaskRequest{
		Title: "Benchmark Task",
	})

	b.ResetTimer()
	
	for i := 0; i < b.N; i++ {
		_, err := service.CreateTask(ctx, req)
		if err != nil {
			b.Fatal(err)
		}
	}
}