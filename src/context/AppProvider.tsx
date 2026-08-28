import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/api/client";
import { useActivePipelineRun } from "@/hooks/queries";
import { useAuth } from "@/context/auth-context";
import {
  AppContext,
  type AppContextValue,
  type Theme,
} from "@/context/app-context";
import type { MetaResponse } from "@/types/api";

const THEME_STORAGE_KEY = "mc-theme";

function initialTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Explicit date picked by the user; falls back to latest run when unset.
  const [asOfOverride, setAsOfOverride] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const { status } = useAuth();

  // Mount the global active-run watcher once so data refreshes when a run
  // completes — including runs rediscovered after a full page reload.
  useActivePipelineRun();

  // The meta payload is only fetched once a session exists; /api/meta is
  // bearer-protected, so skip it on the (unauthenticated) login screen.
  const metaQuery = useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => apiGet<MetaResponse>("/api/meta", undefined, signal),
    enabled: status === "authenticated",
    staleTime: 10 * 60_000,
  });

  const meta = metaQuery.data ?? null;

  // Sync React theme state with the external system (<html> class + storage).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const skuById = useMemo(
    () => new Map((meta?.skus ?? []).map((s) => [s.skuId, s])),
    [meta],
  );
  const regionById = useMemo(
    () => new Map((meta?.regions ?? []).map((r) => [r.locationId, r])),
    [meta],
  );

  const value: AppContextValue = {
    asOf: asOfOverride ?? meta?.asOf,
    latestAsOf: meta?.asOf,
    meta,
    metaError: metaQuery.error,
    setAsOf: setAsOfOverride,
    resetToLatest: () => setAsOfOverride(undefined),
    theme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    skuById,
    regionById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
