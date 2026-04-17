"use client";

import { usePathname } from "next/navigation";
import { SuperSidebar } from "./components/SuperSidebar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebar = pathname === "/super-admin/login" || pathname === "/super-admin";

  if (noSidebar) return <>{children}</>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F3EF", fontFamily: "'DM Sans', sans-serif" }}>
      <SuperSidebar />
      <div style={{ flex: 1, marginLeft: 240, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
