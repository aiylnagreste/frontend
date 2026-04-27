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
import s from "./IntegrationsTab.module.css";

function ConnectionBadge({
  hasToken,
  verified,
  credentialsValid,
}: {
  hasToken: boolean;
  verified: boolean;
  credentialsValid?: boolean;
}) {
  if (!hasToken) return <Badge status="inactive" label="Not configured" />;
  if (credentialsValid === true) return <Badge status="active" label="Connected" />;
  if (verified) return <Badge status="active" label="Connected" />;
  if (credentialsValid === false) return <Badge status="warning" label="Invalid credentials" />;
  return <Badge status="warning" label="Awaiting verification" />;
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
    staleTime: 5000,
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
      api.put<{
        ok: boolean;
        validation?: Record<string, { ok: boolean; error?: string }>;
      }>("/salon-admin/api/webhook-config", {
        wa_phone_number_id: wa.phone_number_id || undefined,
        wa_access_token: wa.access_token || undefined,
        wa_verify_token: wa.verify_token || undefined,
        ig_page_access_token: ig.page_access_token || undefined,
        ig_verify_token: ig.verify_token || undefined,
        fb_page_access_token: fb.page_access_token || undefined,
        fb_verify_token: fb.verify_token || undefined,
      }),
    onSuccess: (data) => {
      toast.success("Integrations saved");
      const validation = data?.validation || {};
      const channelLabels: Record<string, string> = {
        whatsapp: "WhatsApp",
        instagram: "Instagram",
        facebook: "Facebook",
      };
      for (const [channel, result] of Object.entries(validation)) {
        if (result && result.ok === false) {
          const label = channelLabels[channel] || channel;
          const msg = result.error || "unknown error";
          toast.error(`${label} credentials invalid: ${msg}`);
        }
      }
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
    <div className={s.container}>
      {hasAnyAccess && (
        <p className={s.intro}>
          Connect your salon&apos;s messaging accounts so customers can book through WhatsApp, Instagram, or Facebook.
        </p>
      )}

      {!planFeatures && (
        <div className={s.loading}>Loading plan features…</div>
      )}
      {planFeatures && !hasAnyAccess && (
        <div className={s.noPlanBox}>
          Your plan does not include messaging integrations. Upgrade to enable WhatsApp, Instagram, or Facebook booking.
        </div>
      )}

      <div className={s.grid}>
        {/* WhatsApp */}
        {planFeatures?.whatsapp_access === 1 && (
          <IntegrationCard
            icon="💬"
            title="WhatsApp"
            connectionBadge={<ConnectionBadge hasToken={!!config?.has_whatsapp} verified={!!config?.wa_verified} credentialsValid={config?.wa_credentials_valid} />}
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
        <div className={s.col}>
          {planFeatures?.instagram_access === 1 && (
            <IntegrationCard
              icon="📸"
              title="Instagram"
              connectionBadge={<ConnectionBadge hasToken={!!config?.has_instagram} verified={!!config?.ig_verified} credentialsValid={config?.ig_credentials_valid} />}
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
              connectionBadge={<ConnectionBadge hasToken={!!config?.has_facebook} verified={!!config?.fb_verified} credentialsValid={config?.fb_credentials_valid} />}
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
        <div className={`${s.saveRow} ${enabledCount === 1 ? s["saveRow--single"] : s["saveRow--multi"]}`}>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={s.saveBtn}
          >
            {saveMutation.isPending ? "Saving…" : (enabledCount === 1 ? "Save integration" : "Save All Integrations")}
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
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardHeaderLeft}>
          <span className={s.cardIcon}>{icon}</span>
          <h4 className={s.cardTitle}>{title}</h4>
        </div>
        {connectionBadge}
      </div>

      <div className={s.cardBody}>
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
      <div className={s.savedBox}>
        <div className={s.savedHeader}>
          <Lock size={14} color="#16a34a" />
          <p className={s.savedTitle}>Credentials saved</p>
        </div>

        <div className={s.savedFields}>
          {savedFields.map((f) => (
            <div key={f.label} className={s.savedRow}>
              <span className={s.savedKey}>{f.label}</span>
              <span className={s.savedVal}>{f.value}</span>
            </div>
          ))}
        </div>

        <div className={s.savedActions}>
          <button onClick={onEdit} className={s.editBtn}>
            Edit credentials
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={s.deleteBtn}
          >
            <Trash2 size={11} />
            {isDeleting ? "Removing…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.editFields}>
      {isSaved && (
        <div className={s.editNotice}>
          Leave a field blank to keep the existing value. Only filled fields will be updated.
        </div>
      )}
      {children}
      {isSaved && (
        <button onClick={onCancel} className={s.cancelBtn}>
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
    <div className={s.webhookBox}>
      <div className={s.webhookLabel}>
        <ExternalLink size={12} color="#5F6577" />
        <span className={s.webhookLabelText}>Webhook URL</span>
      </div>
      <div className={s.webhookUrlRow}>
        <code className={s.webhookUrl}>{url}</code>
        <button
          onClick={copyUrl}
          className={`${s.copyBtn} ${copied ? s["copyBtn--copied"] : ""}`}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className={s.webhookHint}>
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
      <label className={s.fieldLabel}>{label}</label>
      <input
        type={isPassword ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={s.fieldInput}
      />
      {helpText && (
        <p className={s.fieldHint}>{helpText}</p>
      )}
    </div>
  );
}
