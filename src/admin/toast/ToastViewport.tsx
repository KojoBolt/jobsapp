import React from "react";
import { useToast } from "./ToastContext";
import ToastItem from "./ToastItem";

const ToastViewport = (): JSX.Element => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

export default ToastViewport;