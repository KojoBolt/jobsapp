export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
};