"use client";

import { usePathname } from "next/navigation";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/super-admin/dashboard": { title: "Dashboard", crumb: "Super Admin → Overview" },
  "/super-admin/salons":    { title: "Salons",    crumb: "Super Admin → Salons" },
  "/super-admin/plans":     { title: "Plans",     crumb: "Super Admin → Billing → Plans" },
  "/super-admin/payments":  { title: "Payments",  crumb: "Super Admin → Billing → Payments" },
  "/super-admin/change-password": { title: "Change Password", crumb: "Super Admin → System" },
};

export function SuperTopbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Super Admin", crumb: "Super Admin" };
  const isDashboard = pathname === "/super-admin/dashboard";

  function handleNewSalon() {
    window.dispatchEvent(new CustomEvent("open-new-salon"));
  }

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 flex-shrink-0">
      <div>
        <h1 className="text-[15px] font-bold text-slate-900 leading-tight">{meta.title}</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">{meta.crumb}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-sm hover:bg-slate-100 transition-colors"
        >
          🔔
        </button>
        {isDashboard && (
          <button
            onClick={handleNewSalon}
            className="bg-violet-600 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
          >
            + New Salon
          </button>
        )}
      </div>
    </header>
  );
}
