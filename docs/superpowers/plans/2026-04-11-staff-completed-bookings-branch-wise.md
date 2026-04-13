# Staff Branch-wise Completed Bookings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single "Top Staff by Completed Bookings" bar chart on the Staff page with per-branch cards that each show a horizontal bar chart + booking detail list, filtered by a configurable date range.

**Architecture:** All changes are client-side in one file — `app/(dashboard)/staff/page.tsx`. No new API calls; data comes from the existing `fetchBookings()` result. Two new state vars (`dateFrom`, `dateTo`) drive the date range filter. The existing `branchFilter` and `dateFilter` states are unchanged.

**Tech Stack:** Next.js 15 App Router, React, TanStack Query, Recharts (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`), existing UI components (`Card`, `CardHeader`, `CardContent`, `EmptyState`, `Skeleton`), CSS variables via inline styles.

---

## File Map

| Action | File |
|--------|------|
| Modify | `app/(dashboard)/staff/page.tsx` |

---

### Task 1: Add `dateFrom` / `dateTo` state and filter inputs

**Files:**
- Modify: `app/(dashboard)/staff/page.tsx` — lines 16–111 (state declarations + filters section)

- [ ] **Step 1: Add two new state vars after the existing state declarations**

In `app/(dashboard)/staff/page.tsx`, after line 18 (`const [dateFilter, setDateFilter]...`), add:

```tsx
const today = new Date().toISOString().slice(0, 10);
const [dateFrom, setDateFrom] = useState(today);
const [dateTo, setDateTo] = useState(today);
```

- [ ] **Step 2: Add the From / To inputs to the filters row**

The filters `<div>` currently ends with the single date `<input>` (line 99–110). Add two new inputs after it:

```tsx
<input
  type="date"
  value={dateFrom}
  onChange={(e) => setDateFrom(e.target.value)}
  style={{
    padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "13px",
    background: "var(--color-surface)",
  }}
/>
<span style={{ fontSize: "13px", color: "var(--color-sub)", alignSelf: "center" }}>→</span>
<input
  type="date"
  value={dateTo}
  onChange={(e) => setDateTo(e.target.value)}
  style={{
    padding: "8px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "13px",
    background: "var(--color-surface)",
  }}
/>
```

- [ ] **Step 3: Verify — open the Staff page in browser**

Confirm the filters row now shows: Branch dropdown | single date picker (workload) | From date | → | To date  
Both new pickers default to today's date.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/staff/page.tsx"
git commit -m "feat: add date range filter state and inputs to staff page"
```

---

### Task 2: Derive per-branch completed booking data

**Files:**
- Modify: `app/(dashboard)/staff/page.tsx` — data derivation section (after existing `topByCompleted` block, ~lines 56–67)

- [ ] **Step 1: Remove the old single-chart data derivation**

Delete these lines (the all-branches aggregate, ~lines 56–67):

```ts
// ✅ FIX: "Top by Completed Bookings" = completed status
const completedCounts = bookings
  .filter((b) => b.status === "completed" && b.staff_name)
  .reduce<Record<string, number>>((acc, b) => {
    if (b.staff_name) acc[b.staff_name] = (acc[b.staff_name] ?? 0) + 1;
    return acc;
  }, {});

const topByCompleted = Object.entries(completedCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([name, count]) => ({ name, count }));
```

- [ ] **Step 2: Add the date-range-filtered derivation in its place**

```ts
// Completed bookings in date range (for branch-wise chart)
const completedInRange = bookings.filter(
  (b) =>
    b.status === "completed" &&
    b.staff_name &&
    b.date >= dateFrom &&
    b.date <= dateTo,
);
```

- [ ] **Step 3: Verify — no TypeScript errors**

```bash
cd "d:/vs self code/frontend" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `completedInRange`, `topByCompleted`, `completedCounts`.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/staff/page.tsx"
git commit -m "feat: derive date-range-filtered completed bookings for branch-wise chart"
```

---

### Task 3: Replace single chart card with per-branch chart cards

**Files:**
- Modify: `app/(dashboard)/staff/page.tsx` — the CRM charts grid section (~lines 113–161)

- [ ] **Step 1: Remove the old single chart card JSX**

Delete the entire `{/* CRM charts */}` block (~lines 113–161):

```tsx
{/* CRM charts */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
    {/* <Card> ... commented-out Most Requested card ... </Card> */}

  <Card>
    <CardHeader>
      <span style={{ fontWeight: 600, fontSize: "14px" }}>🏆 Top Staff by Completed Bookings</span>
      <span style={{ fontSize: "11px", color: "var(--color-sub)" }}>All time · completed</span>
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton style={{ height: "160px" }} /> :
       topByCompleted.length === 0 ? (
        <EmptyState icon="🏆" title="No completed bookings yet" />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, topByCompleted.length * 28)}>
          <BarChart data={topByCompleted} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: unknown) => [String(v ?? 0), "Completed"]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
            <Bar dataKey="count" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
</div>
```

- [ ] **Step 2: Insert per-branch chart cards in its place**

```tsx
{/* Per-branch Top Staff by Completed Bookings */}
<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
  {filteredBranches.map((branch, branchIndex) => {
    // Group completed-in-range bookings for this branch by staff
    const branchCompleted = completedInRange.filter(
      (b) => b.branch === branch.name,
    );

    const staffMap = branchCompleted.reduce<Record<string, typeof branchCompleted>>(
      (acc, b) => {
        const key = b.staff_name!;
        if (!acc[key]) acc[key] = [];
        acc[key].push(b);
        return acc;
      },
      {},
    );

    // Sort staff by count descending
    const staffEntries = Object.entries(staffMap).sort(
      (a, b) => b[1].length - a[1].length,
    );

    const chartData = staffEntries.map(([name, bks]) => ({
      name,
      count: bks.length,
    }));

    const dateLabel =
      dateFrom === dateTo
        ? dateFrom
        : `${dateFrom} → ${dateTo}`;

    return (
      <Card key={branch.id}>
        <CardHeader>
          <span style={{ fontWeight: 600, fontSize: "14px" }}>
            🏆 {branch.name} — Top Staff by Completed Bookings
          </span>
          <span style={{ fontSize: "11px", color: "var(--color-sub)" }}>
            {dateLabel} · completed
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton style={{ height: "160px" }} />
          ) : staffEntries.length === 0 ? (
            <EmptyState icon="🏆" title="No completed bookings in this range" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Bar chart */}
              <ResponsiveContainer
                width="100%"
                height={Math.max(120, staffEntries.length * 32)}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [String(v ?? 0), "Completed"]}
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS[branchIndex % CHART_COLORS.length]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Booking detail list */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {staffEntries.map(([staffName, bks]) => (
                  <div key={staffName}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "13px",
                        marginBottom: "4px",
                      }}
                    >
                      {staffName}
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          color: "var(--color-sub)",
                          fontWeight: 400,
                        }}
                      >
                        {bks.length} completed
                      </span>
                    </div>
                    {[...bks]
                      .sort((a, b) => {
                        if (a.date !== b.date) return a.date.localeCompare(b.date);
                        return a.time.localeCompare(b.time);
                      })
                      .map((b) => (
                        <div
                          key={b.id}
                          style={{
                            fontSize: "12px",
                            color: "var(--color-rose)",
                            marginBottom: "2px",
                          }}
                        >
                          {b.date !== dateFrom || dateFrom !== dateTo
                            ? `${b.date} · `
                            : ""}
                          {b.time} – {b.endTime ?? "?"} · {b.service} ·{" "}
                          {b.customer_name}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  })}
</div>
```

- [ ] **Step 3: Verify — no TypeScript errors**

```bash
cd "d:/vs self code/frontend" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

Open Staff page. Confirm:
- One card per branch (or filtered branch if dropdown is set)
- Each card shows a horizontal bar chart with staff names on Y axis and count on X axis
- Bar colour differs per branch (uses `CHART_COLORS[branchIndex]`)
- Below chart: each staff member listed with their bookings showing `date · time – endTime · service · customer`
- When date range is a single day, date prefix is hidden from booking rows (shows `time – endTime · service · customer` only)
- Changing From/To dates updates all cards reactively
- Branch with no completions shows EmptyState

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/staff/page.tsx"
git commit -m "feat: replace single staff chart with per-branch completed bookings cards"
```

---

### Task 4: Clean up unused commented-out code

**Files:**
- Modify: `app/(dashboard)/staff/page.tsx`

- [ ] **Step 1: Remove the dead `mostRequested` / `requestedCounts` derivation**

These were part of the commented-out "Most Requested" card. If `mostRequested` is no longer referenced anywhere in the JSX, delete lines ~43–54:

```ts
// ✅ FIX: "Most Requested" = staffRequested=true only
const requestedCounts = bookings
  .filter((b) => b.staffRequested && b.staff_name)
  .reduce<Record<string, number>>((acc, b) => {
    if (b.staff_name) acc[b.staff_name] = (acc[b.staff_name] ?? 0) + 1;
    return acc;
  }, {});

const mostRequested = Object.entries(requestedCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([name, count]) => ({ name, count }));
```

- [ ] **Step 2: Run TypeScript check to confirm nothing references the removed vars**

```bash
cd "d:/vs self code/frontend" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If `mostRequested` is still referenced in commented-out JSX, leave the derivation in place and skip this cleanup.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/staff/page.tsx"
git commit -m "chore: remove unused mostRequested derivation from staff page"
```
