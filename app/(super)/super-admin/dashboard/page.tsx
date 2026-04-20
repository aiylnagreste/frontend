"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenants, fetchSuperStats, fetchPlans, QK } from "@/lib/queries";
import type { Tenant, Plan } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState, useEffect } from "react";
import { validateName, validateEmail, validatePhoneRequired } from "@/lib/validation";
import {
  Search, Plus, Store, CheckCircle, XCircle,
  DollarSign, Key, Users, Mail, Calendar, Power, X,
  ArrowUp, ArrowDown, TriangleAlert, CreditCard, Loader2,
  LayoutDashboard,
} from "lucide-react";

const C = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  primary: "#0D9488",
  primaryHover: "#0F766E",
  primaryLight: "#CCFBF1",
  primaryGlow: "rgba(13,148,136,0.12)",
  accent: "#E8913A",
  accentLight: "#FEF3C7",
  text: "#1A1D23",
  text2: "#5F6577",
  text3: "#9CA3B4",
  border: "#E6E4DF",
  border2: "#F0EEEA",
  success: "#10B981",
  successBg: "#ECFDF5",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
};

interface ResetRequest {
  tenantId: string;
  email: string;
  salonName: string;
  ownerName: string;
  requestedAt: string;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, change, iconEl, accent, trend }: {
  title: string; value: string | number; change: string;
  iconEl: React.ReactNode; accent: "teal" | "green" | "red" | "amber"; trend?: "up" | "down" | "neutral";
}) {
  const palette: Record<string, { icon: string; iconBg: string }> = {
    teal:  { icon: C.primary, iconBg: C.primaryLight },
    green: { icon: C.success, iconBg: C.successBg },
    red:   { icon: C.error,   iconBg: C.errorBg },
    amber: { icon: C.accent,  iconBg: C.accentLight },
  };
  const p = palette[accent];

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border2}`,
      borderRadius: 14,
      padding: "20px 22px",
      boxShadow: "0 1px 3px rgba(26,29,35,0.04)",
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,29,35,0.07)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(26,29,35,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text2, letterSpacing: "0.01em" }}>{title}</span>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: p.iconBg, color: p.icon,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{iconEl}</div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 10 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
          background: trend === "up" ? C.successBg : trend === "down" ? C.errorBg : C.border2,
          color: trend === "up" ? "#059669" : trend === "down" ? "#DC2626" : C.text3,
        }}>
          {trend === "up" && <ArrowUp size={10.5} />}
          {trend === "down" && <ArrowDown size={10.5} />}
          {change}
        </span>
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SuperDashboardPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [setPasswordFor, setSetPasswordFor] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editPlanFor, setEditPlanFor] = useState<{
    tenantId: string;
    salonName: string;
    currentPlan: string | null;
  } | null>(null);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener("open-new-salon", handler);
    return () => window.removeEventListener("open-new-salon", handler);
  }, []);

  const { data: tenants, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery<Tenant[]>({
    queryKey: ["tenants"], queryFn: fetchTenants, staleTime: 0,
  });
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["superStats"], queryFn: fetchSuperStats, staleTime: 0,
  });
  const { data: resetRequests = [], refetch: refetchResets } = useQuery<ResetRequest[]>({
    queryKey: ["resetRequests"],
    queryFn: async () => {
      const res = await fetch("/super-admin/api/reset-requests", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/super-admin/api/tenants/${encodeURIComponent(id)}/status`, {
        status: status === "active" ? "suspended" : "active",
      }),
    onSuccess: () => { toast.success("Status updated"); refetchTenants(); refetchStats(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const tenantsArray = Array.isArray(tenants) ? tenants : [];
  const suspendedTenants = tenantsArray.filter(t => t.status !== "active").length;
  const isLoading = tenantsLoading || statsLoading;

  const totalSalons = stats?.total_tenants ?? tenantsArray.length;
  const activeSalons = stats?.active_tenants ?? tenantsArray.filter(t => t.status === "active").length;
  const activePercentage = totalSalons > 0 ? Math.round((activeSalons / totalSalons) * 100) : 0;

  const filteredTenants = tenantsArray
    .filter(t =>
      t.salon_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    // Oldest first, newest at the bottom
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });

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
            <LayoutDashboard size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24, fontWeight: 700, color: C.text,
              letterSpacing: "-0.025em", lineHeight: 1.2,
            }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 2 }}>
              Super Admin · System Overview
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 20, border: `1px solid ${C.border2}` }}>
              <Skeleton style={{ height: 10, width: "40%", marginBottom: 14, borderRadius: 6 }} />
              <Skeleton style={{ height: 30, width: "55%", borderRadius: 6 }} />
              <Skeleton style={{ height: 20, width: "35%", marginTop: 10, borderRadius: 99 }} />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Total Salons" value={totalSalons} change={`+${stats?.new_this_month || 0} this month`} iconEl={<Store size={16} />} accent="teal" trend="up" />
            <StatCard title="Active" value={activeSalons} change={`${activePercentage}% uptime`} iconEl={<CheckCircle size={16} />} accent="green" trend="up" />
            <StatCard title="Suspended" value={suspendedTenants} change="needs attention" iconEl={<XCircle size={16} />} accent="red" trend="down" />
            <StatCard title="Monthly Revenue" value={`$${((stats?.mrr || 0) / 100).toLocaleString()}`} change={`${stats?.revenue_change || 0}% vs last month`} iconEl={<DollarSign size={16} />} accent="amber" trend={(stats?.revenue_change ?? 0) >= 0 ? "up" : "down"} />
          </>
        )}
      </div>

      {/* Reset Requests */}
      {resetRequests.length > 0 && (
        <div style={{
          background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 14,
          overflow: "hidden", marginBottom: 20,
          boxShadow: "0 1px 3px rgba(26,29,35,0.04)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "16px 22px", borderBottom: `1px solid ${C.border2}`,
            background: "linear-gradient(180deg, rgba(239,68,68,0.04), transparent)",
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.errorBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Key size={14} style={{ color: C.error }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14.5, fontWeight: 600, color: C.text }}>Password Reset Requests</h3>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: C.error, color: "#fff", letterSpacing: "0.02em" }}>
              {resetRequests.length}
            </span>
          </div>
          {resetRequests.map((r, idx) => (
            <div key={r.tenantId} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 22px",
              borderBottom: idx < resetRequests.length - 1 ? `1px solid ${C.border2}` : "none",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{r.salonName}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
                  {[
                    { icon: <Users size={11} />, text: r.ownerName },
                    { icon: <Mail size={11} />, text: r.email },
                    { icon: <Calendar size={11} />, text: new Date(r.requestedAt).toLocaleDateString() },
                  ].map((m, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.text3 }}>
                      {m.icon}{m.text}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSetPasswordFor({ id: r.tenantId, name: r.salonName })}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})`,
                  color: "#fff", border: "none", borderRadius: 9,
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: `0 2px 8px ${C.primaryGlow}`,
                  transition: "box-shadow 0.18s, transform 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(13,148,136,0.25)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Key size={12} /> Set Password
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Salons Table */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(26,29,35,0.04)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: `1px solid ${C.border2}`,
          flexWrap: "wrap", gap: 12,
          background: "linear-gradient(180deg, rgba(13,148,136,0.04), transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Store size={14} style={{ color: C.primary }} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14.5, fontWeight: 600, color: C.text }}>Managed Salons</h3>
              <p style={{ fontSize: 11.5, color: C.text3, marginTop: 1 }}>{filteredTenants.length} of {tenantsArray.length} shown</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.text3 }} />
              <input
                type="text" placeholder="Search salons..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                  border: `1.5px solid ${C.border}`, borderRadius: 10,
                  fontSize: 13, width: 240, outline: "none", color: C.text,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryGlow}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})`,
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 650, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: `0 2px 8px ${C.primaryGlow}`,
                transition: "box-shadow 0.18s, transform 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,148,136,0.25)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Plus size={15} strokeWidth={2.5} /> New Salon
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} style={{ height: 48, borderRadius: 8 }} />)}
          </div>
        ) : filteredTenants.length === 0 ? (
          <EmptyState icon="🏪" title="No salons found" description={searchTerm ? "Try a different search term" : 'Click "New Salon" to get started.'} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                  {["Salon", "Owner", "Contact", "Status", "Actions"].map(h => (
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
                {filteredTenants.map(t => {
                  const tid = t.tenant_id || t.id || "";
                  return (
                    <tr key={tid} style={{ borderBottom: `1px solid ${C.border2}`, transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 22px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{t.salon_name}</div>
                        <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2, fontFamily: "'Space Grotesk', monospace", letterSpacing: "0.02em" }}>{tid.slice(0, 12)}…</div>
                      </td>
                      <td style={{ padding: "14px 22px", fontSize: 13, fontWeight: 500, color: C.text2 }}>{t.owner_name}</td>
                      <td style={{ padding: "14px 22px" }}>
                        <div style={{ fontSize: 13, color: C.text2 }}>{t.email}</div>
                        <div style={{ fontSize: 12, color: C.text3, marginTop: 1 }}>{t.phone}</div>
                      </td>
                      <td style={{ padding: "14px 22px" }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: "14px 22px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => toggleMutation.mutate({ id: tid, status: t.status })}
                            disabled={toggleMutation.isPending}
                            title={t.status === "active" ? "Suspend" : "Activate"}
                            style={{
                              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "transparent", border: "1.5px solid transparent", borderRadius: 9, cursor: "pointer",
                              color: t.status === "active" ? C.error : C.success,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = t.status === "active" ? C.errorBg : C.successBg;
                              e.currentTarget.style.borderColor = t.status === "active" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor = "transparent";
                            }}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => setEditPlanFor({ tenantId: t.tenant_id, salonName: t.salon_name, currentPlan: t.subscription_plan })}
                            title="Edit Plan"
                            style={{
                              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "transparent", border: "1.5px solid transparent", borderRadius: 9, cursor: "pointer",
                              color: C.primary,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = C.primaryLight;
                              e.currentTarget.style.borderColor = "rgba(13,148,136,0.2)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor = "transparent";
                            }}
                          >
                            <CreditCard size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {filteredTenants.length > 0 && (
          <div style={{
            padding: "12px 22px",
            borderTop: `1px solid ${C.border2}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 11.5, color: C.text3 }}>
              Showing {filteredTenants.length} salon{filteredTenants.length !== 1 ? "s" : ""}
              {searchTerm ? ` matching "${searchTerm}"` : ""}
            </span>
            <span style={{ fontSize: 11.5, color: C.text3 }}>
              Oldest → Newest
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <CreateTenantModal
          onClose={() => setShowModal(false)}
          onCreated={() => { refetchTenants(); refetchStats(); setShowModal(false); }}
        />
      )}
      {setPasswordFor && (
        <SetPasswordModal
          tenantId={setPasswordFor.id} salonName={setPasswordFor.name}
          onClose={() => setSetPasswordFor(null)}
          onSaved={() => { refetchResets(); setSetPasswordFor(null); }}
        />
      )}
      {editPlanFor && (
        <EditPlanModal
          tenantId={editPlanFor.tenantId}
          salonName={editPlanFor.salonName}
          currentPlan={editPlanFor.currentPlan}
          onClose={() => { setEditPlanFor(null); refetchTenants(); refetchStats(); }}
        />
      )}
    </div>
  );
}

// ── Shared Modal Input ────────────────────────────────────────────────────────
function ModalInput({ label, type = "text", value, onChange, placeholder, error }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11.5, fontWeight: 600,
        color: focused ? C.primary : C.text2,
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7,
        transition: "color 0.2s",
      }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px",
          border: `1.5px solid ${error ? C.error : focused ? C.primary : C.border}`,
          borderRadius: 10,
          fontSize: 14, color: C.text, outline: "none",
          fontFamily: "'DM Sans', sans-serif",
          background: C.surface,
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: error ? `0 0 0 3px rgba(239,68,68,0.08)` : focused ? `0 0 0 3px ${C.primaryGlow}` : "none",
        }}
      />
      {error && <p style={{ fontSize: 12, color: C.error, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
        <X size={11} /> {error}
      </p>}
    </div>
  );
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ children, maxWidth }: { children: React.ReactNode; maxWidth?: number }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(14,16,21,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          window.dispatchEvent(new CustomEvent("close-modal"));
        }
      }}
    >
      <div style={{
        background: C.surface, borderRadius: 18,
        width: "92%", maxWidth: maxWidth || 480,
        boxShadow: "0 24px 60px rgba(14,16,21,0.18), 0 0 0 1px rgba(255,255,255,0.05)",
        overflow: "hidden",
        animation: "modalIn 0.2s ease-out",
      }}>
        {children}
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function ModalHeader({ icon, iconBg, iconColor, title, subtitle, onClose }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; subtitle?: React.ReactNode; onClose: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "22px 26px 18px",
      borderBottom: `1px solid ${C.border2}`,
      background: "linear-gradient(180deg, rgba(13,148,136,0.04), transparent)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12.5, color: C.text3, marginTop: 2 }}>{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bg, border: `1px solid ${C.border}`,
          cursor: "pointer", color: C.text3, borderRadius: 8,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text3; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.text3; e.currentTarget.style.borderColor = C.border; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, confirmDisabled, loading }: {
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; confirmDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", gap: 8,
      padding: "16px 26px",
      background: C.bg,
      borderTop: `1px solid ${C.border2}`,
    }}>
      <button
        onClick={onCancel}
        style={{
          padding: "10px 20px", background: C.surface,
          border: `1.5px solid ${C.border}`, borderRadius: 10,
          fontSize: 13, fontWeight: 600, color: C.text2, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.border2; e.currentTarget.style.borderColor = C.text3; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
      >Cancel</button>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled || loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "10px 20px",
          background: loading || confirmDisabled
            ? "#9CA3B4"
            : `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})`,
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700, color: "#fff",
          cursor: loading || confirmDisabled ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: loading || confirmDisabled ? "none" : `0 2px 8px ${C.primaryGlow}`,
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          if (!loading && !confirmDisabled) {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,148,136,0.25)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={e => {
          if (!loading && !confirmDisabled) {
            e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {loading && <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
        {confirmLabel}
      </button>
    </div>
  );
}

// ── Create Tenant Modal ───────────────────────────────────────────────────────
// ── Create Tenant Modal ───────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ salon_name: "", owner_name: "", email: "", phone: "", password: "", plan_id: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { data: plans, isLoading: plansLoading } = useQuery({ queryKey: QK.plans(), queryFn: fetchPlans });

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, [onClose]);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    const salonErr = validateName(form.salon_name);
    if (salonErr) errs.salon_name = salonErr === "This field is required" ? "Salon name is required" : salonErr;
    const ownerErr = validateName(form.owner_name);
    if (ownerErr) errs.owner_name = ownerErr === "This field is required" ? "Owner name is required" : ownerErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhoneRequired(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.password.trim()) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!form.plan_id) errs.plan_id = "Please select a plan";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await api.post("/super-admin/api/tenants", form);
      toast.success(`Salon "${form.salon_name}" created!`);
      onCreated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create salon");
    } finally {
      setLoading(false);
    }
  }

  const activePlans = (plans || []).filter((p: Plan) => p.is_active === true || p.is_active === 1 || p.is_active === "1");

  return (
    <ModalShell maxWidth={490}>
      <ModalHeader
        icon={<Plus size={15} />}
        iconBg={C.primaryLight}
        iconColor={C.primary}
        title="Create New Salon"
        subtitle="Add a new salon to the platform"
        onClose={onClose}
      />
      <div style={{ padding: "22px 26px", maxHeight: "60vh", overflowY: "auto" }}>
        <ModalInput label="Salon Name" value={form.salon_name} onChange={v => set("salon_name", v)} placeholder="e.g., Royal Glam Studio" error={errors.salon_name} />
        <ModalInput label="Owner Name" value={form.owner_name} onChange={v => set("owner_name", v)} placeholder="Full name" error={errors.owner_name} />
        <ModalInput label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} placeholder="salon@example.com" error={errors.email} />
        <ModalInput label="Phone Number" type="tel" value={form.phone} onChange={v => set("phone", v)} placeholder="+92 300 1234567" error={errors.phone} />
        <ModalInput label="Password" type="password" value={form.password} onChange={v => set("password", v)} placeholder="Min 6 characters" error={errors.password} />
        <div style={{ marginBottom: 4 }}>
          <label style={{
            display: "block", fontSize: 11.5, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.06em", color: C.text2, marginBottom: 7,
          }}>
            Plan <span style={{ color: C.error }}>*</span>
          </label>
          <select
            value={form.plan_id}
            onChange={e => set("plan_id", e.target.value)}
            disabled={plansLoading}
            style={{
              width: "100%", padding: "11px 14px",
              border: `1.5px solid ${errors.plan_id ? C.error : C.border}`,
              borderRadius: 10,
              fontSize: 14, color: form.plan_id ? C.text : C.text3,
              fontFamily: "'DM Sans', sans-serif",
              background: C.surface, outline: "none",
              boxShadow: errors.plan_id ? `0 0 0 3px rgba(239,68,68,0.08)` : "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              cursor: plansLoading ? "not-allowed" : "pointer",
            }}
            onFocus={e => { if (!errors.plan_id) { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryGlow}`; } }}
            onBlur={e => { if (!errors.plan_id) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; } }}
          >
            <option value="" disabled>
              {plansLoading ? "Loading plans…" : activePlans.length === 0 ? "No active plans available" : "Select a plan"}
            </option>
            {activePlans.map((p: Plan) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.plan_id && (
            <p style={{ fontSize: 12, color: C.error, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <X size={11} /> {errors.plan_id}
            </p>
          )}
          {!plansLoading && activePlans.length === 0 && (
            <p style={{ fontSize: 12, color: C.warning, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <TriangleAlert size={12} /> No active plans available. Create a plan first.
            </p>
          )}
        </div>
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleCreate}
        confirmLabel={loading ? "Creating…" : "Create Salon"}
        confirmDisabled={activePlans.length === 0}
        loading={loading}
      />
    </ModalShell>
  );
}

// ── Edit Plan Modal ───────────────────────────────────────────────────────────
function EditPlanModal({ tenantId, salonName, currentPlan, onClose }: {
  tenantId: string; salonName: string; currentPlan: string | null; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: QK.plans(),
    queryFn: fetchPlans,
  });

  const availablePlans = (plans || []).filter((plan: Plan) => {
    const isActive = plan.is_active === true || plan.is_active === 1 || plan.is_active === "1";
    return isActive;
  });

  const initialPlanId = (() => {
    if (!availablePlans.length || !currentPlan) return "";
    const match = availablePlans.find((p: Plan) => p.name === currentPlan);
    return match ? String(match.id) : "";
  })();

  const [form, setForm] = useState({ plan_id: initialPlanId });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (availablePlans.length && currentPlan && !form.plan_id) {
      const match = availablePlans.find((p: Plan) => p.name === currentPlan);
      if (match) setForm(f => ({ ...f, plan_id: String(match.id) }));
    }
  }, [availablePlans, currentPlan]);

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: (body: { plan_id: number }) =>
      api.patch<{ ok: boolean; error?: string }>(`/super-admin/api/tenants/${encodeURIComponent(tenantId)}/plan`, body),
    onSuccess: resp => {
      if (resp && resp.ok === false) {
        toast.error(resp.error || "Failed to update plan");
        return;
      }
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(`Plan updated for ${salonName}`);
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to update plan"),
  });

  function handleSubmit() {
    const newErrors: Record<string, string> = {};
    if (!form.plan_id) newErrors.plan_id = "Please select a plan";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    mutation.mutate({ plan_id: parseInt(form.plan_id, 10) });
  }

  const isLoading = plansLoading;

  const getPlanDisplayText = (plan: Plan) => {
    let text = plan.name;
    if (currentPlan === plan.name) text += " (current)";
    if (plan.price_cents === 0) {
      text += " (Free)";
    } else {
      const price = (plan.price_cents / 100).toFixed(2);
      const cycle = plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle === 'yearly' ? 'yr' : 'one-time';
      text += ` ($${price}/${cycle})`;
    }
    return text;
  };

  return (
    <ModalShell maxWidth={440}>
      <ModalHeader
        icon={<CreditCard size={15} />}
        iconBg={C.primaryLight}
        iconColor={C.primary}
        title="Edit Plan"
        subtitle={
          currentPlan
            ? <span>Current plan: <strong style={{ color: C.primary }}>{currentPlan}</strong></span>
            : salonName
        }
        onClose={onClose}
      />
      <div style={{ padding: "22px 26px" }}>
        <div style={{ marginBottom: 4 }}>
          <label style={{
            display: "block", fontSize: 11.5, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.06em", color: C.text2, marginBottom: 7,
          }}>Select New Plan</label>
          <select
            value={form.plan_id}
            onChange={e => { setForm(f => ({ ...f, plan_id: e.target.value })); setErrors({}); }}
            disabled={isLoading}
            style={{
              width: "100%", padding: "11px 14px",
              border: `1.5px solid ${errors.plan_id ? C.error : C.border}`,
              borderRadius: 10, fontSize: 14, color: C.text,
              fontFamily: "'DM Sans', sans-serif",
              background: C.surface, outline: "none",
              boxShadow: errors.plan_id ? `0 0 0 3px rgba(239,68,68,0.08)` : "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onFocus={e => { if (!errors.plan_id) { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryGlow}`; } }}
            onBlur={e => { if (!errors.plan_id) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; } }}
          >
            <option value="" disabled>
              {isLoading ? "Loading plans…" : availablePlans.length === 0 ? "No active plans available" : "Select a plan"}
            </option>
            {availablePlans.map((p: Plan) => (
              <option key={p.id} value={p.id}>
                {getPlanDisplayText(p)}
              </option>
            ))}
          </select>
          {errors.plan_id && (
            <p style={{ fontSize: 12, color: C.error, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <X size={11} /> {errors.plan_id}
            </p>
          )}
          {!isLoading && availablePlans.length === 0 && (
            <p style={{ fontSize: 12, color: C.warning, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <TriangleAlert size={12} /> No active plans available. Create a new plan first.
            </p>
          )}
          {!isLoading && availablePlans.length > 0 && currentPlan && (
            <p style={{ fontSize: 11.5, color: C.text3, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border2}` }}>
              💡 Changing the plan will immediately update the salon's features and limits.
            </p>
          )}
        </div>
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleSubmit}
        confirmLabel={mutation.isPending ? "Saving…" : "Save Plan"}
        confirmDisabled={availablePlans.length === 0}
        loading={mutation.isPending}
      />
    </ModalShell>
  );
}

// ── Set Password Modal ────────────────────────────────────────────────────────
function SetPasswordModal({ tenantId, salonName, onClose, onSaved }: {
  tenantId: string; salonName: string; onClose: () => void; onSaved: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, [onClose]);

  async function handleSave() {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.post(`/super-admin/api/tenants/${encodeURIComponent(tenantId)}/set-password`, { newPassword });
      toast.success(`Password updated for ${salonName}`);
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell maxWidth={420}>
      <ModalHeader
        icon={<Key size={15} />}
        iconBg={C.accentLight}
        iconColor={C.accent}
        title="Set New Password"
        subtitle={salonName}
        onClose={onClose}
      />
      <div style={{ padding: "22px 26px" }}>
        <p style={{ fontSize: 13, color: C.text2, marginBottom: 18, lineHeight: 1.5 }}>
          Set a temporary password for this salon. The owner should change it after their first login.
        </p>
        <ModalInput label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Min 6 characters" />
        <ModalInput label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleSave}
        confirmLabel={loading ? "Saving…" : "Set Password"}
        loading={loading}
      />
    </ModalShell>
  );
}