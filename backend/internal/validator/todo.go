package validator

import (
	"errors"
	"strings"

	todov1 "buf.build/gen/go/wcygan/simple-connect-web-stack/protocolbuffers/go/todo/v1"
)

// ValidationError represents a validation error with context
type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return e.Message
}

// TodoValidator handles validation for todo-related operations
type TodoValidator struct{}

// NewTodoValidator creates a new todo validator
func NewTodoValidator() *TodoValidator {
	return &TodoValidator{}
}

// ValidateCreateTask validates a create task request
func (v *TodoValidator) ValidateCreateTask(req *todov1.CreateTaskRequest) error {
	if req == nil {
		return ValidationError{Field: "request", Message: "request cannot be nil"}
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		return ValidationError{Field: "title", Message: "title cannot be empty"}
	}

	if len(title) > 255 {
		return ValidationError{Field: "title", Message: "title cannot exceed 255 characters"}
	}

	return nil
}

// ValidateGetTask validates a get task request
func (v *TodoValidator) ValidateGetTask(req *todov1.GetTaskRequest) error {
	if req == nil {
		return ValidationError{Field: "request", Message: "request cannot be nil"}
	}

	if req.Id == "" {
		return ValidationError{Field: "id", Message: "id cannot be empty"}
	}

	return nil
}

// ValidateUpdateTask validates an update task request
func (v *TodoValidator) ValidateUpdateTask(req *todov1.UpdateTaskRequest) error {
	if req == nil {
		return ValidationError{Field: "request", Message: "request cannot be nil"}
	}

	if req.Id == "" {
		return ValidationError{Field: "id", Message: "id cannot be empty"}
	}

	if req.Title != "" {
		title := strings.TrimSpace(req.Title)
		if len(title) > 255 {
			return ValidationError{Field: "title", Message: "title cannot exceed 255 characters"}
		}
	}

	return nil
}

// ValidateDeleteTask validates a delete task request
func (v *TodoValidator) ValidateDeleteTask(req *todov1.DeleteTaskRequest) error {
	if req == nil {
		return ValidationError{Field: "request", Message: "request cannot be nil"}
	}

	if req.Id == "" {
		return ValidationError{Field: "id", Message: "id cannot be empty"}
	}

	return nil
}

// ValidateListTasks validates a list tasks request
func (v *TodoValidator) ValidateListTasks(req *todov1.ListTasksRequest) error {
	if req == nil {
		return ValidationError{Field: "request", Message: "request cannot be nil"}
	}

	if req.PageSize > 100 {
		return ValidationError{Field: "page_size", Message: "page size cannot exceed 100"}
	}

	return nil
}

// IsValidationError checks if an error is a validation error
func IsValidationError(err error) bool {
	var validationErr ValidationError
	return errors.As(err, &validationErr)
}

// GetValidationField extracts the field name from a validation error
func GetValidationField(err error) string {
	var validationErr ValidationError
	if errors.As(err, &validationErr) {
		return validationErr.Field
	}
	return ""
}