"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptions } from "@/lib/queries";
import type { Subscription } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard } from "lucide-react";

const C = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  primaryGlow: "rgba(13,148,136,0.12)",
  text: "#1A1D23",
  text2: "#5F6577",
  text3: "#9CA3B4",
  border: "#E6E4DF",
  border2: "#F0EEEA",
  success: "#10B981",
  successBg: "#ECFDF5",
  error: "#EF4444",
  errorBg: "#FEF2F2",
};

function formatCents(cents: number, cycle: string) {
  const price = `$${(cents / 100).toFixed(2)}`;
  if (cycle === "monthly") return `${price}/mo`;
  if (cycle === "yearly") return `${price}/yr`;
  return price;
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 11px", borderRadius: 99,
      fontSize: 11.5, fontWeight: 600, letterSpacing: "0.01em",
      background: active ? C.successBg : C.errorBg,
      color: active ? "#059669" : "#DC2626",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: active ? "#059669" : "#DC2626",
        boxShadow: active ? "0 0 0 2px rgba(5,150,105,0.2)" : "0 0 0 2px rgba(220,38,38,0.2)",
      }} />
      {active ? "Active" : "Suspended"}
    </span>
  );
}

export default function PaymentsPage() {
  const { data: subs, isLoading } = useQuery<Subscription[]>({
    queryKey: ["superSubscriptions"],
    queryFn: fetchSubscriptions,
    staleTime: 30_000,
  });

  // Sort chronologically: oldest first, newest at the end
  const sorted = [...(subs || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div style={{ padding: "28px 36px", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.primary}, #0F766E)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px ${C.primaryGlow}`,
          }}>
            <CreditCard size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24, fontWeight: 700, color: C.text,
              letterSpacing: "-0.025em", lineHeight: 1.2,
            }}>Payments</h1>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 2 }}>
              All salon subscriptions and billing activity
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border2}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(26,29,35,0.04)",
      }}>
        {/* Section Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "18px 22px",
          borderBottom: `1px solid ${C.border2}`,
          background: "linear-gradient(180deg, rgba(13,148,136,0.04), transparent)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: C.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CreditCard size={14} style={{ color: C.primary }} />
          </div>
          <div>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14.5, fontWeight: 600, color: C.text, margin: 0,
            }}>Subscription Records</h3>
            {sorted.length > 0 && (
              <p style={{ fontSize: 11.5, color: C.text3, marginTop: 1 }}>
                {sorted.filter(s => s.status === "active").length} active · {sorted.length} total
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} style={{ height: 48, borderRadius: 8 }} />)}
          </div>
        ) : !sorted.length ? (
          <EmptyState
            title="No subscriptions yet"
            description="Subscriptions appear here after salon admins complete registration."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                  {["Salon", "Owner", "Email", "Plan", "Price", "Status", "Since"].map(h => (
                    <th key={h} style={{
                      padding: "11px 22px", textAlign: "left",
                      fontSize: 10.5, fontWeight: 600, color: C.text3,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      background: C.bg,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id}
                    style={{ borderBottom: `1px solid ${C.border2}`, transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 22px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{s.salon_name}</div>
                    </td>
                    <td style={{ padding: "14px 22px", fontSize: 13, fontWeight: 500, color: C.text2 }}>{s.owner_name}</td>
                    <td style={{ padding: "14px 22px", fontSize: 13, color: C.text3 }}>{s.email}</td>
                    <td style={{ padding: "14px 22px" }}>
                      <span style={{
                        fontSize: 12.5, fontWeight: 600, color: C.primary,
                        background: C.primaryLight, padding: "3px 9px", borderRadius: 6,
                      }}>
                        {s.plan_name}
                      </span>
                    </td>
                    <td style={{
                      padding: "14px 22px",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13, fontWeight: 600, color: C.text,
                    }}>
                      {formatCents(s.price_cents, s.billing_cycle)}
                    </td>
                    <td style={{ padding: "14px 22px" }}>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={{
                      padding: "14px 22px",
                      fontSize: 12, color: C.text3,
                      fontFamily: "'Space Grotesk', monospace",
                      letterSpacing: "0.01em",
                    }}>
                      {new Date(s.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {sorted.length > 0 && (
          <div style={{
            padding: "12px 22px",
            borderTop: `1px solid ${C.border2}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 11.5, color: C.text3 }}>
              Showing {sorted.length} record{sorted.length !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 11.5, color: C.text3 }}>
              Newest → Oldest
            </span>
          </div>
        )}
      </div>
    </div>
  );
}