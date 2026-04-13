"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats, QK } from "@/lib/queries";
import type { DashboardStats } from "@/lib/types";
import { KpiSkeleton } from "@/components/ui/Skeleton";

const TILES = [
  { key: "today_bookings", label: "Today's Bookings", icon: "📅" },
  { key: "total_bookings", label: "Total Bookings", icon: "📋" },
  { key: "active_services", label: "Active Services", icon: "✨" },
  { key: "total_clients", label: "Total Clients", icon: "👥" },
] as const;

export default function KpiCards() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: QK.stats(),
    queryFn: () => fetchStats(),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {TILES.map((t) => <KpiSkeleton key={t.key} />)}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
      {TILES.map((tile) => (
        <div
          key={tile.key}
          role="status"
          aria-label={tile.label}
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "20px 24px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-sub)",
            }}
          >
            {tile.icon} {tile.label}
          </span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.2,
            }}
          >
            {data?.[tile.key] ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
