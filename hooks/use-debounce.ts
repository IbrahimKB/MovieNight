import { useCallback, useRef } from "react";

interface UseDebounceOptions {
  delay?: number;
}

/**
 * Hook for debouncing function calls.
 * Delays execution of a callback until the specified delay has passed without any new calls.
 * Useful for avoiding rapid API calls during user input (e.g., slider changes).
 *
 * @param callback - Function to execute after delay
 * @param options - Configuration options (delay in ms, default 500)
 * @returns Object with execute method and cancel function
 */
export function useDebounce<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  options: UseDebounceOptions = {},
) {
  const { delay = 500 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule new execution
      timeoutRef.current = setTimeout(async () => {
        try {
          isExecutingRef.current = true;
          await callback(...args);
        } finally {
          isExecutingRef.current = false;
        }
      }, delay);
    },
    [callback, delay],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    execute,
    cancel,
    isExecuting: isExecutingRef.current,
  };
}
