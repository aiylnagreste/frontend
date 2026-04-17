"use client";

import { usePathname } from "next/navigation";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/super-admin/dashboard": { title: "Dashboard", crumb: "Overview" },
  "/super-admin/salons": { title: "Salons", crumb: "Manage Salons" },
  "/super-admin/plans": { title: "Plans", crumb: "Subscription Plans" },
  "/super-admin/payments": { title: "Payments", crumb: "Payment History" },
  "/super-admin/change-password": { title: "Change Password", crumb: "Security" },
};

export function SuperTopbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Super Admin", crumb: "Dashboard" };
  const isDashboard = pathname === "/super-admin/dashboard";

  function handleNewSalon() {
    window.dispatchEvent(new CustomEvent("open-new-salon"));
  }

  return (
    <div className="topbar">
      <div className="topbar-title">
        <h1>{meta.title}</h1>
        <p>Super Admin → {meta.crumb}</p>
      </div>
      <div className="topbar-actions">
        <button className="topbar-notification">🔔</button>
        {isDashboard && (
          <button className="btn-primary" onClick={handleNewSalon}>
            + New Salon
          </button>
        )}
      </div>
    </div>
  );
}