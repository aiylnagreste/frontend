"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
// import Topbar from "@/components/layout/Topbar";
import { SuspensionModal } from "@/components/ui/SuspensionModal";
import { fetchTenantStatus, QK } from "@/lib/queries";
import type { TenantStatus } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false);

  const { data } = useQuery<TenantStatus>({
    queryKey: QK.tenantStatus(),
    queryFn: fetchTenantStatus,
    // Poll every 30s so suspension is picked up without a hard refresh.
    refetchInterval: 30_000,
    // On 403 SALON_SUSPENDED the request throws; useQuery will keep last known status.
    // We still want the modal to appear on refetch failure, so suppress retries.
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const isSuspended = data?.status === "suspended";

  // 2-second delay as per requirement spec — show modal after initial render
  useEffect(() => {
  if (!isSuspended) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowModal(false);
    return;
  }
  const t = setTimeout(() => setShowModal(true), 2000);
  return () => clearTimeout(t);
}, [isSuspended]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 240,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          maxWidth: "calc(100vw - 240px)",
        }}
      >
        {/* <Topbar /> */}
        <main
          style={{
            flex: 1,
            padding: "24px 28px",
            background: "var(--color-canvas)",
          }}
        >
          {children}
        </main>
      </div>
      {showModal && <SuspensionModal salonName={data?.salon_name} reason={data?.reason} />}
    </div>
  );
}
