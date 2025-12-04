"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type Variant = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: number;
  title?: string;
  message: string;
  variant: Variant;
};

type ToastContextType = {
  notify: (opts: { message: string; title?: string; variant?: Variant; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function Icon({ variant }: { variant: Variant }) {
  const cls = "h-4 w-4";
  if (variant === "success") return <CheckCircle2 className={cls} />;
  if (variant === "warning") return <AlertTriangle className={cls} />;
  if (variant === "error") return <XCircle className={cls} />;
  return <Info className={cls} />;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = useCallback(
    ({ message, title, variant = "info", durationMs = 3500 }: { message: string; title?: string; variant?: Variant; durationMs?: number }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const item: ToastItem = { id, title, message, variant };
      setToasts((list) => [...list, item]);
      window.setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, durationMs);
    },
    []
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-white/90 p-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
          >
            <div
              className={
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full " +
                (t.variant === "success"
                  ? "text-emerald-600 border border-emerald-600"
                  : t.variant === "warning"
                  ? "text-amber-600 border border-amber-600"
                  : t.variant === "error"
                  ? "text-rose-600 border border-rose-600"
                  : "text-indigo-600 border border-indigo-600")
              }
            >
              <Icon variant={t.variant} />
            </div>
            <div className="flex-1">
              {t.title && <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t.title}</div>}
              <div className="text-xs text-zinc-600 dark:text-zinc-300">{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
