import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Recycle,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Executive Summary", shortLabel: "Summary", icon: LayoutDashboard, end: true },
  { to: "/demand", label: "Demand Sensing", shortLabel: "Demand", icon: Activity },
  { to: "/shortages", label: "Stockout Watchlist", shortLabel: "Stockouts", icon: TriangleAlert },
  { to: "/expiry", label: "Expiry Rescue", shortLabel: "Expiry", icon: Recycle },
  { to: "/orders", label: "Order Book", shortLabel: "Orders", icon: ClipboardList },
  { to: "/escalation", label: "Escalation Center", shortLabel: "Escalation", icon: Megaphone },
];

export function pageTitle(pathname: string): string {
  const item =
    NAV_ITEMS.find((n) => n.to === pathname) ??
    NAV_ITEMS.find((n) => pathname.startsWith(n.to));
  return item?.label ?? "Executive Summary";
}
