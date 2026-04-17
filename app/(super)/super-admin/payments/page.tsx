"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptions } from "@/lib/queries";
import type { Subscription } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircle, XCircle, CreditCard } from "lucide-react";

const C = {
  bg: "#F4F3EF", surface: "#FFFFFF",
  primary: "#0D9488", primaryLight: "#CCFBF1",
  text: "#1A1D23", text2: "#5F6577", text3: "#9CA3B4",
  border: "#E6E4DF", border2: "#F0EEEA",
  success: "#10B981", successBg: "#ECFDF5",
  error: "#EF4444", errorBg: "#FEF2F2",
};

function formatCents(cents: number, cycle: string) {
  const price = `$${(cents / 100).toFixed(2)}`;
  if (cycle === "monthly") return `${price}/mo`;
  if (cycle === "yearly") return `${price}/yr`;
  return price;
}

export default function PaymentsPage() {
  const { data: subs, isLoading } = useQuery<Subscription[]>({
    queryKey: ["superSubscriptions"],
    queryFn: fetchSubscriptions,
    staleTime: 30_000,
  });

  return (
    <div style={{ padding: "32px 36px", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Payments</h1>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>All salon subscriptions and billing activity</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 24px", borderBottom: `1px solid ${C.border2}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={14} style={{ color: C.primary }} />
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.text }}>Subscription Records</h3>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <Skeleton key={i} style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : !subs?.length ? (
          <EmptyState title="No subscriptions yet" description="Subscriptions appear here after salon admins complete registration." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border2}` }}>
                  {["Salon", "Owner", "Email", "Plan", "Price", "Status", "Since"].map(h => (
                    <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id}
                    style={{ borderBottom: `1px solid ${C.border2}`, transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 24px", fontWeight: 600, fontSize: 13, color: C.text }}>{s.salon_name}</td>
                    <td style={{ padding: "14px 24px", fontSize: 13, color: C.text2 }}>{s.owner_name}</td>
                    <td style={{ padding: "14px 24px", fontSize: 12, color: C.text3 }}>{s.email}</td>
                    <td style={{ padding: "14px 24px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{s.plan_name}</span>
                    </td>
                    <td style={{ padding: "14px 24px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: C.text }}>
                      {formatCents(s.price_cents, s.billing_cycle)}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 99,
                        fontSize: 12, fontWeight: 600,
                        background: s.status === "active" ? C.successBg : C.errorBg,
                        color: s.status === "active" ? "#059669" : "#DC2626",
                      }}>
                        {s.status === "active" ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {s.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", fontSize: 11, color: C.text3, fontFamily: "'Space Grotesk', monospace" }}>
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
