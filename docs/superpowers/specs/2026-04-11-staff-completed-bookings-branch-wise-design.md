# Staff Page — Branch-wise Top Staff by Completed Bookings

**Date:** 2026-04-11  
**File to modify:** `app/(dashboard)/staff/page.tsx`

---

## Goal

Replace the single all-time "Top Staff by Completed Bookings" bar chart with per-branch cards that:
1. Filter by a `dateFrom` / `dateTo` range (default: today)
2. Show one horizontal bar chart per branch (staff vs. completed count)
3. Show a booking detail list per staff member (time → endTime · service · customer)
4. Follow the existing dashboard card design (`Card`, `CardHeader`, `CardContent`, `CHART_COLORS`, inline styles)

---

## Date Range Filter

- Add two state vars: `dateFrom` (default: today) and `dateTo` (default: today)
- Both are `string` in `YYYY-MM-DD` format
- Add two `<input type="date">` fields to the existing filters row, labelled "From" and "To"
- Style matches existing filter inputs: `padding: "8px 12px"`, `border: "1px solid var(--color-border)"`, `borderRadius: "8px"`, `fontSize: "13px"`, `background: "var(--color-surface)"`
- The existing single `dateFilter` (used by the workload section) remains unchanged

---

## Replacing the Single Chart Card

### Data derivation (client-side, no new API calls)

```ts
const completedInRange = bookings.filter(
  (b) =>
    b.status === "completed" &&
    b.staff_name &&
    b.date >= dateFrom &&
    b.date <= dateTo
);
```

### Per-branch rendering

Iterate over `filteredBranches` (already respects the branch filter dropdown).

For each branch:
1. Filter `completedInRange` to `b.branch === branch.name`
2. Group by `staff_name` → `{ [staffName]: Booking[] }`
3. Sort staff entries by booking count descending
4. Build bar chart data: `[{ name: staffName, count: bookings.length }, ...]`

### Card structure (per branch)

```
<Card>
  <CardHeader>
    <span>🏆 {branch.name} — Top Staff by Completed Bookings</span>
    <span style={{ fontSize: "11px", color: "var(--color-sub)" }}>
      {dateFrom === dateTo ? formatDate(dateFrom) : `${formatDate(dateFrom)} – ${formatDate(dateTo)}`}
    </span>
  </CardHeader>
  <CardContent>
    {/* Empty state if no completed bookings */}
    {/* Horizontal bar chart */}
    {/* Booking detail list */}
  </CardContent>
</Card>
```

### Chart

- Type: `BarChart` layout `"vertical"` (horizontal bars) — same as current
- `ResponsiveContainer` width `"100%"`, height `Math.max(120, staffEntries.length * 32)`
- `Bar` fill: use `CHART_COLORS[branchIndex % CHART_COLORS.length]` so each branch card has a distinct colour
- Tooltip: `formatter={(v) => [String(v), "Completed"]}`
- `YAxis` width `120`, `tick={{ fontSize: 11 }}`
- `XAxis` type `"number"`, `tick={{ fontSize: 11 }}`

### Booking detail list

Below the chart, separated by a subtle divider (`borderTop: "1px solid var(--color-border)"`).

For each staff member (same order as chart — descending count):
```
<div style={{ fontWeight: 600, fontSize: "13px" }}>
  {staffName}
  <span style={{ marginLeft: 8, fontSize: "11px", color: "var(--color-sub)" }}>
    {bookings.length} completed
  </span>
</div>
{bookings
  .sort((a, b) => a.time.localeCompare(b.time))  // time order
  .map((b) => (
    <div style={{ fontSize: "12px", color: "var(--color-rose)", marginBottom: "2px" }}>
      {b.time} – {b.endTime ?? "?"} · {b.service} · {b.customer_name}
    </div>
  ))
}
```

### Empty state

If a branch has no completed bookings in the date range:
```tsx
<EmptyState icon="🏆" title="No completed bookings in this range" />
```

---

## What Stays Unchanged

- Branch filter dropdown (controls which branch cards appear in both sections)
- Existing `dateFilter` single-date input for the per-branch workload section
- Per-branch workload pie + staff cards section (lines 163–231)
- All imports and query hooks

---

## Design Consistency Rules

- Use `Card`, `CardHeader`, `CardContent` components throughout
- Inline styles only (no Tailwind classes) — matches rest of file
- CSS variables: `var(--color-surface)`, `var(--color-border)`, `var(--color-sub)`, `var(--color-canvas)`, `var(--color-rose)`
- `CHART_COLORS` from `@/lib/utils` for bar colours
- `formatDate` from `@/lib/utils` for date display
- `EmptyState` and `Skeleton` from `@/components/ui/`
- Loading state: `{isLoading ? <Skeleton style={{ height: "160px" }} /> : ...}`

---

## Out of Scope

- No new API endpoints — all filtering is client-side on the existing `fetchBookings()` result
- No pagination of booking detail rows
- No export or print functionality
