package service

import (
	"context"
	"database/sql"
	"testing"

	"connectrpc.com/connect"
	_ "github.com/go-sql-driver/mysql"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/emptypb"
)

// mockDB is a simple mock for testing
type mockDB struct {
	*sql.DB
}

func TestTodoService_HealthCheck(t *testing.T) {
	// This is a simple test to verify the service structure
	// In a real implementation, you'd use a test database or mocks
	
	service := &TodoService{db: nil} // We'll test nil handling
	
	ctx := context.Background()
	req := connect.NewRequest(&emptypb.Empty{})
	
	// Should return error when db is nil
	_, err := service.HealthCheck(ctx, req)
	if err == nil {
		t.Error("expected error for nil database, got nil")
	}
	
	// Verify it's the right kind of error
	if connectErr := connect.CodeOf(err); connectErr != connect.CodeUnavailable {
		t.Errorf("expected CodeUnavailable, got %v", connectErr)
	}
}

func TestTodoService_CreateTask_Validation(t *testing.T) {
	service := &TodoService{db: nil}
	
	tests := []struct {
		name      string
		title     string
		wantError bool
		errorCode connect.Code
	}{
		{
			name:      "empty title",
			title:     "",
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
		{
			name:      "whitespace only title",
			title:     "   ",
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
		{
			name:      "title too long",
			title:     string(make([]byte, 256)),
			wantError: true,
			errorCode: connect.CodeInvalidArgument,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			req := connect.NewRequest(&todov1.CreateTaskRequest{
				Title: tt.title,
			})
			
			_, err := service.CreateTask(ctx, req)
			
			if tt.wantError {
				if err == nil {
					t.Error("expected error, got nil")
					return
				}
				
				if code := connect.CodeOf(err); code != tt.errorCode {
					t.Errorf("expected code %v, got %v", tt.errorCode, code)
				}
			} else if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}