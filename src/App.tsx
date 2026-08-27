import { lazy, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppProvider";
import { ToastProvider } from "@/context/ToastProvider";
import { AuthProvider } from "@/context/AuthProvider";
import { useAuth } from "@/context/auth-context";
import { Toaster } from "@/components/ui/Toaster";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { createQueryClient } from "@/hooks/queries";

// Route-level code splitting keeps the initial bundle lean.
const CommandCenter = lazy(() => import("@/features/command-center/CommandCenter"));
const DemandSensing = lazy(() => import("@/features/demand-sensing/DemandSensing"));
const ShortageWatchlist = lazy(() => import("@/features/shortage-watchlist/ShortageWatchlist"));
const ExpiryRescue = lazy(() => import("@/features/expiry-rescue/ExpiryRescue"));
const OrderBook = lazy(() => import("@/features/order-book/OrderBook"));
const EscalationCenter = lazy(() => import("@/features/escalation-center/EscalationCenter"));
const AuthPage = lazy(() => import("@/features/auth/AuthPage"));

const queryClient = createQueryClient();

/** Blocks the dashboard until a valid session is restored; bounces to /login. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-app">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <AppProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <PublicOnly>
                        <AuthPage />
                      </PublicOnly>
                    }
                  />
                  <Route
                    element={
                      <RequireAuth>
                        <AppShell />
                      </RequireAuth>
                    }
                  >
                    <Route index element={<CommandCenter />} />
                    <Route path="demand" element={<DemandSensing />} />
                    <Route path="shortages" element={<ShortageWatchlist />} />
                    <Route path="expiry" element={<ExpiryRescue />} />
                    <Route path="orders" element={<OrderBook />} />
                    <Route path="escalation" element={<EscalationCenter />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </ErrorBoundary>
              <Toaster />
            </BrowserRouter>
          </AppProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** If a session already exists, logged-out pages bounce straight to the app. */
function PublicOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-app">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }
  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
