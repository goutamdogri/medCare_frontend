import { createContext, useContext, useMemo } from "react";

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
  const { notify } = contextValue;
  return useMemo(
    () => ({
      ...contextValue,
      success: (message: string) => notify("success", message),
      error: (message: string) => notify("error", message),
    }),
    [contextValue, notify],
  );
}
