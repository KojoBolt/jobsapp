import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ToastItem, ToastVariant } from "./toast.types";

type CreateToastInput = Omit<ToastItem, "id">;

type ToastContextType = {
  toasts: ToastItem[];
  pushToast: (toast: CreateToastInput) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: CreateToastInput) => {
    const id = uid();
    const item: ToastItem = {
      id,
      variant: toast.variant,
      title: toast.title,
      message: toast.message,
      duration: toast.duration ?? 3000,
      actionLabel: toast.actionLabel,
      onAction: toast.onAction,
    };

    setToasts((prev) => [item, ...prev].slice(0, 5)); // keep max 5
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast, clearToasts }),
    [toasts, pushToast, dismissToast, clearToasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

// Convenience helpers (optional)
export const toast = {
  success: (pushToast: ToastContextType["pushToast"], message: string, title?: string) =>
    pushToast({ variant: "success", message, title }),
  error: (pushToast: ToastContextType["pushToast"], message: string, title?: string) =>
    pushToast({ variant: "error", message, title }),
  info: (pushToast: ToastContextType["pushToast"], message: string, title?: string) =>
    pushToast({ variant: "info", message, title }),
  warning: (pushToast: ToastContextType["pushToast"], message: string, title?: string) =>
    pushToast({ variant: "warning", message, title }),
};