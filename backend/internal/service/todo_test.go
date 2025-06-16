package service

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect"
	"github.com/stretchr/testify/assert"
	"github.com/wcygan/simple-connect-web-stack/internal/repository"
	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
	"google.golang.org/protobuf/types/known/emptypb"
)

func TestTodoService_HealthCheck_Refactored(t *testing.T) {
	t.Run("healthy repository", func(t *testing.T) {
		mockRepo := repository.NewMockTodoRepository()
		service := NewTodoServiceWithRepository(mockRepo)

		ctx := context.Background()
		req := connect.NewRequest(&emptypb.Empty{})

		resp, err := service.HealthCheck(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "ok", resp.Msg.Status)
	})

	t.Run("repository health check fails", func(t *testing.T) {
		mockRepo := repository.NewMockTodoRepository()
		mockRepo.SetHealthError(errors.New("database connection failed"))
		service := NewTodoServiceWithRepository(mockRepo)

		ctx := context.Background()
		req := connect.NewRequest(&emptypb.Empty{})

		resp, err := service.HealthCheck(ctx, req)

		assert.Error(t, err)
		assert.Equal(t, connect.CodeUnavailable, connect.CodeOf(err))
		assert.Nil(t, resp)
	})
}

func TestTodoService_CreateTask_Refactored(t *testing.T) {
	t.Run("valid task creation", func(t *testing.T) {
		mockRepo := repository.NewMockTodoRepository()
		service := NewTodoServiceWithRepository(mockRepo)

		ctx := context.Background()
		req := connect.NewRequest(&todov1.CreateTaskRequest{
			Title: "Test Task",
		})

		resp, err := service.CreateTask(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "Test Task", resp.Msg.Task.Title)
		assert.False(t, resp.Msg.Task.Completed)
		assert.NotEmpty(t, resp.Msg.Task.Id)
	})

	t.Run("empty title", func(t *testing.T) {
		mockRepo := repository.NewMockTodoRepository()
		service := NewTodoServiceWithRepository(mockRepo)

		ctx := context.Background()
		req := connect.NewRequest(&todov1.CreateTaskRequest{
			Title: "",
		})

		resp, err := service.CreateTask(ctx, req)

		assert.Error(t, err)
		assert.Equal(t, connect.CodeInvalidArgument, connect.CodeOf(err))
		assert.Nil(t, resp)
	})

	t.Run("title too long", func(t *testing.T) {
		mockRepo := repository.NewMockTodoRepository()
		service := NewTodoServiceWithRepository(mockRepo)

		ctx := context.Background()
		longTitle := string(make([]byte, 256)) // 256 characters
		req := connect.NewRequest(&todov1.CreateTaskRequest{
			Title: longTitle,
		})

		resp, err := service.CreateTask(ctx, req)

		assert.Error(t, err)
		assert.Equal(t, connect.CodeInvalidArgument, connect.CodeOf(err))
		assert.Nil(t, resp)
	})
}