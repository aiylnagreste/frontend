// components/settings/IntegrationsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWebhookConfig, QK } from "@/lib/queries";
import type { WebhookConfig, PlanFeatures } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Lock, ExternalLink, Copy, Check, Trash2 } from "lucide-react";

function ConnectionBadge({ hasToken, verified }: { hasToken: boolean; verified: boolean }) {
  if (hasToken && verified) return <Badge status="active" label="Connected" />;
  if (hasToken && !verified) return <Badge status="warning" label="Awaiting verification" />;
  return <Badge status="inactive" label="Not configured" />;
}

interface IntegrationsTabProps {
  tenantId: string;
  planFeatures?: PlanFeatures;
}

const EMPTY_WA = { phone_number_id: "", access_token: "", verify_token: "" };
const EMPTY_IG = { page_access_token: "", verify_token: "" };
const EMPTY_FB = { page_access_token: "", verify_token: "" };

const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export function IntegrationsTab({ tenantId, planFeatures }: IntegrationsTabProps) {
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

  useEffect(() => {
    if (config?.wa_phone_number_id) {
      setWa((prev) => ({ ...prev, phone_number_id: config.wa_phone_number_id }));
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
      setWa((prev) => ({ ...prev, access_token: "", verify_token: "" }));
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


  const waSavedFields = [
    { label: "Phone Number ID", value: config?.wa_phone_number_id || "—" },
    { label: "Access Token", value: "Saved" },
    { label: "Verify Token", value: "Saved" },
  ];
  const igSavedFields = [
    { label: "Page Access Token", value: "Saved" },
    { label: "Verify Token", value: "Saved" },
  ];
  const fbSavedFields = [
    { label: "Page Access Token", value: "Saved" },
    { label: "Verify Token", value: "Saved" },
  ];

  const hasAnyAccess =
    planFeatures &&
    (planFeatures.whatsapp_access === 1 ||
      planFeatures.instagram_access === 1 ||
      planFeatures.facebook_access === 1);

  const enabledCount = [
    planFeatures?.whatsapp_access === 1,
    planFeatures?.instagram_access === 1,
    planFeatures?.facebook_access === 1,
  ].filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {hasAnyAccess && (
        <p style={{ fontSize: "13px", color: "#5F6577", lineHeight: 1.6 }}>
          Connect your salon&apos;s messaging accounts so customers can book through WhatsApp, Instagram, or Facebook.
        </p>
      )}

      {!planFeatures && (
        <div style={{ color: "#9CA3B4", padding: 24, fontSize: "13px" }}>Loading plan features…</div>
      )}
      {planFeatures && !hasAnyAccess && (
        <div style={{
          padding: "20px 24px",
          background: "#F8F8F6",
          border: "1px solid #E6E4DF",
          borderRadius: "10px",
          color: "#5F6577",
          fontSize: "13px",
          lineHeight: 1.6,
        }}>
          Your plan does not include messaging integrations. Upgrade to enable WhatsApp, Instagram, or Facebook booking.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* WhatsApp */}
        {planFeatures?.whatsapp_access === 1 && (
          <IntegrationCard
            icon="💬"
            title="WhatsApp"
            connectionBadge={<ConnectionBadge hasToken={!!config?.has_whatsapp} verified={!!config?.wa_verified} />}
            webhookUrl={`${backendOrigin}/webhooks/${tenantId}/whatsapp`}
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
              onChange={(v) => setWa((p) => ({ ...p, phone_number_id: v }))}
              placeholder="Enter Phone Number ID"
            />
            <Field
              label="Access Token"
              value={wa.access_token}
              onChange={(v) => setWa((p) => ({ ...p, access_token: v }))}
              placeholder="Enter new Access Token"
              isPassword
            />
            <Field
              label="Verify Token"
              value={wa.verify_token}
              onChange={(v) => setWa((p) => ({ ...p, verify_token: v }))}
              placeholder="Enter new Verify Token"
              helpText="Must match what you set in Meta Developer Console"
            />
          </IntegrationCard>
        )}

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {planFeatures?.instagram_access === 1 && (
            <IntegrationCard
              icon="📸"
              title="Instagram"
              connectionBadge={<ConnectionBadge hasToken={!!config?.has_instagram} verified={!!config?.ig_verified} />}
              webhookUrl={`${backendOrigin}/webhooks/${tenantId}/instagram`}
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
                onChange={(v) => setIg((p) => ({ ...p, page_access_token: v }))}
                placeholder="Enter new Page Access Token"
                isPassword
              />
              <Field
                label="Verify Token"
                value={ig.verify_token}
                onChange={(v) => setIg((p) => ({ ...p, verify_token: v }))}
                placeholder="Enter new Verify Token"
                helpText="Must match what you set in Meta Developer Console"
              />
            </IntegrationCard>
          )}

          {planFeatures?.facebook_access === 1 && (
            <IntegrationCard
              icon="👤"
              title="Facebook Messenger"
              connectionBadge={<ConnectionBadge hasToken={!!config?.has_facebook} verified={!!config?.fb_verified} />}
              webhookUrl={`${backendOrigin}/webhooks/${tenantId}/facebook`}
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
                onChange={(v) => setFb((p) => ({ ...p, page_access_token: v }))}
                placeholder="Enter new Page Access Token"
                isPassword
              />
              <Field
                label="Verify Token"
                value={fb.verify_token}
                onChange={(v) => setFb((p) => ({ ...p, verify_token: v }))}
                placeholder="Enter new Verify Token"
                helpText="Must match what you set in Meta Developer Console"
              />
            </IntegrationCard>
          )}
        </div>
      </div>

      {enabledCount > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{
              padding: "9px 20px",
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: saveMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              opacity: saveMutation.isPending ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {saveMutation.isPending ? "Saving…" : "Save All Integrations"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── IntegrationCard ── */
function IntegrationCard({
  icon,
  title,
  connectionBadge,
  webhookUrl,
  isSaved,
  isEditing,
  onEdit,
  onCancel,
  onDelete,
  isDeleting,
  savedFields,
  children,
}: {
  icon: string;
  title: string;
  connectionBadge: React.ReactNode;
  webhookUrl: string;
  isSaved: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  savedFields: { label: string; value: string }[];
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>{icon}</span>
          <h4 style={{
            fontWeight: 700,
            margin: 0,
            fontSize: "14px",
            color: "#1A1D23",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em",
          }}>
            {title}
          </h4>
        </div>
        {connectionBadge}
      </div>

      <div style={{ padding: "20px" }}>
        <WebhookUrlBox url={webhookUrl} />

        <CredentialSection
          isSaved={isSaved}
          isEditing={isEditing}
          onEdit={onEdit}
          onCancel={onCancel}
          onDelete={onDelete}
          isDeleting={isDeleting}
          savedFields={savedFields}
        >
          {children}
        </CredentialSection>
      </div>
    </div>
  );
}

/* ── CredentialSection ── */
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
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Lock size={14} color="#16a34a" />
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#15803d" }}>Credentials saved</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
          {savedFields.map((f) => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#166534", fontWeight: 500 }}>{f.label}</span>
              <span style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#15803d",
                background: "#DCFCE7",
                padding: "2px 8px",
                borderRadius: "4px",
              }}>
                {f.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onEdit}
            style={{
              padding: "6px 14px",
              background: "#fff",
              color: "#15803d",
              border: "1px solid #86EFAC",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Edit credentials
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            style={{
              padding: "6px 14px",
              background: "#fff",
              color: "#DC2626",
              border: "1px solid #FECACA",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              opacity: isDeleting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!isDeleting) e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <Trash2 size={11} />
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
          padding: "10px 14px",
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#92400E",
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          Leave a field blank to keep the existing value. Only filled fields will be updated.
        </div>
      )}
      {children}
      {isSaved && (
        <button
          onClick={onCancel}
          style={{
            alignSelf: "flex-start",
            padding: "6px 14px",
            background: "transparent",
            color: "#5F6577",
            border: "1px solid #E6E4DF",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F8F8F6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

/* ── WebhookUrlBox ── */
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
      background: "#F8F8F6",
      border: "1px solid #E6E4DF",
      borderRadius: "8px",
      padding: "14px 16px",
      marginBottom: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <ExternalLink size={12} color="#5F6577" />
        <label style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#5F6577",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Webhook URL
        </label>
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#fff",
        border: "1px solid #E6E4DF",
        borderRadius: "6px",
        padding: "8px 12px",
      }}>
        <code style={{
          fontSize: "11px",
          color: "#b5484b",
          wordBreak: "break-all",
          flex: 1,
          fontFamily: "monospace",
          lineHeight: 1.5,
        }}>
          {url}
        </code>
        <button
          onClick={copyUrl}
          style={{
            padding: "4px 12px",
            background: copied ? "#16a34a" : "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontFamily: "'DM Sans', sans-serif",
            transition: "background 0.2s",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "8px", lineHeight: 1.5 }}>
        Paste this URL in your Meta Developer Console webhook settings.
      </p>
    </div>
  );
}

/* ── Field ── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  isPassword,
  helpText,
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
      <label style={{
        fontSize: "12px",
        fontWeight: 600,
        display: "block",
        marginBottom: "6px",
        color: "#5F6577",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </label>
      <input
        type={isPassword ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "10px 14px",
          border: "1.5px solid #E6E4DF",
          borderRadius: "8px",
          fontSize: "14px",
          background: "#fff",
          outline: "none",
          boxSizing: "border-box",
          color: "#1A1D23",
          fontFamily: "'DM Sans', sans-serif",
          transition: "border-color 0.2s, box-shadow 0.2s",
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
      {helpText && (
        <p style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "4px", lineHeight: 1.5 }}>{helpText}</p>
      )}
    </div>
  );
}

/* ── Styles ── */
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E6E4DF",
  borderRadius: "10px",
  overflow: "hidden",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "14px 20px",
  background: "#FDFDFC",
  borderBottom: "1px solid #E6E4DF",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};