// components/settings/IntegrationsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWebhookConfig, QK } from "@/lib/queries";
import type { WebhookConfig } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";

function ConnectionBadge({ hasToken, verified }: { hasToken: boolean; verified: boolean }) {
  if (verified) return <Badge status="active" label="Active" />;
  if (hasToken) return <Badge status="pending" label="Token saved" />;
  return <Badge status="inactive" label="Not configured" />;
}

interface IntegrationsTabProps {
  tenantId: string;
}

const EMPTY_WA = { phone_number_id: "", access_token: "", verify_token: "" };
const EMPTY_IG = { page_access_token: "", verify_token: "" };
const EMPTY_FB = { page_access_token: "", verify_token: "" };

const MASKED = "••••••••••••";

export function IntegrationsTab({ tenantId }: IntegrationsTabProps) {
  const qc = useQueryClient();
  const { data: config } = useQuery<WebhookConfig>({
    queryKey: QK.webhookConfig(),
    queryFn: fetchWebhookConfig,
    staleTime: 5 * 60_000,
  });

  const [wa, setWa] = useState(EMPTY_WA);
  const [ig, setIg] = useState(EMPTY_IG);
  const [fb, setFb] = useState(EMPTY_FB);

  const [editingWa, setEditingWa] = useState(false);
  const [editingIg, setEditingIg] = useState(false);
  const [editingFb, setEditingFb] = useState(false);

  // Pre-populate phone_number_id when config loads
  useEffect(() => {
    if (config?.wa_phone_number_id) {
      setWa(prev => ({ ...prev, phone_number_id: config.wa_phone_number_id }));
    }
  }, [config?.wa_phone_number_id]);

  function cancelEdit(channel: "wa" | "ig" | "fb") {
    if (channel === "wa") {
      setWa({ phone_number_id: config?.wa_phone_number_id || "", access_token: "", verify_token: "" });
      setEditingWa(false);
    }
    if (channel === "ig") { setIg(EMPTY_IG); setEditingIg(false); }
    if (channel === "fb") { setFb(EMPTY_FB); setEditingFb(false); }
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put("/salon-admin/api/webhook-config", {
        wa_phone_number_id: wa.phone_number_id || undefined,
        wa_access_token: wa.access_token || undefined,
        wa_verify_token: wa.verify_token || undefined,
        ig_page_access_token: ig.page_access_token || undefined,
        ig_verify_token: ig.verify_token || undefined,
        fb_page_access_token: fb.page_access_token || undefined,
        fb_verify_token: fb.verify_token || undefined,
      }),
    onSuccess: () => {
      toast.success("Integrations saved");
      setWa(prev => ({ ...prev, access_token: "", verify_token: "" }));
      setIg(EMPTY_IG);
      setFb(EMPTY_FB);
      setEditingWa(false);
      setEditingIg(false);
      setEditingFb(false);
      qc.invalidateQueries({ queryKey: QK.webhookConfig() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (channel: "whatsapp" | "instagram" | "facebook") =>
      api.delete(`/salon-admin/api/webhook-config/${channel}`),
    onSuccess: (_: unknown, channel: "whatsapp" | "instagram" | "facebook") => {
      const label = channel === "whatsapp" ? "WhatsApp" : channel === "instagram" ? "Instagram" : "Facebook";
      toast.success(`${label} integration removed`);
      if (channel === "whatsapp") { setWa(EMPTY_WA); setEditingWa(false); }
      if (channel === "instagram") { setIg(EMPTY_IG); setEditingIg(false); }
      if (channel === "facebook") { setFb(EMPTY_FB); setEditingFb(false); }
      qc.invalidateQueries({ queryKey: QK.webhookConfig() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const backendOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const waSavedFields = [
    { label: "Phone Number ID", value: config?.wa_phone_number_id || "—" },
    { label: "Access Token", value: MASKED },
    { label: "Verify Token", value: MASKED },
  ];
  const igSavedFields = [
    { label: "Page Access Token", value: MASKED },
    { label: "Verify Token", value: MASKED },
  ];
  const fbSavedFields = [
    { label: "Page Access Token", value: MASKED },
    { label: "Verify Token", value: MASKED },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <p style={{ fontSize: "13px", color: "var(--color-sub)", marginBottom: "0" }}>
        Connect your salon&apos;s WhatsApp, Instagram, and Facebook accounts so customers can book through messaging apps.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* ── WhatsApp ── */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>💬</span>
              <h4 style={{ fontWeight: 600, margin: 0 }}>WhatsApp</h4>
            </div>
            <ConnectionBadge hasToken={!!config?.has_whatsapp} verified={!!config?.wa_verified} />
          </div>

          <div style={{ padding: "20px" }}>
            <WebhookUrlBox url={`${backendOrigin}/webhooks/${tenantId}/whatsapp`} />

            <CredentialSection
              isSaved={!!config?.has_whatsapp}
              isEditing={editingWa}
              onEdit={() => setEditingWa(true)}
              onCancel={() => cancelEdit("wa")}
              onDelete={() => deleteMutation.mutate("whatsapp")}
              isDeleting={deleteMutation.isPending}
              savedFields={waSavedFields}
            >
              <Field
                label="Phone Number ID"
                value={wa.phone_number_id}
                onChange={v => setWa(p => ({ ...p, phone_number_id: v }))}
                placeholder="Enter Phone Number ID"
              />
              <Field
                label="Access Token"
                value={wa.access_token}
                onChange={v => setWa(p => ({ ...p, access_token: v }))}
                placeholder="Enter new Access Token"
                isPassword
              />
              <Field
                label="Verify Token"
                value={wa.verify_token}
                onChange={v => setWa(p => ({ ...p, verify_token: v }))}
                placeholder="Enter new Verify Token"
                helpText="Must match what you set in Meta Developer Console"
              />
            </CredentialSection>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Instagram */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📸</span>
                <h4 style={{ fontWeight: 600, margin: 0 }}>Instagram</h4>
              </div>
              <ConnectionBadge hasToken={!!config?.has_instagram} verified={!!config?.ig_verified} />
            </div>

            <div style={{ padding: "20px" }}>
              <WebhookUrlBox url={`${backendOrigin}/webhooks/${tenantId}/instagram`} />

              <CredentialSection
                isSaved={!!config?.has_instagram}
                isEditing={editingIg}
                onEdit={() => setEditingIg(true)}
                onCancel={() => cancelEdit("ig")}
                onDelete={() => deleteMutation.mutate("instagram")}
                isDeleting={deleteMutation.isPending}
                savedFields={igSavedFields}
              >
                <Field
                  label="Page Access Token"
                  value={ig.page_access_token}
                  onChange={v => setIg(p => ({ ...p, page_access_token: v }))}
                  placeholder="Enter new Page Access Token"
                  isPassword
                />
                <Field
                  label="Verify Token"
                  value={ig.verify_token}
                  onChange={v => setIg(p => ({ ...p, verify_token: v }))}
                  placeholder="Enter new Verify Token"
                  helpText="Must match what you set in Meta Developer Console"
                />
              </CredentialSection>
            </div>
          </div>

          {/* Facebook */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>👍</span>
                <h4 style={{ fontWeight: 600, margin: 0 }}>Facebook Messenger</h4>
              </div>
              <ConnectionBadge hasToken={!!config?.has_facebook} verified={!!config?.fb_verified} />
            </div>

            <div style={{ padding: "20px" }}>
              <WebhookUrlBox url={`${backendOrigin}/webhooks/${tenantId}/facebook`} />

              <CredentialSection
                isSaved={!!config?.has_facebook}
                isEditing={editingFb}
                onEdit={() => setEditingFb(true)}
                onCancel={() => cancelEdit("fb")}
                onDelete={() => deleteMutation.mutate("facebook")}
                isDeleting={deleteMutation.isPending}
                savedFields={fbSavedFields}
              >
                <Field
                  label="Page Access Token"
                  value={fb.page_access_token}
                  onChange={v => setFb(p => ({ ...p, page_access_token: v }))}
                  placeholder="Enter new Page Access Token"
                  isPassword
                />
                <Field
                  label="Verify Token"
                  value={fb.verify_token}
                  onChange={v => setFb(p => ({ ...p, verify_token: v }))}
                  placeholder="Enter new Verify Token"
                  helpText="Must match what you set in Meta Developer Console"
                />
              </CredentialSection>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          style={primaryBtn}
        >
          {saveMutation.isPending ? "Saving…" : "Save All Integrations"}
        </button>
      </div>
    </div>
  );
}

// ── CredentialSection ─────────────────────────────────────────────────────────
function CredentialSection({
  isSaved,
  isEditing,
  onEdit,
  onCancel,
  onDelete,
  isDeleting,
  savedFields,
  children,
}: {
  isSaved: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  savedFields: { label: string; value: string }[];
  children: React.ReactNode;
}) {
  if (isSaved && !isEditing) {
    return (
      <div style={{
        padding: "14px 16px",
        background: "#f0fdf4",
        border: "1.5px solid #bbf7d0",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "15px" }}>🔒</span>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#15803d" }}>Credentials saved</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
          {savedFields.map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#166534", fontWeight: 500 }}>{f.label}</span>
              <span style={{
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#15803d",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: f.value.startsWith("•") ? "2px" : "normal",
              }}>
                {f.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onEdit} style={editBtn}>
            Edit credentials
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            style={deleteBtn}
          >
            {isDeleting ? "Removing…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {isSaved && (
        <div style={{
          padding: "8px 12px",
          background: "#fefce8",
          border: "1px solid #fde047",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#854d0e",
        }}>
          Leave a field blank to keep the existing value. Only filled fields will be updated.
        </div>
      )}
      {children}
      {isSaved && (
        <button onClick={onCancel} style={cancelBtn}>
          Cancel
        </button>
      )}
    </div>
  );
}

// ── WebhookUrlBox ─────────────────────────────────────────────────────────────
function WebhookUrlBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Webhook URL copied");
  }

  return (
    <div style={{
      background: "var(--color-canvas)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      padding: "16px",
      marginBottom: "16px",
    }}>
      <label style={{ fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "8px", color: "var(--color-sub)" }}>
        🔗 Webhook URL
      </label>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "10px 12px",
      }}>
        <code style={{ fontSize: "12px", color: "#3b82f6", wordBreak: "break-all", flex: 1, fontFamily: "monospace" }}>
          {url}
        </code>
        <button onClick={copyUrl} style={{
          padding: "4px 12px",
          background: copied ? "#16a34a" : "var(--color-rose)",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p style={{ fontSize: "11px", color: "var(--color-sub)", marginTop: "8px" }}>
        Paste this URL in your Meta Developer Console webhook configuration.
      </p>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, isPassword, helpText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isPassword?: boolean;
  helpText?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "6px", color: "var(--color-ink)" }}>
        {label}
      </label>
      <input
        type={isPassword ? "password" : "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "10px 14px",
          border: "1.5px solid var(--color-border)",
          borderRadius: "8px",
          fontSize: "14px",
          background: "var(--color-surface)",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--color-rose)")}
        onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
      />
      {helpText && (
        <p style={{ fontSize: "11px", color: "var(--color-sub)", marginTop: "4px" }}>{helpText}</p>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  overflow: "hidden",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "16px 20px",
  background: "#fafafa",
  borderBottom: "1px solid var(--color-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const primaryBtn: React.CSSProperties = {
  padding: "9px 18px",
  background: "var(--color-rose)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const editBtn: React.CSSProperties = {
  padding: "6px 14px",
  background: "#fff",
  color: "#15803d",
  border: "1.5px solid #86efac",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteBtn: React.CSSProperties = {
  padding: "6px 14px",
  background: "#fff",
  color: "#dc2626",
  border: "1.5px solid #fca5a5",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
  alignSelf: "flex-start",
  padding: "6px 14px",
  background: "transparent",
  color: "var(--color-sub)",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};
