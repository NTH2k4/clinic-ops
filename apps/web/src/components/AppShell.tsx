import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MobileNav, SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <SidebarNav collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
