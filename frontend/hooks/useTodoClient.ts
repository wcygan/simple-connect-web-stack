import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { TodoService } from "@buf/wcygan_simple-connect-web-stack.bufbuild_es/todo/v1/todo_pb.js";
import { useMemo } from "preact/hooks";

/**
 * Custom hook for managing the TodoService RPC client
 * Provides a singleton client instance with proper configuration
 */
export function useTodoClient() {
  const client = useMemo(() => {
    const transport = createConnectTransport({ 
      baseUrl: "/api",
      // Add any additional transport configuration here
    });
    return createClient(TodoService, transport);
  }, []);

  return client;
}