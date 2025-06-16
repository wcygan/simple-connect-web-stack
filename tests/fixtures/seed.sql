-- Test data seeding script
-- Provides consistent test data for integration and e2e tests

-- Set test run ID for audit tracking
SET @test_run_id = 'seed-data-init';

-- Clear existing test data
DELETE FROM tasks;
DELETE FROM test_audit;

-- Insert test tasks with known IDs for predictable testing
INSERT INTO tasks (id, title, completed, created_at, updated_at) VALUES
-- Completed tasks
('test-task-001', 'Learn Go programming', TRUE, '2024-01-01 10:00:00', '2024-01-01 11:00:00'),
('test-task-002', 'Set up ConnectRPC backend', TRUE, '2024-01-01 10:30:00', '2024-01-01 12:00:00'),
('test-task-003', 'Create database schema', TRUE, '2024-01-01 11:00:00', '2024-01-01 13:00:00'),

-- Pending tasks
('test-task-004', 'Implement user authentication', FALSE, '2024-01-02 09:00:00', '2024-01-02 09:00:00'),
('test-task-005', 'Add API rate limiting', FALSE, '2024-01-02 09:30:00', '2024-01-02 09:30:00'),
('test-task-006', 'Write comprehensive tests', FALSE, '2024-01-02 10:00:00', '2024-01-02 10:00:00'),

-- Tasks with various edge cases for testing
('test-task-007', 'Task with special chars: !@#$%^&*()', FALSE, '2024-01-03 08:00:00', '2024-01-03 08:00:00'),
('test-task-008', 'Very long task title that tests the 255 character limit and ensures our UI can handle longer text gracefully without breaking the layout or causing overflow issues', FALSE, '2024-01-03 08:30:00', '2024-01-03 08:30:00'),
('test-task-009', 'Task with unicode: 🚀 Deploy to production 🎉', FALSE, '2024-01-03 09:00:00', '2024-01-03 09:00:00'),
('test-task-010', 'Task with HTML: <script>alert("test")</script>', FALSE, '2024-01-03 09:30:00', '2024-01-03 09:30:00'),

-- Tasks for pagination testing
('test-task-011', 'Pagination test task 1', FALSE, '2024-01-04 10:00:00', '2024-01-04 10:00:00'),
('test-task-012', 'Pagination test task 2', FALSE, '2024-01-04 10:01:00', '2024-01-04 10:01:00'),
('test-task-013', 'Pagination test task 3', FALSE, '2024-01-04 10:02:00', '2024-01-04 10:02:00'),
('test-task-014', 'Pagination test task 4', FALSE, '2024-01-04 10:03:00', '2024-01-04 10:03:00'),
('test-task-015', 'Pagination test task 5', FALSE, '2024-01-04 10:04:00', '2024-01-04 10:04:00'),

-- Tasks for search testing
('test-task-016', 'Frontend development task', FALSE, '2024-01-05 11:00:00', '2024-01-05 11:00:00'),
('test-task-017', 'Backend development task', FALSE, '2024-01-05 11:30:00', '2024-01-05 11:30:00'),
('test-task-018', 'Database optimization', FALSE, '2024-01-05 12:00:00', '2024-01-05 12:00:00'),
('test-task-019', 'API documentation', FALSE, '2024-01-05 12:30:00', '2024-01-05 12:30:00'),
('test-task-020', 'Performance testing', FALSE, '2024-01-05 13:00:00', '2024-01-05 13:00:00');

-- Insert some audit entries for testing audit functionality
INSERT INTO test_audit (operation, table_name, record_id, test_run_id) VALUES
('SEED', 'tasks', 'test-task-001', @test_run_id),
('SEED', 'tasks', 'test-task-002', @test_run_id),
('SEED', 'tasks', 'test-task-003', @test_run_id);

-- Create test helper procedures

DELIMITER $$

-- Procedure to clean test data between tests
CREATE PROCEDURE CleanTestData()
BEGIN
    DELETE FROM tasks WHERE id LIKE 'test-task-%' OR id LIKE 'temp-task-%';
    DELETE FROM test_audit WHERE test_run_id != 'seed-data-init';
END$$

-- Procedure to create a test task with predictable ID
CREATE PROCEDURE CreateTestTask(
    IN task_id VARCHAR(36),
    IN task_title VARCHAR(255),
    IN is_completed BOOLEAN
)
BEGIN
    INSERT INTO tasks (id, title, completed) 
    VALUES (task_id, task_title, is_completed);
END$$

-- Function to count tasks by status
CREATE FUNCTION CountTasksByStatus(status BOOLEAN) 
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE task_count INT;
    SELECT COUNT(*) INTO task_count FROM tasks WHERE completed = status;
    RETURN task_count;
END$$

DELIMITER ;

-- Grant execute permissions on procedures to test user
GRANT EXECUTE ON PROCEDURE test_tasks_db.CleanTestData TO 'testuser'@'%';
GRANT EXECUTE ON PROCEDURE test_tasks_db.CreateTestTask TO 'testuser'@'%';
GRANT EXECUTE ON FUNCTION test_tasks_db.CountTasksByStatus TO 'testuser'@'%';