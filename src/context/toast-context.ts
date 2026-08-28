import { createContext, useCallback, useContext, useMemo } from "react";

/* ------------------------------------------------------------------ */
/* Context + hook (kept JSX-free for react-refresh)                    */
/* ------------------------------------------------------------------ */

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastContextValue {
  toasts: Toast[];
  notify: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Hook form of the toast API — must be used under <ToastProvider>. */
export function useToasts(): ToastContextValue & {
  success: (message: string) => void;
  error: (message: string) => void;
} {
  const contextValue = useContext(ToastContext);
  if (!contextValue)
    throw new Error("useToasts must be used within <ToastProvider>");
  // Memoize on the stable primitives (`notify`/`dismiss`) rather than the
  // context object, which is a fresh reference on every render. Otherwise
  // `success`/`error` become new functions each render and any consumer
  // effect depending on them re-fires endlessly.
  const { notify, dismiss, toasts } = contextValue;
  const onNotify = useCallback(
    (kind: ToastKind, message: string) => notify(kind, message),
    [notify],
  );
  return useMemo(
    () => ({
      toasts,
      dismiss,
      notify: onNotify,
      success: (message: string) => onNotify("success", message),
      error: (message: string) => onNotify("error", message),
    }),
    [toasts, dismiss, onNotify],
  );
}
