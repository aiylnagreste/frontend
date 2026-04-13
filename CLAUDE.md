# Frontend — frontend/CLAUDE.md

Next.js 15 (App Router) admin dashboard. Deployed on Vercel. TypeScript + Tailwind + TanStack Query.

## How It Connects to the Backend

All API calls use **relative paths** — no domain hardcoded in the frontend code. Next.js rewrites in `next.config.ts` proxy them to the Express backend server-side.

**Backend code is now in**  `D:\vs self code\salon-bot` 
```ts
// next.config.ts — MUST have BACKEND_URL set on Vercel
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
rewrites() {
  return [
    { source: "/salon-admin/:path*", destination: `${backendUrl}/salon-admin/:path*` },
    { source: "/super-admin/:path*", destination: `${backendUrl}/super-admin/:path*` },
    { source: "/widget/:path*",      destination: `${backendUrl}/widget/:path*` },
  ];
}
```

**Result:** browser calls Vercel → Vercel proxies to Railway. Cookies stay same-origin. No CORS needed.

**Required Vercel env var:**
```
BACKEND_URL=https://salon-bot-20-saas-production.up.railway.app
```

## Project Structure

```
frontend/
  app/
    layout.tsx                          ← root layout, QueryClientProvider, Toaster
    page.tsx                            ← root "/" — middleware redirects, renders null
    (auth)/
      login/page.tsx                    ← tenant admin login
    (dashboard)/
      layout.tsx                        ← sidebar + topbar shell, wraps all dashboard pages
      dashboard/page.tsx                ← KPI cards + charts
      bookings/page.tsx                 ← all-branches bookings table
      bookings/[branchId]/page.tsx      ← single-branch bookings
      clients/page.tsx                  ← client list + CRM analytics
      deals/page.tsx                    ← deals management
      packages/page.tsx                 ← packages management
      reports/page.tsx                  ← analytics/revenue charts
      settings/page.tsx                 ← branches, staff, roles, timings, general, webhook config
      staff/page.tsx                    ← staff management
    (super)/
      super-admin/login/page.tsx        ← super admin login
      super-admin/dashboard/page.tsx    ← tenant management + stats
  components/
    layout/
      Sidebar.tsx                       ← nav sidebar
      Topbar.tsx                        ← top bar
    dashboard/
      KpiCards.tsx
      TodayAppointmentsTable.tsx
      TodayBookingsPie.tsx
      UpcomingList.tsx
      AllTimeRevenuePie.tsx
    bookings/
      BookingsTable.tsx
      CrmAnalyticsBar.tsx
    ui/
      Badge.tsx, Card.tsx, EmptyState.tsx, Skeleton.tsx
  lib/
    api.ts        ← typed fetch wrapper, reads cookies automatically, redirects to /login on 401
    queries.ts    ← all TanStack Query fetcher functions + query keys
    types.ts      ← all TypeScript interfaces
    utils.ts      ← utility helpers
  middleware.ts   ← Next.js edge middleware — cookie-based auth guards
```

## Auth Flow

### Middleware (`middleware.ts`)
Runs on every request (except `_next/static`, `_next/image`, `favicon.ico`, `salon-admin`, `super-admin`, `widget`).

- `/dashboard`, `/bookings`, `/clients`, `/staff`, `/packages`, `/deals`, `/reports`, `/settings` → requires `tenantToken` cookie → redirects to `/login` if missing
- `/super-admin/dashboard` → requires `superAdminSession` cookie → redirects to `/super-admin/login` if missing
- `/` → redirects to `/dashboard` if `tenantToken` exists, else `/login`

### Cookie Names
| Cookie | Set by | Expires | Used for |
|--------|--------|---------|----------|
| `tenantToken` | `POST /salon-admin/login` | 7 days | Tenant admin auth |
| `superAdminSession` | `POST /super-admin/login` | 1 day | Super admin auth |

Both are `httpOnly` — JS cannot read them. Auth state is validated server-side via Next.js middleware.

### Login Flow (Tenant)
1. `app/(auth)/login/page.tsx` POSTs `{email, password}` to `/salon-admin/login`
2. Express validates → sets `tenantToken` cookie → returns `{success: true}`
3. Frontend does `router.replace("/dashboard")`  this router.replace couses iss
4. On 401 anywhere in the app, `lib/api.ts` does `window.location.href = "/login"`

### Login Flow (Super Admin)
1. `app/(super)/super-admin/login/page.tsx` POSTs `{username, password}` to `/super-admin/login`
2. Express validates → sets `superAdminSession` cookie → returns `{ok: true}`
3. Frontend does `router.replace("/super-admin/dashboard")`

## API Calls Map

All fetchers live in `lib/queries.ts`. Base path: `const BASE = "/salon-admin/api"`.

### Dashboard page
| Fetcher | API Call | Express Route |
|---------|----------|---------------|
| `fetchStats(tz?)` | `GET /salon-admin/api/stats?tz=` | `requireTenantAuth` |
| `fetchAnalytics(params)` | `GET /salon-admin/api/analytics?...` | `requireTenantAuth` |

### Bookings page
| Fetcher | API Call |
|---------|----------|
| `fetchBookings(params?)` | `GET /salon-admin/api/bookings?date=&status=&limit=` |
| `fetchBranches()` | `GET /salon-admin/api/settings/branches` |
| `fetchStaff()` | `GET /salon-admin/api/settings/staff` |
| `fetchServices()` | `GET /salon-admin/api/services` |
| (mutation) | `POST /salon-admin/api/bookings` |
| (mutation) | `PUT /salon-admin/api/bookings/:id` |
| (mutation) | `PATCH /salon-admin/api/bookings/:id/status` |
| (mutation) | `DELETE /salon-admin/api/bookings/:id` |

### Clients page
| Fetcher | API Call |
|---------|----------|
| `fetchClients()` | `GET /salon-admin/api/clients` |

### Settings page
| Fetcher | API Call |
|---------|----------|
| `fetchBranches()` | `GET /salon-admin/api/settings/branches` |
| `fetchStaff()` | `GET /salon-admin/api/settings/staff` |
| `fetchRoles()` | `GET /salon-admin/api/settings/roles` |
| `fetchTimings()` | `GET /salon-admin/api/settings/timings` |
| `fetchGeneral()` | `GET /salon-admin/api/settings/general` |

### Super Admin dashboard
| Fetcher | API Call |
|---------|----------|
| `fetchTenants()` | `GET /super-admin/api/tenants` |
| `fetchSuperStats()` | `GET /super-admin/api/stats` |
| (mutation) | `POST /super-admin/api/tenants` |
| (mutation) | `PATCH /super-admin/api/tenants/:id/status` |

## TypeScript Types (`lib/types.ts`)

| Type | Used for |
|------|----------|
| `Booking` | date: YYYY-MM-DD, time: HH:MM, status: confirmed/completed/canceled/no_show/archived |
| `Staff` | branch_id nullable (null = works all branches) |
| `Service` | price is TEXT (not number — may contain currency symbols) |
| `DashboardStats` | includes queryRange metadata for timezone verification |
| `AnalyticsResponse` | includes filtersApplied metadata |
| `Tenant` | super admin view — tenant_id e.g. "SA01" |
| `SalonTimings` | workday + weekend objects, both nullable |

## TanStack Query Patterns

Query client set up in `app/layout.tsx`. All query keys centralized in `QK` object in `lib/queries.ts`.

```ts
// Standard query
const { data, isLoading } = useQuery({
  queryKey: QK.bookings({ date, status }),
  queryFn: () => fetchBookings({ date, status }),
  staleTime: 30_000,
});

// Mutation with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => api.post("/salon-admin/api/bookings", data),
  onSuccess: () => qc.invalidateQueries({ queryKey: QK.bookings() }),
});
```

## `lib/api.ts` — Fetch Wrapper

- Always sends `credentials: "include"` (needed for cookies)
- On 401 → `window.location.href = "/login"` (auto-logout)
- Throws `ApiError(status, message)` on non-OK responses
- Methods: `api.get<T>`, `api.post<T>`, `api.put<T>`, `api.patch<T>`, `api.delete<T>`

## Dependencies

Key packages: `next`, `react`, `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-virtual`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `date-fns-tz`, `lucide-react`, `sonner`, `tailwind-merge`, `clsx`

## Local Dev

```bash
cd frontend
npm install
npm run dev        # starts on :3001 (or next available port)
# Express must be running on :3000 for rewrites to work
```

## What Was Removed from Express (now handled here)

These Express routes were deleted — Next.js handles them now:
- `GET /salon-admin/login` — now `app/(auth)/login/page.tsx`
- `GET /salon-admin/dashboard` — now `app/(dashboard)/dashboard/page.tsx`
- `GET /super-admin/login` — now `app/(super)/super-admin/login/page.tsx`
- `GET /super-admin/dashboard` — now `app/(super)/super-admin/dashboard/page.tsx`

The `src/admin/views/` folder (panel.html, salon-login.html, super-login.html, super-dashboard.html) has been fully deleted.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
