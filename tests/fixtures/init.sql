-- Test database initialization script
-- This creates the same schema as production but optimized for testing

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Add indexes for better test performance
    INDEX idx_completed (completed),
    INDEX idx_created_at (created_at),
    INDEX idx_title (title(100))  -- Partial index for title searches
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a test audit table for tracking test operations
CREATE TABLE IF NOT EXISTS test_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(36),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_run_id VARCHAR(36),
    
    INDEX idx_test_run_id (test_run_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create triggers for audit logging in tests
DELIMITER $$

CREATE TRIGGER tasks_audit_insert 
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    INSERT INTO test_audit (operation, table_name, record_id, test_run_id)
    VALUES ('INSERT', 'tasks', NEW.id, @test_run_id);
END$$

CREATE TRIGGER tasks_audit_update 
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    INSERT INTO test_audit (operation, table_name, record_id, test_run_id)
    VALUES ('UPDATE', 'tasks', NEW.id, @test_run_id);
END$$

CREATE TRIGGER tasks_audit_delete 
AFTER DELETE ON tasks
FOR EACH ROW
BEGIN
    INSERT INTO test_audit (operation, table_name, record_id, test_run_id)
    VALUES ('DELETE', 'tasks', OLD.id, @test_run_id);
END$$

DELIMITER ;

-- Grant privileges to test user
GRANT ALL PRIVILEGES ON test_tasks_db.* TO 'testuser'@'%';
FLUSH PRIVILEGES;