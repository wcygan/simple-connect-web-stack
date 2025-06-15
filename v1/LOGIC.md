Application Logic Summary

  Backend Logic (Rust/Axum)

  Core Request Flow

  Request → Router → Handler → Database → Response

  Primary Components

  1. Route Handlers (routes.rs)
  // Main task operations
  POST /tasks       → create_task()     // Validates title, generates UUID, inserts to DB
  GET  /tasks       → list_tasks()      // Handles pagination, search, filtering, sorting
  GET  /tasks/{id}  → get_task()        // Fetches single task by UUID
  PUT  /tasks/{id}  → update_task()     // Updates title/completed status
  DELETE /tasks/{id} → delete_task()    // Removes task from database
  GET  /health      → health_check()    // Returns {"status": "ok"}

  2. Database Operations (db.rs)
  // Core database logic
  - create_pool()           // MySQL connection pooling
  - init_db()               // Creates tasks table on startup
  - count_tasks_with_search() // Pagination calculations
  - get_paginated_tasks_with_search() // Main query with filters

  3. Data Models (models.rs)
  struct Task {
      id: Uuid,           // Primary key
      title: String,      // User input (validated)
      completed: bool,    // Task status
      created_at: DateTime,
      updated_at: DateTime,
  }

  struct TaskQueryParams {
      page: u32,          // Pagination
      page_size: u32,     // Items per page
      q: Option<String>,  // Search query
      status: Option<String>, // Filter: "completed"/"pending"/"all"
      sort_by: Option<String>, // "title"/"created_at"/etc
      sort_order: Option<SortOrder>, // "asc"/"desc"
  }

  Key Business Logic

  Task Creation:
  1. Validate title (not empty, max 255 chars)
  2. Generate UUID for new task
  3. Insert with completed: false
  4. Return created task with timestamps

  Task Listing with Intelligence:
  1. Parse query parameters (pagination, search, filters)
  2. Build dynamic SQL with WHERE clauses
  3. Execute count query for pagination metadata
  4. Execute data query with LIMIT/OFFSET
  5. Return paginated response with navigation info

  Search & Filter Logic:
  // Dynamic query building
  if let Some(query) = search_query {
      sql += " AND title LIKE ?";  // Title search
      bindings.push(format!("%{}%", query));
  }

  match status_filter {
      Some("completed") => sql += " AND completed = 1",
      Some("pending") => sql += " AND completed = 0",
      _ => {} // "all" or None - no filter
  }

  Frontend Logic (Deno Fresh 2.0)

  Architecture Pattern

  Route → API Proxy → Island Component → Preact Signals → UI Update

  Primary Components

  1. TodoApp Island (islands/TodoApp.tsx)
  // Central state management with Preact Signals
  const tasks = signal<Task[]>([]);           // Task list state
  const loading = signal(false);              // Loading indicator
  const error = signal<string | null>(null);  // Error handling
  const currentPage = signal(1);              // Pagination state
  const searchQuery = signal("");             // Search input
  const statusFilter = signal("all");         // Filter state

  2. API Integration Logic
  // Core CRUD operations
  async function loadTasks() {
      loading.value = true;
      const params = new URLSearchParams({
          page: currentPage.value.toString(),
          page_size: "20",
          q: searchQuery.value,
          status: statusFilter.value
      });

      const response = await fetch(`/api/tasks?${params}`);
      const data = await response.json();
      tasks.value = data.data;           // Update reactive state
      pagination.value = data.pagination;
  }

  async function createTask(title: string) {
      const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
      });

      if (response.ok) {
          await loadTasks(); // Refresh list
      }
  }

  3. Reactive UI Updates
  // Preact Signals automatically trigger re-renders
  function TaskList() {
      return (
          <div>
              {tasks.value.map(task => (
                  <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(task.id)}
                      onDelete={() => deleteTask(task.id)}
                  />
              ))}
          </div>
      );
  }

  Key Business Logic

  State Management Flow:
  1. User action (click, form submit) triggers function
  2. Function updates signal values
  3. Signals automatically re-render dependent components
  4. API calls update server state
  5. Fresh data loaded and signals updated again

  Search & Filter Logic:
  // Debounced search to avoid excessive API calls
  useEffect(() => {
      const timeoutId = setTimeout(() => {
          currentPage.value = 1;  // Reset to first page
          loadTasks();            // Trigger new search
      }, 300);

      return () => clearTimeout(timeoutId);
  }, [searchQuery.value, statusFilter.value]);

  Form Handling:
  function AddTaskForm() {
      const [title, setTitle] = useState("");

      const handleSubmit = async (e: Event) => {
          e.preventDefault();
          if (title.trim()) {
              await createTask(title.trim());
              setTitle("");  // Clear form
          }
      };
  }

  API Proxy Routes (routes/api/tasks/)
  // Frontend routes that proxy to backend
  export const handler: Handlers = {
      async GET(req) {
          const url = new URL(req.url);
          const backendUrl = `http://localhost:3000/tasks${url.search}`;
          const response = await fetch(backendUrl);
          return new Response(response.body, {
              status: response.status,
              headers: { "Content-Type": "application/json" }
          });
      }
  };

  Data Flow Summary

  Create Task:
  1. User types in form → useState updates local input
  2. Form submit → createTask() function called
  3. API call to /api/tasks → proxied to backend
  4. Backend validates & saves → returns new task
  5. loadTasks() called → fetches updated list
  6. tasks.signal updated → UI automatically re-renders

  Search/Filter:
  1. User types in search → searchQuery.signal updates
  2. useEffect triggers after 300ms debounce
  3. loadTasks() called with new parameters
  4. Backend executes filtered query
  5. Results update tasks.signal → filtered list renders

  This architecture provides immediate UI feedback (via signals) while maintaining server-side data consistency (via
  API calls), creating a smooth user experience with reliable data management.