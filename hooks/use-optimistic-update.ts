import { useCallback, useState } from "react";

interface UseOptimisticUpdateOptions<T> {
  onMutate: (data: T) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export const useOptimisticUpdate = <T>({
  onMutate,
  onSuccess,
  onError,
}: UseOptimisticUpdateOptions<T>) => {
  const [isPending, setIsPending] = useState(false);
  const [optimisticState, setOptimisticState] = useState<T | null>(null);

  const mutate = useCallback(
    async (data: T) => {
      setIsPending(true);
      setOptimisticState(data);

      try {
        const result = await onMutate(data);
        setOptimisticState(null);
        onSuccess?.(result);
        return result;
      } catch (error) {
        setOptimisticState(null);
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [onMutate, onSuccess, onError],
  );

  return {
    mutate,
    isPending,
    optimisticState,
  };
};
