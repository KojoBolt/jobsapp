import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import type { ToastItem as ToastItemType } from "./toast.types";

type Props = {
  toast: ToastItemType;
  onDismiss: (id: string) => void;
};

const variantStyles = {
  success: { border: "border-emerald-500", icon: CheckCircle, iconClass: "text-emerald-500" },
  error: { border: "border-red-500", icon: XCircle, iconClass: "text-red-500" },
  info: { border: "border-blue-500", icon: Info, iconClass: "text-blue-500" },
  warning: { border: "border-amber-500", icon: AlertTriangle, iconClass: "text-amber-500" },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const ToastItem = ({ toast, onDismiss }: Props): JSX.Element => {
  const duration = toast.duration ?? 3000;

  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  const { border, icon: Icon, iconClass } = useMemo(
    () => variantStyles[toast.variant],
    [toast.variant]
  );

  // countdown + progress bar
  useEffect(() => {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const pct = 100 - (elapsed / duration) * 100;
      setProgress(clamp(pct, 0, 100));
      if (elapsed >= duration) {
        setIsLeaving(true);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  // exit animation then remove
  useEffect(() => {
    if (!isLeaving) return;
    const t = setTimeout(() => onDismiss(toast.id), 220);
    return () => clearTimeout(t);
  }, [isLeaving, onDismiss, toast.id]);

  const closeNow = () => setIsLeaving(true);

  return (
    <div
      className={[
        "relative overflow-hidden",
        "min-w-[320px] max-w-[420px]",
        "rounded-xl border bg-white shadow-lg",
        "px-4 py-3",
        border,
        "transition-all duration-200",
        isLeaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      {/* progress bar */}
      <div className="absolute left-0 top-0 h-[3px] w-full bg-slate-100">
        <div
          className="h-full bg-slate-900/20"
          style={{ width: `${progress}%`, transition: "width 80ms linear" }}
        />
      </div>

      <div className="flex items-start gap-3">
        <Icon size={20} className={`${iconClass} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          {toast.title ? (
            <div className="text-sm font-semibold text-slate-900">{toast.title}</div>
          ) : null}
          <div className="text-sm text-slate-700 break-words">{toast.message}</div>

          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                closeNow();
              }}
              className="mt-2 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={closeNow}
          className="p-1 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="Close toast"
        >
          <X size={16} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
};

export default ToastItem;