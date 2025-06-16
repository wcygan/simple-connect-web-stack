import { useSignal } from "@preact/signals";
import { useCallback } from "preact/hooks";

/**
 * Custom hook for error boundary-like functionality
 * Provides error state management and recovery
 */
export function useErrorBoundary() {
  const error = useSignal<Error | null>(null);
  const hasError = useSignal(false);

  const captureError = useCallback((err: Error | string) => {
    const errorObj = err instanceof Error ? err : new Error(err);
    error.value = errorObj;
    hasError.value = true;
    
    // Log error for debugging
    console.error("Error captured by useErrorBoundary:", errorObj);
  }, []);

  const clearError = useCallback(() => {
    error.value = null;
    hasError.value = false;
  }, []);

  const retry = useCallback((retryFn?: () => void | Promise<void>) => {
    clearError();
    if (retryFn) {
      try {
        const result = retryFn();
        if (result instanceof Promise) {
          result.catch(captureError);
        }
      } catch (err) {
        captureError(err as Error);
      }
    }
  }, [clearError, captureError]);

  return {
    error: error.value,
    hasError: hasError.value,
    captureError,
    clearError,
    retry,
  };
}