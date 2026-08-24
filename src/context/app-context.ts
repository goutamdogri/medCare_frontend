import { createContext, useContext } from "react";
import type {
  MetaResponse,
  RegionMaster,
  SkuMaster,
} from "@/types/api";

export type Theme = "light" | "dark";

export interface AppContextValue {
  /** Resolved snapshot date (yyyy-MM-dd): explicit pick ?? latest run date. */
  asOf?: string;
  /** Latest successful run date from /api/meta. */
  latestAsOf?: string;
  meta: MetaResponse | null;
  metaError: unknown;
  setAsOf: (date: string) => void;
  resetToLatest: () => void;
  theme: Theme;
  toggleTheme: () => void;
  skuById: Map<string, SkuMaster>;
  regionById: Map<string, RegionMaster>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
