import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileSidebar, Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { pageTitle } from "@/components/layout/nav";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-dvh">
      <Sidebar />
      {/* Nav links close the drawer themselves via onNavigate */}
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <TopBar
          title={pageTitle(location.pathname)}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-line py-4 text-center text-[11px] font-medium text-sub">
          MedCare Supply Chain Control Tower · snapshot-driven · expiry-aware planning
        </footer>
      </div>
    </div>
  );
}
