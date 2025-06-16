import { describe, it } from "@std/testing/bdd";
import { assertEquals, assert } from "@std/assert";
import { useTodoState, useErrorBoundary } from "../../hooks/index.ts";

describe("Custom Hooks", () => {
  describe("useTodoState", () => {
    it("should initialize with default values", () => {
      const {
        tasks,
        loading,
        error,
        newTaskTitle,
        isAdding
      } = useTodoState();

      assertEquals(tasks.value, []);
      assertEquals(loading.value, true);
      assertEquals(error.value, null);
      assertEquals(newTaskTitle.value, "");
      assertEquals(isAdding.value, false);
    });

    it("should provide helper functions", () => {
      const {
        clearError,
        setError,
        setLoading,
        setTasks,
        addTask,
        updateTask,
        removeTask,
        sortTasksByDate
      } = useTodoState();

      assertEquals(typeof clearError, "function");
      assertEquals(typeof setError, "function");
      assertEquals(typeof setLoading, "function");
      assertEquals(typeof setTasks, "function");
      assertEquals(typeof addTask, "function");
      assertEquals(typeof updateTask, "function");
      assertEquals(typeof removeTask, "function");
      assertEquals(typeof sortTasksByDate, "function");
    });

    it("should update error state correctly", () => {
      const { error, setError, clearError } = useTodoState();

      // Initially no error
      assertEquals(error.value, null);

      // Set error
      setError("Test error");
      assertEquals(error.value, "Test error");

      // Clear error
      clearError();
      assertEquals(error.value, null);
    });

    it("should update loading state correctly", () => {
      const { loading, setLoading } = useTodoState();

      // Initially loading
      assertEquals(loading.value, true);

      // Set loading to false
      setLoading(false);
      assertEquals(loading.value, false);

      // Set loading to true
      setLoading(true);
      assertEquals(loading.value, true);
    });
  });

  describe("useErrorBoundary", () => {
    it("should initialize with no error", () => {
      const { error, hasError } = useErrorBoundary();

      assertEquals(error, null);
      assertEquals(hasError, false);
    });

    it("should capture errors correctly", () => {
      const { error, hasError, captureError } = useErrorBoundary();

      const testError = new Error("Test error");
      captureError(testError);

      assertEquals(error, testError);
      assertEquals(hasError, true);
    });

    it("should capture string errors correctly", () => {
      const { error, hasError, captureError } = useErrorBoundary();

      captureError("String error");

      assertEquals(error?.message, "String error");
      assertEquals(hasError, true);
    });

    it("should clear errors correctly", () => {
      const { error, hasError, captureError, clearError } = useErrorBoundary();

      // Capture an error first
      captureError("Test error");
      assertEquals(hasError, true);

      // Clear the error
      clearError();
      assertEquals(error, null);
      assertEquals(hasError, false);
    });

    it("should provide retry functionality", () => {
      const { hasError, captureError, retry } = useErrorBoundary();

      // Capture an error first
      captureError("Test error");
      assertEquals(hasError, true);

      // Retry should clear the error
      retry();
      assertEquals(hasError, false);
    });
  });
});