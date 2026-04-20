/** Centralized query keys + fetcher functions for TanStack Query */
import { api } from "./api";
import type {
  AnalyticsResponse,
  Booking,
  Branch,
  Client,
  DashboardStats,
  Deal,
  Plan,
  PlanFeatures,
  PublicPlan,
  Role,
  SalonTimings,
  Service,
  Staff,
  Subscription,
  Tenant,
  TenantStatus,
  WebhookConfig,
} from "./types";

const BASE = "/salon-admin/api";

// ─── Query Keys ────────────────────────────────────────────────────────────
export const QK = {
  stats: (tz?: string) => ["stats", tz] as const,
  analytics: (params: Record<string, string | undefined>) =>
    ["analytics", params] as const,
  bookings: (params?: Record<string, string | undefined>) =>
    ["bookings", params ?? {}] as const,
  services: () => ["services"] as const,
  deals: () => ["deals"] as const,
  branches: () => ["branches"] as const,
  staff: () => ["staff"] as const,
  roles: () => ["roles"] as const,
  timings: () => ["timings"] as const,
  general: () => ["general"] as const,
  clients: () => ["clients"] as const,
  salonName: () => ["salonName"] as const,
  salonConfig: (tenantId: string) => ["salonConfig", tenantId] as const,
  webhookConfig: () => ["webhookConfig"] as const,
  plans: () => ["plans"] as const,
  planFeatures: () => ["planFeatures"] as const,
  tenantStatus: () => ["tenantStatus"] as const,
  corsOrigin: () => ["corsOrigin"] as const,
};

// ─── Fetchers ───────────────────────────────────────────────────────────────
export const fetchStats = (tz?: string) =>
  api.get<DashboardStats>(`${BASE}/stats${tz ? `?tz=${encodeURIComponent(tz)}` : ""}`);

export const fetchAnalytics = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, v);
  }
  return api.get<AnalyticsResponse>(`${BASE}/analytics?${q.toString()}`);
};

export const fetchBookings = (params?: Record<string, string | undefined>) => {
  const q = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") q.set(k, v);
    }
  }
  const qs = q.toString();
  return api.get<Booking[]>(`${BASE}/bookings${qs ? `?${qs}` : ""}`);
};

export const fetchServices = () => api.get<Service[]>(`${BASE}/services`);
export const fetchDeals = () => api.get<Deal[]>(`${BASE}/deals`);
export const fetchBranches = () => api.get<Branch[]>(`${BASE}/settings/branches`);
export const fetchStaff = () => api.get<Staff[]>(`${BASE}/settings/staff`);
export const fetchRoles = () => api.get<Role[]>(`${BASE}/settings/roles`);
export const fetchTimings = () => api.get<SalonTimings>(`${BASE}/settings/timings`);
export const fetchGeneral = () =>
  api.get<{
    currency: string;
    timezone?: string;
    tenantId?: string;
    owner_name?: string | null;
    salon_name?: string | null;       // for Sidebar branding — LHB-01
    logo_data_uri?: string | null;    // for Sidebar branding — LHB-01
    bot_name?: string | null;
    primary_color?: string | null;
  }>(`${BASE}/settings/general`);
export const fetchClients = () => api.get<Client[]>(`${BASE}/clients`);

export const fetchSalonConfig = (tenantId: string) =>
  api.get<{ salon_name: string; bot_name: string; primary_color: string }>(
    `/salon-config/${encodeURIComponent(tenantId)}`
  );

export const fetchWebhookConfig = () => api.get<WebhookConfig>(`${BASE}/webhook-config`);

export const fetchPlanFeatures = () => api.get<PlanFeatures>(`${BASE}/plan-features`);

export const fetchTenantStatus = () =>
  api.get<TenantStatus>(`${BASE}/tenant-status`);

export async function fetchCorsOrigin(): Promise<string | null> {
  const data = await api.get<{ ok: boolean; cors_origin: string | null }>(`${BASE}/cors-origin`);
  return data.cors_origin;
}

export async function saveCorsOrigin(cors_origin: string | null): Promise<void> {
  await api.put(`${BASE}/cors-origin`, { cors_origin });
}

// Super admin
const SA = "/super-admin/api";
export const fetchTenants = () => api.get<Tenant[]>(`${SA}/tenants`);
export const fetchSuperStats = () =>
  api.get<{ total_tenants: number; active_tenants: number }>(`${SA}/stats`);

export async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch('/super-admin/api/plans', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch plans');
  return res.json();
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const res = await fetch('/super-admin/api/subscriptions', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch subscriptions');
  return res.json();
}

export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const res = await fetch('/api/public/plans');
  if (!res.ok) throw new Error('Failed to load plans');
  return res.json();
}
