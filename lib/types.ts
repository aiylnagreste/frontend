export interface Branch {
  id: number;
  number: number;
  name: string;
  address: string;
  map_link: string;
  phone: string;
}

export interface Staff {
  id: number;
  name: string;
  phone: string;
  role: string;
  branch_id: number | null;
  branch_name: string | null;
  status: "active" | "inactive";
}

export interface Service {
  id: number;
  name: string;
  price: string;
  description: string;
  branch: string;
  durationMinutes: number;
  frozen: 0 | 1;
}

export interface PlanFeatures {
  max_services: number;
  whatsapp_access: 0 | 1;
  instagram_access: 0 | 1;
  facebook_access: 0 | 1;
  widget_access: 0 | 1;
  ai_calls_access: 0 | 1;
}

export interface Deal {
  id: number;
  title: string;
  description: string;
  active: 0 | 1;
  off: number;
}

export type BookingStatus = "confirmed" | "arrived" | "completed" | "canceled" | "no_show" | "archived";

export interface Booking {
  id: number;
  customer_name: string;
  phone: string;
  service: string;
  branch: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  endTime?: string;    // HH:MM
  status: BookingStatus;
  notes?: string;
  staff_id?: number | null;
  staff_name?: string | null;
  staffRequested?: boolean;
  source?: string;
  created_at?: string;
}

export interface DashboardStats {
  total_bookings: number;
  today_bookings: number;
  active_services: number;
  total_clients: number;
  /** Metadata added in backend fix */
  queryRange?: { start: string; end: string; tz: string };
  dataFreshAsOf?: string;
  serverTime?: string;
}

export interface AnalyticsResponse {
  totalRevenue: number;
  bookingCount: number;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  topDeals: Array<{ name: string; count: number }>;
  revenueByService: Array<{ name: string; revenue: number; percent: number }>;
  bookingsByBranch: Record<string, number>;
  revenueByBranch: Record<string, number>;
  bookingsByStatus?: Record<string, number>;
  queryRange?: { start: string; end: string; tz: string };
  filtersApplied?: Record<string, unknown>;
  dataFreshAsOf?: string;
  serverTime?: string;
}

export interface Client {
  customer_name: string;
  phone: string;
  booking_count: number;
  last_visit: string;
  status?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface SalonTimings {
  workday: { day_type: string; open_time: string; close_time: string } | null;
  weekend: { day_type: string; open_time: string; close_time: string } | null;
}

export interface WebhookConfig {
  has_whatsapp: boolean;
  has_instagram: boolean;
  has_facebook: boolean;
  wa_verified: boolean;
  ig_verified: boolean;
  fb_verified: boolean;
  wa_credentials_valid?: boolean;
  ig_credentials_valid?: boolean;
  fb_credentials_valid?: boolean;
  wa_phone_number_id: string;
  webhook_urls: {
    whatsapp: string;
    instagram: string;
    facebook: string;
  };
}

// In lib/types.ts - Make sure PublicPlan has id as number
export interface PublicPlan {
  id: number;  // Should be number, not string
  name: string;
  description: string | null;
  price_cents: number;
  billing_cycle: string;
  max_services: number;
  whatsapp_access: number;
  instagram_access: number;
  facebook_access: number;
  ai_calls_access: number;
  widget_access: number;
  highlight?: boolean;
}

export interface Tenant {
  tenant_id: string;
  id?: string;
  salon_name: string;
  owner_name: string;
  email: string;
  phone: string;
  status: "active" | "suspended";
  created_at?: string;
  subscription_plan: string | null;
  subscription_expires: string | null;
}

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
  max_services: number;
  whatsapp_access: 0 | 1;
  instagram_access: 0 | 1;
  facebook_access: 0 | 1;
  ai_calls_access: 0 | 1;
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

//export type PublicPlan = Omit<Plan, 'stripe_price_id' | 'is_active' | 'created_at' | 'updated_at'>;

export interface CorsOriginResponse {
  ok: boolean;
  cors_origin: string | null;
}
export type SuspensionReason =
  | "active"
  | "suspended"
  | "subscription_expired"
  | "plan_deactivated"
  | "not_found";

export interface TenantStatus {
  tenant_id: string;
  status: "active" | "suspended";
  reason?: SuspensionReason;  
  salon_name: string;
}

export interface BrandingSettings {
  logo_data_uri: string | null;   // data:image/png;base64,...
  salon_name: string | null;
}

export interface Subscription {
  id: number;
  tenant_id: string;
  plan_id: number;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  salon_name: string;
  owner_name: string;
  email: string;
  plan_name: string;
  price_cents: number;
  billing_cycle: string;
}

// Analytics Client with service breakdown
export interface AnalyticsClient {
  customer_name: string;
  phone: string | null;
  services: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  bookings: Array<{
    date: string;
    time: string;
    service: string;
    branch: string;
    staff_name: string | null;
    price: number;
    /** Present when source=invoices — used by Reports click-to-open invoice modal */
    invoice_id?: number;
    booking_id?: number;
  }>;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  firstVisit: string;
  branches: string[];
}

export interface AnalyticsClientsResponse {
  clients: AnalyticsClient[];
  totalClients: number;
  totalRevenue: number;
  avgSpendPerClient: number;
  newClients: number;
  returningClients: number;
  queryRange: { start: string | null; end: string | null; tz: string };
  filtersApplied: { statuses: string[]; branch: string | null; period: string | null };
  dataFreshAsOf: string;
}

export type PaymentType = "cash" | "card" | "bank_to_bank";

export interface Invoice {
  id: number;
  booking_id: number;
  customer_name: string;
  phone: string | null;
  service: string;
  branch: string | null;
  staff_id: number | null;
  staff_name: string | null;
  service_price: number;
  extra_services_price: number;
  tips: number;
  deal_ids_json: string;       // JSON stringified number[]
  deals_off_pct: number;       // 0-100
  discount_amount: number;
  total: number;
  payment_type: PaymentType;
  created_at: string;
  booking_date?: string;       // joined from bookings (optional)
  booking_time?: string;
}

export interface CreateInvoicePayload {
  booking_id: number;
  extra_services_price: number;
  tips: number;
  deal_ids: number[];
  payment_type: PaymentType;
}

export interface StaffIncomeRow {
  staff_id: number;
  staff_name: string;
  tips_total: number;
  invoice_count: number;
}

export interface StaffIncomeResponse {
  month: string; // YYYY-MM
  rows: StaffIncomeRow[];
}