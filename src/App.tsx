import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@/context/AppProvider";
import { ToastProvider } from "@/context/ToastProvider";
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

const queryClient = createQueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route element={<AppShell />}>
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
        </ToastProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
