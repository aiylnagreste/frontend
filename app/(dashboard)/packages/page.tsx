"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchServices, fetchBranches, fetchGeneral, QK } from "@/lib/queries";
import type { Service, Branch } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState } from "react";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";

function parseDuration(mins: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function PackagesPage() {
  const qc = useQueryClient();
  const [branchFilter, setBranchFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: QK.services(),
    queryFn: fetchServices,
    staleTime: 5 * 60_000,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });

  const currency = general?.currency ?? "";

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/salon-admin/api/services/${id}`),
    onSuccess: () => {
      toast.success("Service deleted");
      qc.invalidateQueries({ queryKey: QK.services() });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = branchFilter
    ? services.filter((s) => s.branch === branchFilter)
    : services;

  function openAddDrawer() {
    setEditingService(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(service: Service) {
    setEditingService(service);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingService(null);
  }

  return (
    <>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Services &amp; Pricing</h3>
          <button
            onClick={openAddDrawer}
            style={{
              padding: "9px 18px",
              background: "var(--color-rose)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Service
          </button>
        </div>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "13px",
            background: "var(--color-surface)",
            marginBottom: "20px",
          }}
        >
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} style={{ height: "160px" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="✨" title="No services yet" description="Add your first service using the button above." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
            {filtered.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "var(--color-rose)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "100px",
                  }}
                >
                  {parseDuration(s.durationMinutes)}
                </div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px", paddingRight: "60px" }}>
                  {s.name}
                </div>
                <div style={{ color: "var(--color-rose)", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>
                  {currency && <span style={{ fontSize: "13px", fontWeight: 500 }}>{currency} </span>}{s.price}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-sub)", marginBottom: "12px" }}>
                  📍 {s.branch || "All Branches"}
                </div>
                {s.description && (
                  <div style={{ fontSize: "11px", color: "var(--color-sub)", lineHeight: 1.5, marginBottom: "12px" }}>
                    {s.description.split("·").map((p, i) => (
                      <span key={i}>
                        {i > 0 && " · "}
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => openEditDrawer(s)} style={outlineBtn}>Edit</button>
                  <button
                    style={{ ...outlineBtn, color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                    onClick={() => deleteMutation.mutate(s.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ServiceDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editingService}
      />
    </>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "5px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 500,
  background: "transparent",
  cursor: "pointer",
  color: "var(--color-sub)",
};