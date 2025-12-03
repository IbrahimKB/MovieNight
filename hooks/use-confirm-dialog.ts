import { useState } from "react";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  onConfirm: (() => Promise<void>) | (() => void) | null;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDestructive: false,
    onConfirm: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = (
    title: string,
    description: string,
    onConfirm: (() => Promise<void>) | (() => void),
    options?: {
      confirmText?: string;
      cancelText?: string;
      isDestructive?: boolean;
    },
  ) => {
    setDialogState({
      isOpen: true,
      title,
      description,
      confirmText: options?.confirmText || "Confirm",
      cancelText: options?.cancelText || "Cancel",
      isDestructive: options?.isDestructive || false,
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const handleConfirm = async () => {
    if (!dialogState.onConfirm) return;

    setIsLoading(true);
    try {
      const result = dialogState.onConfirm();
      // Handle both async and sync functions
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  };

  return {
    ...dialogState,
    openDialog,
    closeDialog,
    handleConfirm,
    isLoading,
  };
}
