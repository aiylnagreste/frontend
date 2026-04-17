"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenants, fetchSuperStats } from "@/lib/queries";
import type { Tenant } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState, useEffect } from "react";
import { validateName, validateEmail, validatePhoneRequired } from "@/lib/validation";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Eye,
  UserCheck,
  Phone,
  Mail,
  Edit,
  Power,
  Key,
  X
} from "lucide-react";

interface ResetRequest {
  tenantId: string;
  email: string;
  salonName: string;
  ownerName: string;
  requestedAt: string;
}

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

  const {
    data: tenants,
    isLoading: tenantsLoading,
    refetch: refetchTenants,
  } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
    staleTime: 0,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["superStats"],
    queryFn: fetchSuperStats,
    staleTime: 0,
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
    onSuccess: () => {
      toast.success("Status updated");
      refetchTenants();
      refetchStats();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tenantsArray = Array.isArray(tenants) ? tenants : [];
  const activeTenants = tenantsArray.filter((t) => t.status === "active").length;
  const suspendedTenants = tenantsArray.filter((t) => t.status !== "active").length;
  const isLoading = tenantsLoading || statsLoading;

  const totalSalons = stats?.total_tenants ?? tenantsArray.length;
  const activeSalons = stats?.active_tenants ?? activeTenants;
  const activePercentage = totalSalons > 0 ? Math.round((activeSalons / totalSalons) * 100) : 0;

  const filteredTenants = tenantsArray.filter(tenant => 
    tenant.salon_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Super Admin · Overview</p>
        </div>
        <div className="text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <Skeleton style={{ height: "10px", width: "40%", marginBottom: "12px" }} />
                <Skeleton style={{ height: "32px", width: "50%" }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Salons"
              value={totalSalons}
              change={`+${stats?.new_this_month || 0} this month`}
              icon={Building2}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              trend="up"
            />
            <StatCard
              title="Active"
              value={activeSalons}
              change={`${activePercentage}% uptime`}
              icon={CheckCircle}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
              trend="up"
            />
            <StatCard
              title="Suspended"
              value={suspendedTenants}
              change="needs attention"
              icon={XCircle}
              iconColor="text-red-600"
              iconBg="bg-red-50"
              trend="down"
            />
            <StatCard
              title="Monthly Revenue"
              value={`$${((stats?.mrr || 0) / 100).toLocaleString()}`}
              change={`${stats?.revenue_change || 0}% vs last month`}
              icon={DollarSign}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
              trend={stats?.revenue_change >= 0 ? "up" : "down"}
            />
          </>
        )}
      </div>

      {/* Password Reset Requests */}
      {resetRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Key className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Password Reset Requests</h3>
              <span className="bg-red-100 text-red-700 text-xs font-medium rounded-full px-2 py-0.5">
                {resetRequests.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {resetRequests.map((r) => (
              <div key={r.tenantId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{r.salonName}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {r.ownerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {r.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSetPasswordFor({ id: r.tenantId, name: r.salonName })}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Set Password
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salons Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Managed Salons</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search salons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Salon
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton style={{ height: "40px", width: "100%", borderRadius: "8px" }} />
              </div>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <EmptyState icon="🏪" title="No salons found" description={searchTerm ? "Try a different search term" : 'Click "New Salon" to get started.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salon</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTenants.map((t) => {
                  const tenantId = t.tenant_id || t.id || "";
                  return (
                    <tr key={tenantId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{t.salon_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">ID: {tenantId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{t.owner_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{t.email}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{t.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.status === "active" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {t.status === "active" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {t.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMutation.mutate({ id: tenantId, status: t.status })}
                            disabled={toggleMutation.isPending}
                            className={`p-2 rounded-lg transition-colors ${
                              t.status === "active"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={t.status === "active" ? "Suspend" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSetPasswordFor({ id: tenantId, name: t.salon_name })}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                            title="Set Password"
                          >
                            <Key className="w-4 h-4" />
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
          onCreated={() => {
            refetchTenants();
            refetchStats();
            setShowModal(false);
          }}
        />
      )}

      {setPasswordFor && (
        <SetPasswordModal
          tenantId={setPasswordFor.id}
          salonName={setPasswordFor.name}
          onClose={() => setSetPasswordFor(null)}
          onSaved={() => {
            refetchResets();
            setSetPasswordFor(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor, 
  iconBg,
  trend 
}: { 
  title: string; 
  value: string | number; 
  change: string; 
  icon: React.ElementType; 
  iconColor: string;
  iconBg: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="sa-stat-card bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-600" />}
            {trend === "down" && <TrendingDown className="w-3 h-3 text-red-600" />}
            <span className={`text-xs ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-500"}`}>
              {change}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ salon_name: "", owner_name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-[90%] max-w-[500px] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Create New Salon</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name *</label>
            <input
              type="text"
              placeholder="e.g., Royal Glam Studio"
              value={form.salon_name}
              onChange={(e) => set("salon_name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.salon_name ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.salon_name && <p className="text-xs text-red-500 mt-1">{errors.salon_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
            <input
              type="text"
              placeholder="Full name"
              value={form.owner_name}
              onChange={(e) => set("owner_name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.owner_name ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              placeholder="salon@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.email ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.phone ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.password ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Salon"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetPasswordModal({
  tenantId,
  salonName,
  onClose,
  onSaved,
}: {
  tenantId: string;
  salonName: string;
  onClose: () => void;
  onSaved: () => void;
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-[90%] max-w-[420px] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Key className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Set New Password</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">{salonName}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Re-enter new password"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : "Set Password"}
          </button>
        </div>
      </div>
    </div>
  );
}