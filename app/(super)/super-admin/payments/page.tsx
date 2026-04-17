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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Payments &amp; Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-0.5">All salon admin subscriptions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : !subs?.length ? (
        <EmptyState
          title="No subscriptions yet"
          description="Subscriptions appear here after salon admins complete registration."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Salon</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subs.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.salon_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.owner_name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email}</td>
                  <td className="px-4 py-3 text-slate-700">{s.plan_name}</td>
                  <td className="px-4 py-3 text-slate-700 tabular-nums">
                    {formatCents(s.price_cents, s.billing_cycle)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
