// components/dashboard/UpcomingList.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime } from "@/lib/utils";
import { CalendarRange, MapPin, Clock, Scissors, ChevronRight } from "lucide-react";
import styles from "./UpcomingList.module.css";

function getDateRange() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);

  return {
    tomorrowStr: tomorrow.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

function isTomorrow(dateStr: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().slice(0, 10);
}

export default function UpcomingList() {
  const { data: all = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({}),
    queryFn: () => fetchBookings(),
    staleTime: 60_000,
  });

  const { tomorrowStr, endStr } = getDateRange();
  const inRange = all
    .filter(
      (b) =>
        b.date >= tomorrowStr &&
        b.date <= endStr &&
        (b.status === "confirmed" ||
          b.status === "arrived" ||
          b.status === "completed"),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const totalUpcoming = inRange.length;
  const upcoming = inRange.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className={styles.cardHeaderInner}>
          <div className={styles.iconWrap}>
            <CalendarRange size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span className={styles.cardTitle}>
              Upcoming
            </span>
            <span className={styles.cardSubtitle}>
              Next 7 days
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent style={{ padding: 0 }}>
        {isLoading ? (
          <div className={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: "56px" }} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState icon="📆" title="No upcoming bookings" />
          </div>
        ) : (
          <div className={styles.list}>
            {upcoming.map((b, idx) => {
              const tomorrow = isTomorrow(b.date);
              return (
                <div
                  key={b.id}
                  className={`${styles.item} ${idx < upcoming.length - 1 ? styles["item--bordered"] : ""}`}
                >
                  {/* Date column */}
                  <div className={`${styles.dateBox} ${tomorrow ? styles["dateBox--tomorrow"] : ""}`}>
                    <span className={`${styles.dateBox__weekday} ${tomorrow ? styles["dateBox__weekday--tomorrow"] : ""}`}>
                      {new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className={styles.dateBox__day}>
                      {new Date(b.date + "T00:00:00").getDate()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className={styles.content}>
                    <div className={styles.contentTop}>
                      <span className={styles.customerName}>
                        {b.customer_name}
                      </span>
                      <Badge status={b.status} />
                    </div>

                    <div className={styles.serviceRow}>
                      <Scissors size={11} color="#9CA3B4" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <span className={styles.serviceText}>{b.service}</span>
                    </div>

                    <div className={styles.metaRow}>
                      <span className={styles.metaItem}>
                        <Clock size={10} color="#9CA3B4" strokeWidth={1.8} />
                        {formatTime(b.time)}
                      </span>
                      {b.branch && (
                        <span className={styles.metaItem}>
                          <MapPin size={10} color="#9CA3B4" strokeWidth={1.8} />
                          {b.branch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {totalUpcoming > 10 && (
              <Link href="/bookings/upcoming" className={styles.viewAll}>
                View All ({totalUpcoming}) <ChevronRight size={12} />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
