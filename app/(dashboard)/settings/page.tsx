"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBranches,
  fetchStaff,
  fetchRoles,
  fetchTimings,
  fetchGeneral,
  fetchWebhookConfig,
  fetchPlanFeatures,
  fetchCorsOrigin,
  saveCorsOrigin,
  QK,
} from "@/lib/queries";
import type { Branch, Staff, Role, SalonTimings, WebhookConfig, PlanFeatures } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { RoleDrawer } from "@/components/settings/RoleDrawer";
import {IntegrationsTab} from "@/components/settings/IntegrationsTab";

import { ModalShell } from "@/components/ui/ModalShell";
type SettingsTab = "general" | "branches" | "staff" | "roles" | "timings" | "integrations" | "account";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "⚙️ General" },
  { id: "branches", label: "🏪 Branches" },
  { id: "staff", label: "👥 Staff" },
  { id: "roles", label: "🏷️ Roles" },
  { id: "timings", label: "🕐 Salon Hours" },
  { id: "integrations", label: "🔗 Integrations" },
  { id: "account", label: "🔑 Account" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
        Settings
      </h3>

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              border:
                activeTab === t.id
                  ? "1.5px solid var(--color-rose)"
                  : "1.5px solid var(--color-border)",
              background:
                activeTab === t.id
                  ? "var(--color-rose-dim)"
                  : "var(--color-surface)",
              color:
                activeTab === t.id ? "var(--color-rose)" : "var(--color-sub)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && <GeneralTab />}
      {activeTab === "branches" && <BranchesTab />}
      {activeTab === "staff" && <StaffTab />}
      {activeTab === "roles" && <RolesTab />}
      {activeTab === "timings" && <TimingsTab />}
      {activeTab === "integrations" && <IntegrationsTabWrapper />}
      {activeTab === "account" && <AccountTab />}
    </div>
  );
}

/* ─── General Tab ─── */
function GeneralTab() {
  const qc = useQueryClient();
  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const { data: planFeatures } = useQuery({
    queryKey: QK.planFeatures(),
    queryFn: fetchPlanFeatures,
    staleTime: 60_000,
  });

  const showCorsCard = planFeatures?.widget_access === 1 || planFeatures?.ai_calls_access === 1;

  const { data: corsOriginData } = useQuery({
    queryKey: QK.corsOrigin(),
    queryFn: fetchCorsOrigin,
    staleTime: 60_000,
    enabled: !!planFeatures,
  });

  const [corsUrl, setCorsUrl] = useState("");

  useEffect(() => {
    if (corsOriginData !== undefined && corsOriginData !== null) {
      setCorsUrl(corsOriginData);
    }
  }, [corsOriginData]);

  const corsOriginMutation = useMutation({
    mutationFn: () => saveCorsOrigin(corsUrl.trim() || null),
    onSuccess: () => {
      toast.success("Website URL saved");
      qc.invalidateQueries({ queryKey: QK.corsOrigin() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [currency, setCurrency] = useState(general?.currency ?? "Rs.");
  const [botName, setBotName] = useState((general as Record<string, string> | undefined)?.bot_name ?? "");
  const [primaryColor, setPrimaryColor] = useState((general as Record<string, string> | undefined)?.primary_color ?? "#8b4a6b");
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const generalBotName = (general as Record<string, string> | undefined)?.bot_name ?? "";
  if (generalBotName && botName === "" && generalBotName !== botName) {
    setBotName(generalBotName);
  }

  const tenantId = general?.tenantId ?? "…";
  const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
  const widgetUrl = `${backendOrigin}/widget/${tenantId}/widget.js`;
  const scriptAttrs = [
    `src="${widgetUrl}"`,
    botName.trim() ? `data-bot-name="${botName.trim()}"` : null,
    primaryColor !== "#8b4a6b" ? `data-primary-color="${primaryColor}"` : null,
  ].filter(Boolean).join("\n  ");
  const scriptTag = `<script\n  ${scriptAttrs}\n></script>`;

  function copyScript() {
    navigator.clipboard.writeText(scriptTag).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyWidgetUrl() {
    navigator.clipboard.writeText(widgetUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put("/salon-admin/api/settings/general", {
        currency,
        bot_name: botName,
        primary_color: primaryColor,
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: QK.general() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previewName = botName.trim() || general?.owner_name || "Salon Assistant";
  const colorPresets = ["#8b4a6b", "#e11d48", "#7c3aed", "#0ea5e9", "#16a34a", "#ea580c"];

  // --- Design System Styles ---
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E6E4DF",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#5F6577",
    lineHeight: 1.6,
    marginBottom: "20px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "8px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 8,
    fontSize: "13px",
    color: "#1A1D23",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 14px rgba(181,72,75,0.2)",
    transition: "all 0.2s",
  };

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#b5484b";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = "#E6E4DF";
    e.currentTarget.style.boxShadow = "none";
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      {/* LEFT COLUMN */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Currency Card */}
        <div style={cardStyle}>
          <h4 style={titleStyle}>💱 Currency</h4>
          <p style={descStyle}>Shown before all prices in the panel and bot replies.</p>

          <label style={labelStyle}>Currency Symbol / Prefix</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{ ...selectStyle, marginBottom: "20px" }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="Rs.">Rs. — Pakistani Rupee</option>
            <option value="AED">AED — UAE Dirham</option>
            <option value="SAR">SAR — Saudi Riyal</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
            <option value="INR">INR — Indian Rupee</option>
          </select>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{ ...btnPrimary, opacity: saveMutation.isPending ? 0.7 : 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)"; }}
          >
            {saveMutation.isPending ? "Saving…" : "Save Settings"}
          </button>
        </div>

        {/* Widget Appearance Card */}
        {showCorsCard && (
          <div style={cardStyle}>
            <h4 style={titleStyle}>🎨 Widget Appearance</h4>
            <p style={descStyle}>Customize how your chat widget looks to visitors.</p>

            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder={general?.owner_name ?? "e.g. Glamour Studio"}
              style={{ ...inputStyle, marginBottom: "20px" }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <label style={labelStyle}>Widget Color</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  width: "42px",
                  height: "38px",
                  border: "1.5px solid #E6E4DF",
                  borderRadius: "8px",
                  cursor: "pointer",
                  padding: "3px",
                  flexShrink: 0,
                  background: "#fff"
                }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  ...inputStyle,
                  width: "110px",
                  padding: "8px 10px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    title={c}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: c,
                      border: primaryColor === c ? "2px solid #1A1D23" : "2px solid #E6E4DF",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "transform 0.1s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => { if(primaryColor !== c) e.currentTarget.style.transform = "scale(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={{ ...btnPrimary, opacity: saveMutation.isPending ? 0.7 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)"; }}
            >
              {saveMutation.isPending ? "Saving…" : "Save Widget Settings"}
            </button>
          </div>
        )}

        {/* Website & CORS Card */}
        {showCorsCard && (
          <div style={cardStyle}>
            <h4 style={titleStyle}>🌐 Website & CORS</h4>
            <p style={descStyle}>
              Add your website&apos;s URL so the chat widget and voice call can work on your site.
            </p>

            <label style={labelStyle}>Your Website URL</label>
            <input
              type="url"
              value={corsUrl}
              onChange={(e) => setCorsUrl(e.target.value)}
              placeholder="https://yoursalon.com"
              style={{ ...inputStyle, marginBottom: "20px" }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <button
              onClick={() => corsOriginMutation.mutate()}
              disabled={corsOriginMutation.isPending}
              style={{ ...btnPrimary, opacity: corsOriginMutation.isPending ? 0.7 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)"; }}
            >
              {corsOriginMutation.isPending ? "Saving…" : "Save Website URL"}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Live Preview Card */}
        {showCorsCard && (
          <div style={cardStyle}>
            <h4 style={titleStyle}>👁️ Live Preview</h4>
            <p style={descStyle}>This is how your widget will appear on your website.</p>

            <div style={{ 
              background: "#F4F3F0", 
              border: "1px solid #E6E4DF", 
              borderRadius: 12, 
              padding: "16px 16px 60px", 
              position: "relative", 
              minHeight: "200px" 
            }}>
              <p style={{ fontSize: "11px", color: "#9CA3B4", margin: 0, fontWeight: 500 }}>Website preview</p>
              <div style={{ 
                position: "absolute", 
                bottom: "12px", 
                right: "12px", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "flex-end", 
                gap: "8px" 
              }}>
                <div style={{ 
                  background: "#fff", 
                  border: "1px solid #E6E4DF", 
                  borderRadius: 12, 
                  width: "220px", 
                  overflow: "hidden", 
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)" 
                }}>
                  <div style={{ 
                    background: primaryColor, 
                    color: "#fff", 
                    padding: "10px 14px", 
                    fontSize: "12px", 
                    fontWeight: 600, 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    fontFamily: "'DM Sans', sans-serif"
                  }}>
                    <span>{previewName}</span>
                    <span style={{ opacity: 0.7, cursor: "default", fontSize: "12px", background: "rgba(255,255,255,0.2)", width: "20px", height: "20px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</span>
                  </div>
                  <div style={{ padding: "12px 14px", fontSize: "11px", color: "#5F6577", lineHeight: 1.5 }}>
                    Hi! How can I help you today? 👋
                  </div>
                </div>
                <div style={{ 
                  width: "46px", 
                  height: "46px", 
                  borderRadius: "50%", 
                  background: primaryColor, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)", 
                  cursor: "default" 
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Embed Code Card */}
        {showCorsCard && (
          <div style={cardStyle}>
            <h4 style={titleStyle}>📋 Embed on Your Website</h4>
            <p style={descStyle}>
              Copy and paste this code just before the closing <code style={inlineCode}>&lt;/body&gt;</code> tag.
            </p>

            {/* Widget URL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Widget URL</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#F9F8F6",
                  border: "1px solid #E6E4DF",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <code
                  style={{
                    fontSize: "11px",
                    color: "#6b3057",
                    wordBreak: "break-all",
                    flex: 1,
                    fontFamily: "monospace",
                  }}
                >
                  {widgetUrl}
                </code>
                <button
                  onClick={copyWidgetUrl}
                  style={{
                    padding: "5px 14px",
                    background: copiedUrl ? "#16a34a" : "#1A1D23",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {copiedUrl ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "6px" }}>
                Tenant ID:{" "}
                <strong style={{ color: "#1A1D23", fontWeight: 600 }}>{tenantId}</strong>
              </p>
            </div>

            {/* Script Tag */}
            <label style={labelStyle}>Embed Script Tag</label>
            <div style={{ 
              position: "relative", 
              background: "#1A1D23", 
              borderRadius: 10, 
              padding: "16px",
              marginBottom: "16px",
            }}>
              <pre style={{ 
                fontSize: "11px", 
                color: "#a6e3a1", 
                wordBreak: "break-all", 
                margin: 0, 
                paddingRight: "80px", 
                whiteSpace: "pre-wrap", 
                fontFamily: "monospace",
                lineHeight: 1.6
              }}>
                {scriptTag}
              </pre>
              <button 
                onClick={copyScript}
                style={{ 
                  position: "absolute", 
                  top: "12px", 
                  right: "12px", 
                  padding: "5px 14px", 
                  background: copied ? "#16a34a" : "rgba(255,255,255,0.12)", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 6, 
                  fontSize: "11px", 
                  fontWeight: 600, 
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            {/* WordPress Note */}
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>💡</span>
              <p style={{ fontSize: "12px", color: "#92400E", margin: 0, lineHeight: 1.5 }}>
                <strong>WordPress?</strong> Use the included plugin instead — install{" "}
                <code style={{ ...inlineCode, background: "#FEF3C7" }}>
                  wp-plugin/salon-bot-widget.php
                </code>{" "}
                and set your bot server URL in the plugin settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inlineCode: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "11px",
  background: "#F4F3F0",
  padding: "2px 6px",
  borderRadius: 4,
  color: "#6b3057",
};
/* ─── Branches Tab ─── */
function BranchesTab() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/salon-admin/api/settings/branches/${id}`),
    onSuccess: () => {
      toast.success("Branch deleted");
      qc.invalidateQueries({ queryKey: QK.branches() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd() {
    setEditingBranch(null);
    setDrawerOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditingBranch(branch);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingBranch(null);
  }

  // --- Design System Styles ---
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E6E4DF",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#5F6577",
    lineHeight: 1.5,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 14px rgba(181,72,75,0.2)",
    transition: "all 0.2s",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    background: "#F9F8F6",
    borderBottom: "1px solid #E6E4DF",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#1A1D23",
    borderBottom: "1px solid #E6E4DF",
  };

  const outlineBtnStyle: React.CSSProperties = {
    padding: "6px 14px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 6,
    fontSize: "12px",
    fontWeight: 500,
    background: "#fff",
    cursor: "pointer",
    color: "#5F6577",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  };

  const dangerBtnStyle: React.CSSProperties = {
    ...outlineBtnStyle,
    color: "#DC2626",
    borderColor: "#FECACA",
    background: "#FEF2F2",
  };

  return (
    <>
      <div style={cardStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <h4 style={titleStyle}>Branch Management</h4>
            <p style={descStyle}>
              {branches.length} {branches.length === 1 ? "branch" : "branches"} configured
            </p>
          </div>
          <button
            style={btnPrimary}
            onClick={openAdd}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)";
            }}
          >
            + Add Branch
          </button>
        </div>

        {/* Table Container */}
        <div
          style={{
            border: "1px solid #E6E4DF",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "24px 16px" }}>
              <Skeleton style={{ height: "44px" }} />
              <Skeleton style={{ height: "44px", marginTop: "8px" }} />
              <Skeleton style={{ height: "44px", marginTop: "8px" }} />
            </div>
          ) : branches.length === 0 ? (
            <EmptyState icon="🏪" title="No branches yet" />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "60px" }}>#</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Address</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Map Link</th>
                  <th style={{ ...thStyle, textAlign: "right", paddingRight: "20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b, index) => (
                  <tr
                    key={b.id}
                    style={{
                      background: "transparent",
                      transition: "background 0.15s",
                      borderBottom: index === branches.length - 1 ? "none" : "1px solid #E6E4DF",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9F8F6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ ...tdStyle, color: "#9CA3B4", fontWeight: 500, fontFamily: "monospace", fontSize: "12px" }}>
                      #{b.number}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {b.name}
                    </td>
                    <td style={{ ...tdStyle, color: "#5F6577" }}>
                      {b.address || "—"}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#5F6577",
                      }}
                    >
                      {b.phone || "—"}
                    </td>
                    <td style={tdStyle}>
                      {b.map_link ? (
                        <a
                          href={b.map_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#b5484b",
                            fontSize: "12px",
                            fontWeight: 500,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#9a3c3f"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#b5484b"}
                        >
                          View Map ↗
                        </a>
                      ) : (
                        <span style={{ color: "#9CA3B4" }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          style={outlineBtnStyle}
                          onClick={() => openEdit(b)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#b5484b";
                            e.currentTarget.style.color = "#b5484b";
                            e.currentTarget.style.background = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#E6E4DF";
                            e.currentTarget.style.color = "#5F6577";
                            e.currentTarget.style.background = "#fff";
                          }}
                        >
                          Edit
                        </button>
                        <button
                          style={dangerBtnStyle}
                          onClick={() => deleteMutation.mutate(b.id)}
                          disabled={deleteMutation.isPending}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FEE2E2";
                            e.currentTarget.style.borderColor = "#FCA5A5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FEF2F2";
                            e.currentTarget.style.borderColor = "#FECACA";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <BranchDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editingBranch}
      />
    </>
  );
}

/* ─── Staff Tab drawershell─── */
function StaffTab() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const { data: staff = [], isLoading } = useQuery<Staff[]>({
    queryKey: QK.staff(),
    queryFn: fetchStaff,
    staleTime: 5 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/salon-admin/api/settings/staff/${id}`),
    onSuccess: () => {
      toast.success("Staff member removed");
      qc.invalidateQueries({ queryKey: QK.staff() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd() {
    setEditingStaff(null);
    setDrawerOpen(true);
  }

  function openEdit(staff: Staff) {
    setEditingStaff(staff);
    setDrawerOpen(true);
  }

  // --- Design System Styles ---
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E6E4DF",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#5F6577",
    lineHeight: 1.5,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 14px rgba(181,72,75,0.2)",
    transition: "all 0.2s",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    background: "#F9F8F6",
    borderBottom: "1px solid #E6E4DF",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#1A1D23",
    borderBottom: "1px solid #E6E4DF",
  };

  const outlineBtnStyle: React.CSSProperties = {
    padding: "6px 14px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 6,
    fontSize: "12px",
    fontWeight: 500,
    background: "#fff",
    cursor: "pointer",
    color: "#5F6577",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  };

  const dangerBtnStyle: React.CSSProperties = {
    ...outlineBtnStyle,
    color: "#DC2626",
    borderColor: "#FECACA",
    background: "#FEF2F2",
  };

  return (
    <>
      <div style={cardStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <h4 style={titleStyle}>Staff Management</h4>
            <p style={descStyle}>
              {staff.length} team {staff.length === 1 ? "member" : "members"}
            </p>
          </div>
          <button
            style={btnPrimary}
            onClick={openAdd}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)";
            }}
          >
            + Add Staff
          </button>
        </div>

        {/* Table Container */}
        <div
          style={{
            border: "1px solid #E6E4DF",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "24px 16px" }}>
              <Skeleton style={{ height: "44px" }} />
              <Skeleton style={{ height: "44px", marginTop: "8px" }} />
              <Skeleton style={{ height: "44px", marginTop: "8px" }} />
            </div>
          ) : staff.length === 0 ? (
            <EmptyState icon="👥" title="No staff yet" />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {["Name", "Phone", "Role", "Branch", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        style={
                          h === "Actions"
                            ? { ...thStyle, textAlign: "right", paddingRight: "20px" }
                            : thStyle
                        }
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {staff.map((s, index) => (
                  <tr
                    key={s.id}
                    style={{
                      background: "transparent",
                      transition: "background 0.15s",
                      borderBottom:
                        index === staff.length - 1
                          ? "none"
                          : "1px solid #E6E4DF",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9F8F6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#5F6577",
                      }}
                    >
                      {s.phone}
                    </td>
                    <td style={tdStyle}>
                      <Badge status="pending" label={s.role} />
                    </td>
                    <td style={{ ...tdStyle, color: "#5F6577" }}>
                      {s.branch_name ?? "—"}
                    </td>
                    <td style={tdStyle}>
                      <Badge status={s.status} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          style={outlineBtnStyle}
                          onClick={() => openEdit(s)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#b5484b";
                            e.currentTarget.style.color = "#b5484b";
                            e.currentTarget.style.background = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#E6E4DF";
                            e.currentTarget.style.color = "#5F6577";
                            e.currentTarget.style.background = "#fff";
                          }}
                        >
                          Edit
                        </button>
                        <button
                          style={dangerBtnStyle}
                          onClick={() => deleteMutation.mutate(s.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FEE2E2";
                            e.currentTarget.style.borderColor = "#FCA5A5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FEF2F2";
                            e.currentTarget.style.borderColor = "#FECACA";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <StaffDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingStaff(null);
        }}
        editing={editingStaff}
      />
    </>
  );
}
/* ─── Staff Tab drawershell─── */

/* ─── Roles Tab ─── */

function RolesTab() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: QK.roles(),
    queryFn: fetchRoles,
    staleTime: 10 * 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/salon-admin/api/settings/roles/${id}`),
    onSuccess: () => {
      toast.success("Role deleted");
      qc.invalidateQueries({ queryKey: QK.roles() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Design System Styles ---
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E6E4DF",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    maxWidth: "540px", // Slightly wider than before for better balance
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#5F6577",
    lineHeight: 1.5,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 14px rgba(181,72,75,0.2)",
    transition: "all 0.2s",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: "10px",
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    background: "#F9F8F6",
    borderBottom: "1px solid #E6E4DF",
  };

  const tdStyle: React.CSSProperties = {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#1A1D23",
    borderBottom: "1px solid #E6E4DF",
  };

  const dangerBtnStyle: React.CSSProperties = {
    padding: "6px 14px",
    border: "1.5px solid #FECACA",
    borderRadius: 6,
    fontSize: "12px",
    fontWeight: 500,
    background: "#FEF2F2",
    cursor: "pointer",
    color: "#DC2626",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  };

  return (
    <>
      <div style={cardStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <h4 style={titleStyle}>Staff Roles</h4>
            <p style={descStyle}>
              {roles.length} {roles.length === 1 ? "role" : "roles"} defined
            </p>
          </div>
          <button
            style={btnPrimary}
            onClick={() => setDrawerOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)";
            }}
          >
            + Add Role
          </button>
        </div>

        {/* Table Container */}
        <div
          style={{
            border: "1px solid #E6E4DF",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "24px 16px" }}>
              <Skeleton style={{ height: "44px" }} />
              <Skeleton style={{ height: "44px", marginTop: "8px" }} />
            </div>
          ) : roles.length === 0 ? (
            <EmptyState icon="🏷️" title="No roles yet" />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Role Name</th>
                  <th style={{ ...thStyle, textAlign: "right", paddingRight: "20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r, index) => (
                  <tr
                    key={r.id}
                    style={{
                      background: "transparent",
                      transition: "background 0.15s",
                      borderBottom: index === roles.length - 1 ? "none" : "1px solid #E6E4DF",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9F8F6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {r.name}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button
                        style={dangerBtnStyle}
                        onClick={() => deleteMutation.mutate(r.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEE2E2";
                          e.currentTarget.style.borderColor = "#FCA5A5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                          e.currentTarget.style.borderColor = "#FECACA";
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RoleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}


/* ─── Timings Tab ─── */
function TimingsTab() {
  const qc = useQueryClient();
  const { data: timings } = useQuery<SalonTimings>({
    queryKey: QK.timings(),
    queryFn: fetchTimings,
    staleTime: 10 * 60_000,
  });

  const [wdOpen, setWdOpen] = useState(timings?.workday?.open_time ?? "09:00");
  const [wdClose, setWdClose] = useState(
    timings?.workday?.close_time ?? "20:00"
  );
  const [weOpen, setWeOpen] = useState(timings?.weekend?.open_time ?? "10:00");
  const [weClose, setWeClose] = useState(
    timings?.weekend?.close_time ?? "20:00"
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put("/salon-admin/api/settings/timings", {
        workday: { open_time: wdOpen, close_time: wdClose },
        weekend: { open_time: weOpen, close_time: weClose },
      }),
    onSuccess: () => {
      toast.success("Hours saved");
      qc.invalidateQueries({ queryKey: QK.timings() });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Design System Styles ---
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E6E4DF",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    maxWidth: "540px",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  };

  const descStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#5F6577",
    lineHeight: 1.5,
    marginBottom: "24px",
  };

  const sectionBoxStyle: React.CSSProperties = {
    background: "#F9F8F6",
    borderRadius: 10,
    padding: "18px",
    border: "1px solid #E6E4DF",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    color: "#1A1D23",
    margin: 0,
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 14px rgba(181,72,75,0.2)",
    transition: "all 0.2s",
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={titleStyle}>🕐 Salon Operating Hours</h4>
        <p style={descStyle}>
          Set your workday and weekend schedules for bookings.
        </p>
      </div>

      {/* Schedules Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        {/* Workdays Box */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ fontSize: "15px" }}>🗓️</span>
            <h5 style={sectionTitleStyle}>Workdays (Mon – Fri)</h5>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <TimeInput label="Opens At" value={wdOpen} onChange={setWdOpen} />
            <TimeInput label="Closes At" value={wdClose} onChange={setWdClose} />
          </div>
        </div>

        {/* Weekends Box */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ fontSize: "15px" }}>🏖️</span>
            <h5 style={sectionTitleStyle}>Weekends (Sat – Sun)</h5>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <TimeInput label="Opens At" value={weOpen} onChange={setWeOpen} />
            <TimeInput label="Closes At" value={weClose} onChange={setWeClose} />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        style={{ ...btnPrimary, opacity: saveMutation.isPending ? 0.7 : 1 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(181,72,75,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.2)";
        }}
      >
        {saveMutation.isPending ? "Saving…" : "Save Hours"}
      </button>
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "8px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 8,
    fontSize: "13px",
    color: "#1A1D23",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#b5484b";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E6E4DF";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

/* ─── Integrations Tab ─── */

function IntegrationsTabWrapper() {
  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const { data: planFeatures } = useQuery({
    queryKey: QK.planFeatures(),
    queryFn: fetchPlanFeatures,
    staleTime: 60_000,
  });
  const tenantId = general?.tenantId ?? "";
  return <IntegrationsTab tenantId={tenantId} planFeatures={planFeatures} />;
}

/* ─── Account Tab ─── */
/* ─── Account Tab with 3-Attempt Lockout ─── */
function AccountTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Attempt tracking state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  // Load failed attempts from localStorage on mount
  useEffect(() => {
    const storedAttempts = localStorage.getItem("salonPasswordAttempts");
    const storedLockUntil = localStorage.getItem("salonPasswordLockUntil");
    
    if (storedAttempts) {
      const attempts = parseInt(storedAttempts, 10);
      setFailedAttempts(attempts);
      setRemainingAttempts(Math.max(0, 3 - attempts));
    }
    
    if (storedLockUntil) {
      const lockUntil = parseInt(storedLockUntil, 10);
      if (Date.now() < lockUntil) {
        setIsLocked(true);
        setLockoutMinutes(Math.ceil((lockUntil - Date.now()) / 60000));
        
        // Auto-refresh lock status every minute
        const interval = setInterval(() => {
          const remaining = Math.ceil((lockUntil - Date.now()) / 60000);
          if (remaining <= 0) {
            setIsLocked(false);
            setLockoutMinutes(0);
            localStorage.removeItem("salonPasswordLockUntil");
            clearInterval(interval);
            // Reset attempts on unlock
            setFailedAttempts(0);
            setRemainingAttempts(3);
            localStorage.removeItem("salonPasswordAttempts");
            toast.success("Account unlocked. You can try again.");
          } else {
            setLockoutMinutes(remaining);
          }
        }, 60000);
        
        return () => clearInterval(interval);
      } else {
        // Lock expired, clean up
        localStorage.removeItem("salonPasswordLockUntil");
        localStorage.removeItem("salonPasswordAttempts");
      }
    }
  }, []);

  const logoutUser = async () => {
    try {
      await fetch("/salon-admin/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (e) {
      // Ignore logout errors
    }
    
    // Clear client-side storage
    localStorage.removeItem("salonPasswordAttempts");
    localStorage.removeItem("salonPasswordLockUntil");
    sessionStorage.clear();
    
    // Show message before redirect
    toast.error("Too many failed attempts. Redirecting to login...");
    
    setTimeout(() => {
      window.location.href = "/salon-admin/login";
    }, 1500);
  };

  const incrementFailedAttempts = () => {
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    setRemainingAttempts(Math.max(0, 3 - newCount));
    localStorage.setItem("salonPasswordAttempts", newCount.toString());
    
    if (newCount >= 3) {
      const lockUntil = Date.now() + (15 * 60 * 1000); // 15 minutes lockout
      localStorage.setItem("salonPasswordLockUntil", lockUntil.toString());
      setIsLocked(true);
      setLockoutMinutes(15);
      
      toast.error("Too many failed attempts. Account locked for 15 minutes.");
      
      // Auto-logout after 3 seconds
      setTimeout(() => {
        logoutUser();
      }, 3000);
    }
  };

  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setRemainingAttempts(3);
    localStorage.removeItem("salonPasswordAttempts");
    localStorage.removeItem("salonPasswordLockUntil");
    setIsLocked(false);
    setLockoutMinutes(0);
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#EF4444" };
    if (score <= 2) return { score, label: "Fair", color: "#F59E0B" };
    if (score <= 3) return { score, label: "Good", color: "#3B82F6" };
    return { score, label: "Strong", color: "#22C55E" };
  };

  const strength = getPasswordStrength(form.newPassword);
  const confirmMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Check if locked
    if (isLocked) {
      toast.error(`Account is locked. Please wait ${lockoutMinutes} minutes.`);
      return;
    }

    setCurrentPasswordError("");

    if (!form.currentPassword) {
      setCurrentPasswordError("Current password is required");
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.put("/salon-admin/api/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      
      // Success - reset all attempts
      resetFailedAttempts();
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setCurrentPasswordError("");
      
    } catch (e: unknown) {
      // Check for lockout response (status 423)
      if (e instanceof Error) {
        const errorMsg = e.message.toLowerCase();
        
        if (errorMsg.includes("locked") || errorMsg.includes("423")) {
          setIsLocked(true);
          setLockoutMinutes(15);
          toast.error("Account locked due to multiple failures. Redirecting...");
          setTimeout(() => logoutUser(), 3000);
        } 
        else if (errorMsg.includes("current password") || errorMsg.includes("incorrect") || errorMsg.includes("401")) {
          const newRemaining = remainingAttempts - 1;
          incrementFailedAttempts();
          
          if (newRemaining > 0) {
            setCurrentPasswordError(`Current password is incorrect. ${newRemaining} attempt(s) remaining.`);
            toast.error(`${newRemaining} attempt(s) remaining before lockout.`);
          } else {
            setCurrentPasswordError("Too many failed attempts. Redirecting to login...");
          }
        } else {
          toast.error(e.message);
        }
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  }

  // If locked, show lock screen
  if (isLocked) {
    return (
      <div style={{ maxWidth: "520px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #FEE2E2",
            borderRadius: 12,
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "32px",
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Lock size={32} style={{ color: "#DC2626" }} />
          </div>
          <h4
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#DC2626",
              marginBottom: "12px",
            }}
          >
            Account Temporarily Locked
          </h4>
          <p style={{ fontSize: "14px", color: "#5F6577", marginBottom: "8px" }}>
            Too many failed password attempts.
          </p>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1D23", marginBottom: "24px" }}>
            Please wait {lockoutMinutes} minute{lockoutMinutes !== 1 ? "s" : ""} before trying again.
          </p>
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "#FEE2E2",
              borderRadius: "2px",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: `${(lockoutMinutes / 15) * 100}%`,
                height: "100%",
                background: "#DC2626",
                transition: "width 1s linear",
              }}
            />
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1.5px solid #DC2626",
              borderRadius: 8,
              fontSize: "13px",
              fontWeight: 600,
              color: "#DC2626",
              cursor: "pointer",
            }}
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  const baseInput: React.CSSProperties = {
    width: "100%",
    padding: "12px 52px 12px 16px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 8,
    fontSize: 14,
    color: "#1A1D23",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    background: "#fff",
  };

  function handleFocus(e: React.FocusEvent<HTMLInputElement>, error: boolean) {
    e.target.style.borderColor = error ? "#EF4444" : "#b5484b";
    e.target.style.boxShadow = error
      ? "0 0 0 3px rgba(239,68,68,0.1)"
      : "0 0 0 3px rgba(181,72,75,0.1)";
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>, error: boolean) {
    e.target.style.borderColor = error ? "#EF4444" : "#E6E4DF";
    e.target.style.boxShadow = "none";
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "8px",
  };

  const toggleBtn: React.CSSProperties = {
    position: "absolute",
    right: "4px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9CA3B4",
    fontSize: "11px",
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: "6px",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    transition: "color 0.15s, background 0.15s",
  };

  const errorMsg: React.CSSProperties = {
    background: "#FEF2F2",
    color: "#DC2626",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: "12px",
    fontWeight: 500,
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderLeft: "3px solid #EF4444",
  };

  const warningMsg: React.CSSProperties = {
    background: "#FFFBEB",
    color: "#D97706",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: "12px",
    fontWeight: 500,
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderLeft: "3px solid #F59E0B",
  };

  return (
    <div style={{ maxWidth: "520px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h4
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "#1A1D23",
            letterSpacing: "-0.02em",
            marginBottom: "6px",
          }}
        >
          Change Password
        </h4>
        <p style={{ fontSize: "13px", color: "#5F6577", lineHeight: 1.6 }}>
          Update your login credentials. You'll need to enter your current
          password to make changes.
        </p>
      </div>

      {/* Warning banner for remaining attempts */}
      {remainingAttempts < 3 && remainingAttempts > 0 && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE047",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TriangleAlert size={16} style={{ color: "#D97706", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#92400E" }}>
            ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining.
            After 3 failed attempts, your account will be locked for 15 minutes.
          </span>
        </div>
      )}

      {/* Form Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E6E4DF",
          borderRadius: 12,
          padding: "28px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) => {
                  setForm((f) => ({ ...f, currentPassword: e.target.value }));
                  setCurrentPasswordError("");
                }}
                placeholder="Enter your current password"
                style={{
                  ...baseInput,
                  borderColor: currentPasswordError ? "#EF4444" : undefined,
                }}
                onFocus={(e) => handleFocus(e, !!currentPasswordError)}
                onBlur={(e) => handleBlur(e, !!currentPasswordError)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={toggleBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#1A1D23";
                  e.currentTarget.style.background = "#F4F3F0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3B4";
                  e.currentTarget.style.background = "none";
                }}
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
            {currentPasswordError && (
              <div style={errorMsg}>
                <span>⚠</span>
                <span>{currentPasswordError}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(to right, transparent, #E6E4DF, transparent)",
              margin: "4px 0 24px",
            }}
          />

          {/* New Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, newPassword: e.target.value }))
                }
                placeholder="Create a new password"
                style={baseInput}
                onFocus={(e) => handleFocus(e, false)}
                onBlur={(e) => handleBlur(e, false)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={toggleBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#1A1D23";
                  e.currentTarget.style.background = "#F4F3F0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3B4";
                  e.currentTarget.style.background = "none";
                }}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
            {/* Strength indicator */}
            {form.newPassword && (
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    marginBottom: "5px",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: "3px",
                        borderRadius: "2px",
                        background:
                          i <= strength.score ? strength.color : "#E6E4DF",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: strength.color,
                    transition: "color 0.3s",
                  }}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Confirm New Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Re-enter your new password"
                style={{
                  ...baseInput,
                  borderColor: confirmMismatch ? "#EF4444" : undefined,
                }}
                onFocus={(e) => handleFocus(e, confirmMismatch)}
                onBlur={(e) => handleBlur(e, confirmMismatch)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={toggleBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#1A1D23";
                  e.currentTarget.style.background = "#F4F3F0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3B4";
                  e.currentTarget.style.background = "none";
                }}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {confirmMismatch && (
              <div style={errorMsg}>
                <span>⚠</span>
                <span>Passwords do not match</span>
              </div>
            )}
            {form.confirmPassword &&
              form.newPassword === form.confirmPassword && (
                <div
                  style={{
                    color: "#16A34A",
                    fontSize: "12px",
                    fontWeight: 500,
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>✓</span>
                  <span>Passwords match</span>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setCurrentPasswordError("");
              }}
              style={{
                padding: "12px 20px",
                background: "transparent",
                color: "#5F6577",
                border: "1.5px solid #E6E4DF",
                borderRadius: 8,
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#b5484b";
                e.currentTarget.style.color = "#b5484b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E6E4DF";
                e.currentTarget.style.color = "#5F6577";
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading
                  ? "#9CA3B4"
                  : "linear-gradient(135deg, #b5484b, #6b3057)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "opacity 0.2s",
                boxShadow: loading
                  ? "none"
                  : "0 4px 14px rgba(181,72,75,0.3)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(181,72,75,0.03), rgba(107,48,87,0.03))",
          border: "1px solid rgba(181,72,75,0.1)",
          borderRadius: 12,
          padding: "20px 24px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background:
                "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.12))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            🛡️
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Security Tips
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 16px",
          }}
        >
          {[
            { icon: "📐", text: "Use at least 6 characters" },
            { icon: "🔤", text: "Mix letters, numbers & symbols" },
            { icon: "🚫", text: "Avoid common words" },
            { icon: "🔒", text: "Never share your password" },
          ].map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#5F6577",
              }}
            >
              <span style={{ fontSize: "12px", opacity: 0.65 }}>
                {tip.icon}
              </span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--color-sub)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  background: "#fafafa",
  borderBottom: "1px solid var(--color-border)",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
};
