"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchServices, fetchBranches, fetchGeneral, QK } from "@/lib/queries";
import type { Service, Branch } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState } from "react";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";
import { MapPin, Clock, Pencil, Trash2, Plus, Layers, Search } from "lucide-react";

function parseDuration(mins: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export default function PackagesPage() {
  const qc = useQueryClient();
  const [branchFilter, setBranchFilter] = useState("");
  const [frozenFilter, setFrozenFilter] = useState<"all" | "active" | "frozen">("all");
  const [search, setSearch] = useState("");
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

  const activeCount = services.filter((s) => s.frozen === 0).length;
  const frozenCount = services.filter((s) => s.frozen === 1).length;

  const filtered = services
    .filter((s) => (branchFilter ? s.branch === branchFilter : true))
    .filter((s) => {
      if (frozenFilter === "active") return s.frozen === 0;
      if (frozenFilter === "frozen") return s.frozen === 1;
      return true;
    })
    .filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q);
    })
    .slice()
    .sort((a, b) => a.frozen - b.frozen);

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
                Services & Pricing
              </h3>
              <p style={{ fontSize: "13px", color: "#5F6577", margin: "4px 0 0" }}>
                Manage your salon service catalog
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
              Add Service
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              background: "#F0FDF4",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#15803d",
              fontWeight: 600,
            }}
          >
            <Layers size={14} />
            <span>{activeCount} Active</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              background: "#F8F8F6",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8" }} />
            <span>{frozenCount} Frozen</span>
          </div>
        </div>

        {/* Filters row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Status tabs */}
          <div
            style={{
              display: "flex",
              background: "#F8F8F6",
              borderRadius: "8px",
              padding: "3px",
              border: "1px solid #E6E4DF",
            }}
          >
            {(["all", "active", "frozen"] as const).map((key) => {
              const isActive = frozenFilter === key;
              const label = key === "all" ? "All" : key === "active" ? "Active" : "Frozen";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFrozenFilter(key)}
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

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "280px" }}>
            <Search
              size={14}
              color="#9CA3B4"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services…"
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                border: "1px solid #E6E4DF",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#fff",
                color: "#1A1D23",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#b5484b";
                e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E6E4DF";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Branch select */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{
              padding: "8px 32px 8px 12px",
              border: "1px solid #E6E4DF",
              borderRadius: "8px",
              fontSize: "13px",
              background: "#fff",
              color: "#1A1D23",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#b5484b"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} style={{ height: "180px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="✨"
            title="No services found"
            description={
              search || branchFilter || frozenFilter !== "all"
                ? "Try adjusting your filters to find what you're looking for."
                : "Add your first service to get started."
            }
            action={
              !search && !branchFilter && frozenFilter === "all"
                ? { label: "Add Service", onClick: openAddDrawer }
                : undefined
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {filtered.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                currency={currency}
                onEdit={() => openEditDrawer(s)}
                onDelete={() => deleteMutation.mutate(s.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <ServiceDrawer open={drawerOpen} onClose={closeDrawer} editing={editingService} />
    </>
  );
}

/* ── Service Card ── */

function ServiceCard({
  service: s,
  currency,
  onEdit,
  onDelete,
  isDeleting,
}: {
  service: Service;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isFrozen = s.frozen === 1;
  const descriptionParts = s.description
    ? s.description.split("·").map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div
      style={{
        background: "#fff",
        border: isFrozen ? "1px dashed #D1D5DB" : "1px solid #E6E4DF",
        borderRadius: "10px",
        padding: "18px",
        position: "relative",
        opacity: isFrozen ? 0.65 : 1,
        transition: "box-shadow 0.2s, transform 0.15s",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        if (!isFrozen) {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top row: badge + duration */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        {isFrozen ? (
          <Badge status="frozen" label="Frozen" />
        ) : (
          <Badge status="active" label="Active" />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            color: "#5F6577",
            fontWeight: 500,
          }}
        >
          <Clock size={12} color="#9CA3B4" />
          {parseDuration(s.durationMinutes)}
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          fontWeight: 600,
          fontSize: "15px",
          color: "#1A1D23",
          marginBottom: "6px",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}
      >
        {s.name}
      </div>

      {/* Price */}
      <div
        style={{
          fontWeight: 700,
          fontSize: "18px",
          marginBottom: "10px",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg, #b5484b, #6b3057)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {currency && (
          <span style={{ fontSize: "13px", fontWeight: 600 }}>{currency} </span>
        )}
        {s.price}
      </div>

      {/* Description items */}
      {descriptionParts.length > 0 && (
        <div style={{ marginBottom: "12px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {descriptionParts.slice(0, 4).map((part, i) => (
            <span
              key={i}
              style={{
                fontSize: "11px",
                color: "#5F6577",
                background: "#F8F8F6",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 500,
              }}
            >
              {part}
            </span>
          ))}
          {descriptionParts.length > 4 && (
            <span
              style={{
                fontSize: "11px",
                color: "#9CA3B4",
                padding: "2px 8px",
                fontWeight: 500,
              }}
            >
              +{descriptionParts.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Branch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "11px",
          color: "#9CA3B4",
          marginBottom: "14px",
          fontWeight: 500,
        }}
      >
        <MapPin size={11} color="#9CA3B4" />
        {s.branch || "All Branches"}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          paddingTop: "14px",
          borderTop: "1px solid #F0EEED",
        }}
      >
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            padding: "7px 12px",
            border: "1px solid #E6E4DF",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            background: "#fff",
            cursor: "pointer",
            color: "#5F6577",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F8F8F6";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#E6E4DF";
          }}
        >
          <Pencil size={12} />
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            padding: "7px 12px",
            border: "1px solid #FEE2E2",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            background: "#fff",
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
          onMouseEnter={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.background = "#FEF2F2";
              e.currentTarget.style.borderColor = "#FECACA";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#FEE2E2";
          }}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}