// app/deals/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDeals, QK } from "@/lib/queries";
import type { Deal } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";
import { DealDrawer } from "@/components/deals/DealDrawer";
import { Plus, Pencil, Trash2, Layers, Gift, FileText } from "lucide-react";

export default function DealsPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: QK.deals(),
    queryFn: fetchDeals,
    staleTime: 5 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/salon-admin/api/deals/${id}`),
    onSuccess: () => {
      toast.success("Deal deleted");
      qc.invalidateQueries({ queryKey: QK.deals() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeCount = deals.filter((d) => d.active === 1).length;
  const inactiveCount = deals.filter((d) => d.active === 0).length;

  const filtered = deals
    .filter((d) => {
      if (statusFilter === "active") return d.active === 1;
      if (statusFilter === "inactive") return d.active === 0;
      return true;
    })
    .sort((a, b) => b.active - a.active);

  function openAddDrawer() {
    setEditingDeal(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(deal: Deal) {
    setEditingDeal(deal);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingDeal(null);
  }

  return (
    <>
      <div>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: "#1A1D23",
                  letterSpacing: "-0.02em",
                }}
              >
                Deals & Offers
              </h3>
              <p style={{ fontSize: "13px", color: "#5F6577", margin: "4px 0 0" }}>
                Manage promotions and discounts for your salon
              </p>
            </div>
            <button
              onClick={openAddDrawer}
              style={{
                padding: "9px 18px",
                background: "linear-gradient(135deg, #b5484b, #6b3057)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                transition: "opacity 0.2s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Deal
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            background: "#F0FDF4",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#15803d",
            fontWeight: 600,
          }}>
            <Layers size={14} />
            <span>{activeCount} Active</span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            background: "#F8F8F6",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#64748b",
            fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8" }} />
            <span>{inactiveCount} Inactive</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{
            display: "inline-flex",
            background: "#F8F8F6",
            borderRadius: "8px",
            padding: "3px",
            border: "1px solid #E6E4DF",
          }}>
            {(["all", "active", "inactive"] as const).map((key) => {
              const isActive = statusFilter === key;
              const label = key === "all" ? "All" : key === "active" ? "Active" : "Inactive";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: "6px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: "none",
                    background: isActive ? "#fff" : "transparent",
                    color: isActive ? "#1A1D23" : "#5F6577",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: "100px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="No deals found"
            description={
              statusFilter !== "all"
                ? "Try changing the status filter."
                : "Create your first promotion to attract clients."
            }
            action={
              statusFilter === "all"
                ? { label: "Add Deal", onClick: openAddDrawer }
                : undefined
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((d) => (
              <DealCard
                key={d.id}
                deal={d}
                onEdit={() => openEditDrawer(d)}
                onDelete={() => deleteMutation.mutate(d.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <DealDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editingDeal}
      />
    </>
  );
}

/* ── Deal Card ── */

function DealCard({
  deal: d,
  onEdit,
  onDelete,
  isDeleting,
}: {
  deal: Deal;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isActive = d.active === 1;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        border: isActive ? "1px solid #E6E4DF" : "1px dashed #D1D5DB",
        borderRadius: "10px",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        opacity: isActive ? 1 : 0.6,
        transition: "box-shadow 0.2s, transform 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        if (isActive) {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Icon */}
      <div style={{
        width: "42px",
        height: "42px",
        borderRadius: "10px",
        background: isActive
          ? "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))"
          : "#F8F8F6",
        border: isActive ? "1px solid rgba(181,72,75,0.15)" : "1px solid #E6E4DF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Gift size={18} color={isActive ? "#b5484b" : "#9CA3B4"} strokeWidth={1.8} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{
            fontWeight: 700,
            fontSize: "15px",
            color: "#1A1D23",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {d.title}
          </div>
          <Badge status={isActive ? "active" : "inactive"} />
        </div>
        {d.description && (
          <div style={{
            fontSize: "12px",
            color: "#5F6577",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
          }}>
            <FileText size={12} color="#9CA3B4" style={{ flexShrink: 0, marginTop: "2px" }} />
            <span style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {d.description}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
      }}>
        <button
          onClick={onEdit}
          style={{
            padding: "7px 14px",
            border: "1px solid #E6E4DF",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            background: hovered ? "#F8F8F6" : "#fff",
            cursor: "pointer",
            color: "#5F6577",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F8F8F6"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E6E4DF"; }}
        >
          <Pencil size={12} />
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            padding: "7px 14px",
            border: "1px solid #FEE2E2",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            background: hovered ? "#FEF2F2" : "#fff",
            cursor: isDeleting ? "not-allowed" : "pointer",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
            opacity: isDeleting ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!isDeleting) { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FECACA"; }}}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#FEE2E2"; }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}