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

// In lib/queries.ts - Replace the fetchCurrentSubscription function
export async function fetchCurrentSubscription(): Promise<CurrentSubscription> {
  try {
    const response = await api.get("/salon-admin/api/subscription/current");
    
    // Check if response IS the data (has planId directly)
    if (response && typeof response === 'object' && 'planId' in response) {
      return response as CurrentSubscription;
    }
    
    // Check if response has a data property
    if (response && typeof response === 'object' && 'data' in response && response.data) {
      return response.data as CurrentSubscription;
    }
    
    // Fallback
    return {
      id: null,
      planId: null,
      planName: "Free",
      priceCents: 0,
      billingCycle: "monthly",
      status: "active",
      currentPeriodEnd: null,
      remainingDays: null,
      remainingDaysText: null,
      features: {
        maxServices: 5,
        whatsappAccess: false,
        instagramAccess: false,
        facebookAccess: false,
        aiCallsAccess: false,
        widgetAccess: false,
      }
    };
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return {
      id: null,
      planId: null,
      planName: "Free",
      priceCents: 0,
      billingCycle: "monthly",
      status: "active",
      currentPeriodEnd: null,
      remainingDays: null,
      remainingDaysText: null,
      features: {
        maxServices: 5,
        whatsappAccess: false,
        instagramAccess: false,
        facebookAccess: false,
        aiCallsAccess: false,
        widgetAccess: false,
      }
    };
  }
}

// In lib/queries.ts - Add or update this interface
export interface CurrentSubscription {
  id: number | null;
  planId: number | null;
  planName: string;
  priceCents: number;
  billingCycle: string;
  status: string;
  currentPeriodEnd: string | null;
  remainingDays: number | null;
  remainingDaysText: string | null;
  features: {
    maxServices: number;
    whatsappAccess: boolean;
    instagramAccess: boolean;
    facebookAccess: boolean;
    aiCallsAccess: boolean;
    widgetAccess: boolean;
  };
}

// Super admin
const SA = "/super-admin/api";
export const fetchTenants = () => api.get<Tenant[]>(`${SA}/tenants`);
export const fetchSuperStats = () =>
  api.get<{ 
    total_tenants: number; 
    active_tenants: number; 
    new_this_month: number;
    mrr: number;
    revenue_change: number;
  }>(`${SA}/stats`);

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

// Add to your queries.ts file after the existing super admin functions
// In lib/queries.ts — Replace the existing SalonIntegration-related types and fetchers

// ── Super Admin: Integrations ───────────────────────────────────────────────

export interface SalonIntegration {
  salon_id: number;
  tenant_id: string;
  salon_name: string;
  owner_name: string;
  plan_name: string;
  plan_features: {
    whatsapp: boolean;
    instagram: boolean;
    facebook: boolean;
    widget: boolean;
    ai_calls: boolean;
  };
  has_whatsapp: boolean;
  has_instagram: boolean;
  has_facebook: boolean;
  needs_configuration: {
    whatsapp: boolean;
    instagram: boolean;
    facebook: boolean;
  };
}

export interface WebhookConfigDetail {
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  instagram_access_token: string | null;
  facebook_access_token: string | null;

  whatsapp_verify_token: string | null;
  instagram_verify_token: string | null;
  facebook_verify_token: string | null;
}

export const fetchIntegrationsSalons = () =>
  api.get<SalonIntegration[]>(`${SA}/integrations/salons`);

export const fetchIntegrationConfig = (salonId: number) =>
  api.get<WebhookConfigDetail>(`${SA}/integrations/${salonId}`);

export const saveIntegrationConfig = (
  salonId: number,
  payload: Record<string, string | undefined>
) => {
  // Remove undefined values before sending
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v && v.trim()) clean[k] = v.trim();
  }
  return api.put(`${SA}/integrations/${salonId}`, clean);
};

export const deleteIntegrationChannel = (salonId: number, channel: string) =>
  api.delete(`${SA}/integrations/${salonId}/${channel}`);