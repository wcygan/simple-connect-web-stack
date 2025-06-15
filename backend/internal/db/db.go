package db

import (
	"database/sql"
	"fmt"
)

// InitDB creates the tasks table if it doesn't exist
func InitDB(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS tasks (
			id VARCHAR(36) PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			completed BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_created_at (created_at),
			INDEX idx_completed (completed)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`

	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create tasks table: %w", err)
	}

	return nil
}