# Graph Report - .  (2026-04-11)

## Corpus Check
- Corpus is ~33,290 words - fits in a single context window. You may not need a graph.

## Summary
- 157 nodes · 248 edges · 14 communities detected
- Extraction: 96% EXTRACTED · 3% INFERRED · 1% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Frontend CLAUDE.md â€” Project Instructions` - 6 edges
2. `Next.js Proxy Rewrites (next.config.ts)` - 6 edges
3. `lib/queries.ts â€” TanStack Query Fetchers` - 6 edges
4. `toMin()` - 5 edges
5. `Next.js 15 App Router` - 5 edges
6. `lib/types.ts â€” TypeScript Interfaces` - 5 edges
7. `Vercel Deployment Platform` - 4 edges
8. `tenantToken Cookie (httpOnly, 7 days)` - 4 edges
9. `app/(dashboard)/bookings/page.tsx â€” Bookings Table` - 4 edges
10. `findAvailableStaff()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `file.svg â€” Generic File Icon` --conceptually_related_to--> `Frontend CLAUDE.md â€” Project Instructions`  [AMBIGUOUS]
  public/file.svg → CLAUDE.md
- `window.svg â€” Browser Window Icon` --conceptually_related_to--> `Next.js 15 App Router`  [AMBIGUOUS]
  public/window.svg → CLAUDE.md
- `globe.svg â€” Globe/World Icon` --conceptually_related_to--> `No CORS Needed â€” Same-Origin via Proxy`  [AMBIGUOUS]
  public/globe.svg → CLAUDE.md
- `next.svg â€” Next.js Wordmark Logo` --conceptually_related_to--> `Next.js 15 App Router`  [INFERRED]
  public/next.svg → CLAUDE.md
- `vercel.svg â€” Vercel Triangle Logo` --conceptually_related_to--> `Vercel Deployment Platform`  [INFERRED]
  public/vercel.svg → CLAUDE.md

## Hyperedges (group relationships)
- **Vercel Proxy Architecture: Browser â†’ Vercel â†’ Railway** — concept_vercel_deployment, concept_next_rewrites, concept_railway_backend, concept_no_cors [EXTRACTED 1.00]
- **Cookie-Based Auth System** — concept_middleware_auth, concept_tenant_token, concept_super_admin_session, page_tenant_login [EXTRACTED 1.00]
- **Frontend Data Layer** — concept_api_wrapper, concept_queries_ts, concept_types_ts, concept_tanstack_query [EXTRACTED 0.95]

## Communities

### Community 0 - "UI Component Library"
Cohesion: 0.12
Nodes (0): 

### Community 1 - "API Client & Booking Logic"
Cohesion: 0.1
Nodes (11): ApiError, handleSubmit(), validate(), handleSubmit(), validate(), handleSubmit(), validate(), handleSubmit() (+3 more)

### Community 2 - "Project Config & Architecture"
Cohesion: 0.14
Nodes (18): AGENTS.md â€” Next.js Agent Rules, Agent Rule: Read node_modules/next/dist/docs/ before writing code, Frontend CLAUDE.md â€” Project Instructions, BACKEND_URL Environment Variable (Vercel), Next.js Proxy Rewrites (next.config.ts), Next.js 15 App Router, No CORS Needed â€” Same-Origin via Proxy, Railway Express Backend (+10 more)

### Community 3 - "Scheduling & Availability Utilities"
Cohesion: 0.17
Nodes (8): autoMarkNoShowsForTenant(), checkBookingTimingWithEndTime(), checkStaffAvailability(), findAvailableStaff(), findNextAvailableSlots(), runJobsForAllTenants(), sendRemindersForTenant(), toMin()

### Community 4 - "Dashboard Page & Settings UI"
Cohesion: 0.12
Nodes (0): 

### Community 5 - "Auth & Data Layer Contracts"
Cohesion: 0.17
Nodes (17): lib/api.ts â€” Typed Fetch Wrapper, Next.js Edge Middleware Auth Guards, lib/queries.ts â€” TanStack Query Fetchers, superAdminSession Cookie (httpOnly, 1 day), tenantToken Cookie (httpOnly, 7 days), lib/types.ts â€” TypeScript Interfaces, app/(dashboard)/bookings/page.tsx â€” Bookings Table, app/(dashboard)/dashboard/page.tsx â€” KPI & Charts (+9 more)

### Community 6 - "TanStack Query Fetchers"
Cohesion: 0.12
Nodes (0): 

### Community 7 - "App Shell & Layout"
Cohesion: 0.67
Nodes (0): 

### Community 8 - "Admin Auth Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Next.js Middleware"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "API Route Handler"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Drawer Component"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "TypeScript Env Declarations"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `Frontend CLAUDE.md â€” Project Instructions` → `file.svg â€” Generic File Icon`  [AMBIGUOUS]
  public/file.svg · relation: conceptually_related_to
- `globe.svg â€” Globe/World Icon` → `No CORS Needed â€” Same-Origin via Proxy`  [AMBIGUOUS]
  public/globe.svg · relation: conceptually_related_to
- `window.svg â€” Browser Window Icon` → `Next.js 15 App Router`  [AMBIGUOUS]
  public/window.svg · relation: conceptually_related_to

## Knowledge Gaps
- **9 isolated node(s):** `file.svg â€” Generic File Icon`, `globe.svg â€” Globe/World Icon`, `next.svg â€” Next.js Wordmark Logo`, `vercel.svg â€” Vercel Triangle Logo`, `window.svg â€” Browser Window Icon` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Admin Auth Middleware`** (2 nodes): `auth.js`, `requireAdminAuth()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Middleware`** (2 nodes): `middleware.ts`, `middleware()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Route Handler`** (2 nodes): `route.ts`, `POST()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Drawer Component`** (2 nodes): `DrawerShell.tsx`, `handleEscape()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TypeScript Env Declarations`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Frontend CLAUDE.md â€” Project Instructions` and `file.svg â€” Generic File Icon`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `globe.svg â€” Globe/World Icon` and `No CORS Needed â€” Same-Origin via Proxy`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `window.svg â€” Browser Window Icon` and `Next.js 15 App Router`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `lib/queries.ts â€” TanStack Query Fetchers` connect `Auth & Data Layer Contracts` to `Project Config & Architecture`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `TanStack Query â€” Data Fetching Layer` connect `Project Config & Architecture` to `Auth & Data Layer Contracts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `file.svg â€” Generic File Icon`, `globe.svg â€” Globe/World Icon`, `next.svg â€” Next.js Wordmark Logo` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._