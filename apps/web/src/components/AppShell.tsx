import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MobileNav, SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f7fbfb_0%,#eef5f4_48%,#f7f9f9_100%)]">
      <SidebarNav collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-7">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
