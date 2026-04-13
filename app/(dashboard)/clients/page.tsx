"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClients, QK } from "@/lib/queries";
import type { Client } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: QK.clients(),
    queryFn: fetchClients,
    staleTime: 5 * 60_000,
  });

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
        Client Directory
      </h3>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} style={{ height: "44px" }} />)}
          </div>
        ) : clients.length === 0 ? (
          <EmptyState icon="👥" title="No clients yet" description="Clients appear here after their first booking." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Name", "Phone", "Bookings", "Last Visit", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-sub)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        background: "#fafafa",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{c.customer_name}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px" }}>{c.phone}</td>
                    <td style={{ padding: "12px 16px" }}>{c.booking_count}</td>
                    <td style={{ padding: "12px 16px", fontSize: "12px" }}>
                      {c.last_visit ? formatDate(c.last_visit) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge status="active" label="Active" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
