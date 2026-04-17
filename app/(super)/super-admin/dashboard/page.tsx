"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenants, fetchSuperStats } from "@/lib/queries";
import type { Tenant } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState, useEffect } from "react";
import { validateName, validateEmail, validatePhoneRequired } from "@/lib/validation";
import {
  Search, Plus, Store, CheckCircle, XCircle,
  DollarSign, Key, Users, Mail, Calendar, Power, X, ArrowUp, ArrowDown, TriangleAlert,
} from "lucide-react";

const C = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  primary: "#0D9488",
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
  iconEl: React.ReactNode; accent: "teal"|"green"|"red"|"amber"; trend?: "up"|"down"|"neutral";
}) {
  const colors: Record<string, { icon: string; iconBg: string }> = {
    teal:  { icon: C.primary,  iconBg: C.primaryLight },
    green: { icon: C.success,  iconBg: C.successBg },
    red:   { icon: C.error,    iconBg: C.errorBg },
    amber: { icon: C.accent,   iconBg: C.accentLight },
  };
  const { icon, iconBg } = colors[accent];

  return (
    <div className={`gd-stat-card ${accent}`} style={{
      background: C.surface,
      border: `1px solid ${C.border2}`,
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text2 }}>{title}</span>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: iconBg, color: icon,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{iconEl}</div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 6 }}>{value}</div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
        background: trend === "up" ? C.successBg : trend === "down" ? C.errorBg : C.border2,
        color: trend === "up" ? "#059669" : trend === "down" ? "#DC2626" : C.text3,
      }}>
        {trend === "up" && <ArrowUp size={11} />}
        {trend === "down" && <ArrowDown size={11} />}
        {change}
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
      padding: "4px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      background: active ? C.successBg : C.errorBg,
      color: active ? "#059669" : "#DC2626",
    }}>
      {active ? <CheckCircle size={11} /> : <XCircle size={11} />}
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
  const activeTenants = tenantsArray.filter(t => t.status === "active").length;
  const suspendedTenants = tenantsArray.filter(t => t.status !== "active").length;
  const isLoading = tenantsLoading || statsLoading;

  const totalSalons = stats?.total_tenants ?? tenantsArray.length;
  const activeSalons = stats?.active_tenants ?? activeTenants;
  const activePercentage = totalSalons > 0 ? Math.round((activeSalons / totalSalons) * 100) : 0;

  const filteredTenants = tenantsArray.filter(t =>
    t.salon_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "32px 36px", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>Super Admin · System Overview</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {isLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.border2}` }}>
              <Skeleton style={{ height: 10, width: "40%", marginBottom: 12 }} />
              <Skeleton style={{ height: 32, width: "50%" }} />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Total Salons" value={totalSalons} change={`+${stats?.new_this_month || 0} this month`} iconEl={<Store size={16} />} accent="teal" trend="up" />
            <StatCard title="Active" value={activeSalons} change={`${activePercentage}% uptime`} iconEl={<CheckCircle size={16} />} accent="green" trend="up" />
            <StatCard title="Suspended" value={suspendedTenants} change="needs attention" iconEl={<XCircle size={16} />} accent="red" trend="down" />
            <StatCard title="Monthly Revenue" value={`$${((stats?.mrr || 0) / 100).toLocaleString()}`} change={`${stats?.revenue_change || 0}% vs last month`} iconEl={<DollarSign size={16} />} accent="amber" trend={stats?.revenue_change >= 0 ? "up" : "down"} />
          </>
        )}
      </div>

      {/* Reset Requests */}
      {resetRequests.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", borderBottom: `1px solid ${C.border2}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.errorBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Key size={14} style={{ color: C.error }} />
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.text }}>Password Reset Requests</h3>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: C.error, color: "#fff" }}>
                {resetRequests.length}
              </span>
            </div>
          </div>
          {resetRequests.map(r => (
            <div key={r.tenantId} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 24px", borderBottom: `1px solid ${C.border2}`,
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
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.text3 }}>
                      {m.icon}{m.text}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSetPasswordFor({ id: r.tenantId, name: r.salonName })}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 14px", background: C.primary, color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Key size={13} /> Set Password
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Salons Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: `1px solid ${C.border2}`,
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Store size={14} style={{ color: C.primary }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.text }}>Managed Salons</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.text3 }} />
              <input
                type="text" placeholder="Search salons..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                  border: `1.5px solid ${C.border}`, borderRadius: 8,
                  fontSize: 13, width: 240, outline: "none", color: C.text,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryGlow}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", background: C.primary, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus size={14} /> New Salon
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : filteredTenants.length === 0 ? (
          <EmptyState icon="🏪" title="No salons found" description={searchTerm ? "Try a different search term" : 'Click "New Salon" to get started.'} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border2}`, background: C.bg }}>
                  {["Salon", "Owner", "Contact", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
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
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{t.salon_name}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2, fontFamily: "'Space Grotesk', monospace" }}>{tid.slice(0, 12)}...</div>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 500, color: C.text }}>{t.owner_name}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ fontSize: 13, color: C.text2 }}>{t.email}</div>
                        <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{t.phone}</div>
                      </td>
                      <td style={{ padding: "14px 24px" }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => toggleMutation.mutate({ id: tid, status: t.status })}
                            disabled={toggleMutation.isPending}
                            title={t.status === "active" ? "Suspend" : "Activate"}
                            style={{
                              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
                              color: t.status === "active" ? C.error : C.success,
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = t.status === "active" ? C.errorBg : C.successBg; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => setSetPasswordFor({ id: tid, name: t.salon_name })}
                            title="Set Password"
                            style={{
                              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                              background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: C.text3,
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.border2; e.currentTarget.style.color = C.text2; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.text3; }}
                          >
                            <Key size={14} />
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
    </div>
  );
}

// ── Shared modal styles ───────────────────────────────────────────────────────
const C2 = C; // alias

function ModalInput({ label, type = "text", value, onChange, placeholder, error }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C2.text2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px",
          border: `1.5px solid ${error ? C2.error : C2.border}`, borderRadius: 8,
          fontSize: 14, color: C2.text, outline: "none",
          fontFamily: "'DM Sans', sans-serif",
          background: C2.surface,
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={e => { e.target.style.borderColor = C2.primary; e.target.style.boxShadow = `0 0 0 3px ${C2.primaryGlow}`; }}
        onBlur={e => { e.target.style.borderColor = error ? C2.error : C2.border; e.target.style.boxShadow = "none"; }}
      />
      {error && <p style={{ fontSize: 12, color: C2.error, marginTop: 5 }}>{error}</p>}
    </div>
  );
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ salon_name: "", owner_name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(17,19,24,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: C2.surface, borderRadius: 20, width: "90%", maxWidth: 480, boxShadow: "0 24px 60px rgba(26,29,35,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C2.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} style={{ color: C2.primary }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600, color: C2.text }}>Create New Salon</h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: C2.text3, borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "0 28px 24px" }}>
          <ModalInput label="Salon Name" value={form.salon_name} onChange={v => set("salon_name", v)} placeholder="e.g., Royal Glam Studio" error={errors.salon_name} />
          <ModalInput label="Owner Name" value={form.owner_name} onChange={v => set("owner_name", v)} placeholder="Full name" error={errors.owner_name} />
          <ModalInput label="Email Address" type="email" value={form.email} onChange={v => set("email", v)} placeholder="salon@example.com" error={errors.email} />
          <ModalInput label="Phone Number" type="tel" value={form.phone} onChange={v => set("phone", v)} placeholder="+92 300 1234567" error={errors.phone} />
          <ModalInput label="Password" type="password" value={form.password} onChange={v => set("password", v)} placeholder="Min 6 characters" error={errors.password} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 28px", background: C2.bg, borderRadius: "0 0 20px 20px", borderTop: `1px solid ${C2.border2}` }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: C2.surface, border: `1.5px solid ${C2.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: C2.text2, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleCreate} disabled={loading} style={{ padding: "9px 18px", background: C2.primary, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating…" : "Create Salon"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetPasswordModal({ tenantId, salonName, onClose, onSaved }: {
  tenantId: string; salonName: string; onClose: () => void; onSaved: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(17,19,24,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: C2.surface, borderRadius: 20, width: "90%", maxWidth: 420, boxShadow: "0 24px 60px rgba(26,29,35,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C2.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Key size={14} style={{ color: C2.accent }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600, color: C2.text }}>Set New Password</h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: C2.text3, borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "0 28px 24px" }}>
          <p style={{ fontSize: 13, color: C2.text2, marginBottom: 18 }}>{salonName}</p>
          <ModalInput label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Min 6 characters" />
          <ModalInput label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 28px", background: C2.bg, borderRadius: "0 0 20px 20px", borderTop: `1px solid ${C2.border2}` }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: C2.surface, border: `1.5px solid ${C2.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: C2.text2, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ padding: "9px 18px", background: C2.primary, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving…" : "Set Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
