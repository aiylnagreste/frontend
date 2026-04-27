"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Service, Branch } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import fd from "@/components/ui/FormDrawer.module.css";

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Service | null;
  currentServiceCount?: number;
  maxServices?: number;
}

const DURATION_PRESETS = [15, 30, 45, 60, 75, 90, 120];

export function ServiceDrawer({
  open,
  onClose,
  editing,
  currentServiceCount = 0,
  maxServices = 15
}: ServiceDrawerProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    branch: "",
    durationMinutes: 60,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    enabled: open,
  });

  const isAddingNew = !editing;
  const hasReachedLimit = isAddingNew && currentServiceCount >= maxServices && maxServices > 0;

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name || "",
          price: editing.price || "",
          description: editing.description || "",
          branch: editing.branch || "",
          durationMinutes: editing.durationMinutes || 60,
        });
      } else {
        setForm({
          name: "",
          price: "",
          description: "",
          branch: "",
          durationMinutes: 60,
        });
      }
      setErrors({});
    }
  }, [open, editing]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Service name is required";
    if (!form.price) errs.price = "Price is required";
    if (!form.branch) errs.branch = "Branch is required";
    if (!form.durationMinutes || form.durationMinutes < 5)
      errs.durationMinutes = "Duration must be at least 5 minutes";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isAddingNew && hasReachedLimit) {
      toast.error(`Maximum ${maxServices} services reached. Please upgrade your plan to add more.`);
      return;
    }

    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await api.put(`/salon-admin/api/services/${editing.id}`, form);
        toast.success("Service updated");
      } else {
        await api.post("/salon-admin/api/services", form);
        toast.success("Service created");
      }
      qc.invalidateQueries({ queryKey: QK.services() });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  }

  function parseDuration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  const hasError = (field: string) => !!errors[field];

  // Show limit reached UI if trying to add new service when at limit
  if (hasReachedLimit) {
    return (
      <ModalShell open={open} onClose={onClose} title="Service Limit Reached" width={480}>
        <div className={fd.limitWrap}>
          <div className={fd.limitIconWrap}>
            <AlertCircle size={32} style={{ color: "#DC2626" }} />
          </div>
          <h4 className={fd.limitTitle}>
            Maximum Services Reached
          </h4>
          <p className={fd.limitText}>
            Your current plan allows up to <strong>{maxServices}</strong> active services.
            You&apos;re currently using <strong>{currentServiceCount}</strong> of {maxServices}.
          </p>
          <p className={fd.limitText}>
            Upgrade your plan to add more services or freeze some existing ones.
          </p>
          <div className={fd.limitActions}>
            <button onClick={onClose} className={fd.secondaryBtn}>
              Close
            </button>
            <button
              onClick={() => window.location.href = "/settings/plan"}
              className={fd.primaryBtn}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Service" : "New Service"} width={480}>
      <form onSubmit={handleSubmit} className={fd["form--gap20"]}>
        {/* Service limit warning (only for new services when near limit) */}
        {isAddingNew && currentServiceCount >= maxServices - 1 && maxServices > 0 && (
          <div className={fd.warningAlert}>
            <AlertCircle size={14} style={{ color: "#D97706" }} />
            <span>
              You have {currentServiceCount} of {maxServices} services.
              {currentServiceCount === maxServices - 1 && " You can add 1 more service."}
            </span>
          </div>
        )}

        {/* Service Name */}
        <div>
          <label className={fd.label}>
            Service Name <span className={fd.required}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Haircut & Styling"
            className={`${fd.input} ${hasError("name") ? fd["input--error"] : ""}`}
            autoFocus
          />
          {errors.name && <span className={fd.errorMsg}>{errors.name}</span>}
        </div>

        {/* Price & Duration row */}
        <div className={fd.row2}>
          <div>
            <label className={fd.label}>
              Price <span className={fd.required}>*</span>
            </label>
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g., 1500"
              className={`${fd.input} ${hasError("price") ? fd["input--error"] : ""}`}
            />
            {errors.price && <span className={fd.errorMsg}>{errors.price}</span>}
          </div>
          <div>
            <label className={fd.label}>
              Duration <span className={fd.required}>*</span>
            </label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
              placeholder="60"
              min="5"
              step="5"
              className={`${fd.input} ${hasError("durationMinutes") ? fd["input--error"] : ""}`}
            />
            {errors.durationMinutes && <span className={fd.errorMsg}>{errors.durationMinutes}</span>}
            {/* Quick presets */}
            <div className={fd.durationPresets}>
              {DURATION_PRESETS.map((d) => {
                const active = form.durationMinutes === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, durationMinutes: d })}
                    className={`${fd.durationPresetBtn} ${active ? fd["durationPresetBtn--active"] : ""}`}
                  >
                    {parseDuration(d)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Branch */}
        <div>
          <label className={fd.label}>
            Branch <span className={fd.required}>*</span>
          </label>
          <select
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            className={`${fd.select} ${hasError("branch") ? fd["select--error"] : ""}`}
          >
            <option value="">Select a branch</option>
            <option value="All Branches">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.branch && <span className={fd.errorMsg}>{errors.branch}</span>}
        </div>

        {/* Description */}
        <div>
          <label className={fd.label}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's included in this service? Use · to separate items"
            rows={3}
            className={fd.textarea}
          />
          <span className={fd.helpText}>
            Separate multiple items with · (e.g., Wash · Cut · Blowdry)
          </span>
        </div>

        {/* Actions */}
        <div className={fd.actions}>
          <button type="button" onClick={onClose} className={fd.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={fd.primaryBtn}>
            {isSubmitting ? "Saving…" : editing ? "Update Service" : "Create Service"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
