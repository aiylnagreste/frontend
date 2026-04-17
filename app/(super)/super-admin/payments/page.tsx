"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptions } from "@/lib/queries";
import type { Subscription } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function formatCents(cents: number, cycle: string) {
  const price = `$${(cents / 100).toFixed(2)}`;
  if (cycle === "monthly") return `${price}/mo`;
  if (cycle === "yearly") return `${price}/yr`;
  return price;
}

export default function PaymentsPage() {
  const { data: subs, isLoading } = useQuery<Subscription[]>({
    queryKey: ["superSubscriptions"],
    queryFn: fetchSubscriptions,
    staleTime: 30_000,
  });

  return (
    <div className="p-5 bg-slate-50 min-h-full">
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} style={{ height: "40px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : !subs?.length ? (
        <EmptyState
          title="No subscriptions yet"
          description="Subscriptions appear here after salon admins complete registration."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-bold text-[13px] text-slate-900">All salon subscriptions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50">
                  {["Salon", "Owner", "Email", "Plan", "Price", "Status", "Since"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.salon_name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.owner_name}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{s.email}</td>
                    <td className="px-4 py-3 text-violet-600 font-semibold">{s.plan_name}</td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">
                      {formatCents(s.price_cents, s.billing_cycle)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums text-[11px]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
