// app/(dashboard)/bookings/upcoming/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import BookingsTable from "@/components/bookings/BookingsTable";
import { Skeleton } from "@/components/ui/Skeleton";

function getRange() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);
  return {
    from: tomorrow.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export default function UpcomingBookingsPage() {
  const { from, to } = getRange();

  const { data: all = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({}),
    queryFn: () => fetchBookings(),
    staleTime: 30_000,
  });

  const rows = all
    .filter(
      (b) =>
        b.date >= from &&
        b.date <= to &&
        (b.status === "confirmed" ||
          b.status === "arrived" ||
          b.status === "completed"),
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );

  return (
    <div
      style={{
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <header
        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--color-ink)",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Upcoming Bookings
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            color: "var(--color-sub)",
          }}
        >
          Next 7 days — {rows.length} booking{rows.length !== 1 ? "s" : ""}
        </p>
      </header>

      {isLoading ? (
        <Skeleton style={{ height: "320px" }} />
      ) : (
        <BookingsTable bookings={rows} />
      )}
    </div>
  );
}
