"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStats, QK } from "@/lib/queries";
import type { DashboardStats } from "@/lib/types";
import { KpiSkeleton } from "@/components/ui/Skeleton";
import styles from "./KpiCards.module.css";

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
      <div className={styles.grid}>
        {TILES.map((t) => <KpiSkeleton key={t.key} />)}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {TILES.map((tile) => (
        <div
          key={tile.key}
          role="status"
          aria-label={tile.label}
          className={styles.tile}
        >
          <span className={styles.tile__label}>
            {tile.icon} {tile.label}
          </span>
          <span className={styles.tile__value}>
            {data?.[tile.key] ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
