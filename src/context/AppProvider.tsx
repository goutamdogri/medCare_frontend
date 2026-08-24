import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/api/client";
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

  const metaQuery = useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => apiGet<MetaResponse>("/api/meta", undefined, signal),
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
