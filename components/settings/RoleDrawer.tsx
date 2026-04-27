// components/settings/RoleDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import fd from "@/components/ui/FormDrawer.module.css";

interface RoleDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RoleDrawer({ open, onClose }: RoleDrawerProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/salon-admin/api/settings/roles", { name: name.trim() });
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: QK.roles() });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Role" width={400}>
      <form onSubmit={handleSubmit} className={fd["form--gap20"]}>
        <div>
          <label className={fd.label}>
            Role Name <span className={fd.required}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g., Senior Stylist"
            className={`${fd.input} ${error ? fd["input--error"] : ""}`}
            autoFocus
          />
          {error && <span className={fd.errorMsg}>{error}</span>}
        </div>

        <div className={fd.actions}>
          <button type="button" onClick={onClose} className={fd.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={fd.primaryBtn}>
            {isSubmitting ? "Creating…" : "Create Role"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
