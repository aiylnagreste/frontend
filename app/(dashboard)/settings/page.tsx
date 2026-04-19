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

  // Sync corsUrl once data loads
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
  // Keep state in sync once general loads
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Two-column grid for better space utilization */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}>
        
        {/* LEFT COLUMN - Currency and Widget Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Currency Card */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
            }}
          >
            <h4 style={{ fontWeight: 600, marginBottom: "4px" }}>💱 Currency</h4>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-sub)",
                marginBottom: "16px",
              }}
            >
              Shown before all prices in the panel and bot replies.
            </p>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Currency Symbol / Prefix
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "13px",
                background: "var(--color-surface)",
                marginBottom: "20px",
              }}
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
              style={primaryBtn}
            >
              {saveMutation.isPending ? "Saving…" : "Save Settings"}
            </button>
          </div>

         

          {/* Widget Customization Card */}
          {showCorsCard && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
            }}
          >
            <h4 style={{ fontWeight: 600, marginBottom: "4px" }}>🎨 Widget Appearance</h4>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-sub)",
                marginBottom: "20px",
              }}
            >
              Customize how your chat widget looks.
            </p>

            <label style={{ fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "4px", color: "var(--color-sub)" }}>
              Display Name
            </label>
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder={general?.owner_name ?? "e.g. Glamour Studio"}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "13px",
                background: "var(--color-surface)",
                marginBottom: "16px",
                boxSizing: "border-box"
              }}
            />

            <label style={{ fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px", color: "var(--color-sub)" }}>
              Widget Color
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  width: "40px",
                  height: "34px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  padding: "2px",
                  flexShrink: 0
                }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  width: "100px",
                  padding: "7px 10px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  background: "var(--color-surface)"
                }}
              />
              {colorPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  title={c}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: c,
                    border: primaryColor === c ? "2px solid var(--color-text)" : "2px solid var(--color-border)",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={primaryBtn}
            >
              {saveMutation.isPending ? "Saving…" : "Save Widget Settings"}
            </button>
          </div>
          )}


           {/* Website & CORS Card */}
        {showCorsCard && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
            }}
          >
            <h4 style={{ fontWeight: 600, marginBottom: "4px" }}>🌐 Website &amp; CORS</h4>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-sub)",
                marginBottom: "16px",
              }}
            >
              Add your website&apos;s URL so the chat widget and voice call can work on your site. This URL will be used for CORS.
            </p>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                display: "block",
                marginBottom: "6px",
                color: "var(--color-ink)",
              }}
            >
              Your Website URL
            </label>
            <input
              type="url"
              value={corsUrl}
              onChange={(e) => setCorsUrl(e.target.value)}
              placeholder="https://yoursalon.com"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "13px",
                background: "var(--color-surface)",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => corsOriginMutation.mutate()}
              disabled={corsOriginMutation.isPending}
              style={primaryBtn}
            >
              {corsOriginMutation.isPending ? "Saving…" : "Save Website URL"}
            </button>
          </div>
          )}
        </div>

        {/* RIGHT COLUMN - Preview and Embed Code */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Live Preview Card */}
        {showCorsCard && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
            }}
          >
            <h4 style={{ fontWeight: 600, marginBottom: "4px" }}>👁️ Live Preview</h4>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-sub)",
                marginBottom: "20px",
              }}
            >
              This is how your widget will appear on your website.
            </p>

            <div style={{ 
              background: "#f1f5f9", 
              border: "1px solid var(--color-border)", 
              borderRadius: "12px", 
              padding: "16px 16px 60px", 
              position: "relative", 
              minHeight: "180px" 
            }}>
              <p style={{ fontSize: "11px", color: "var(--color-sub)", margin: 0 }}>Website preview</p>
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
                  border: "1px solid #e2e8f0", 
                  borderRadius: "12px", 
                  width: "210px", 
                  overflow: "hidden", 
                  boxShadow: "0 4px 16px rgba(0,0,0,.12)" 
                }}>
                  <div style={{ 
                    background: primaryColor, 
                    color: "#fff", 
                    padding: "10px 12px", 
                    fontSize: "12px", 
                    fontWeight: 600, 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <span>{previewName}</span>
                    <span style={{ opacity: 0.7, cursor: "default", fontSize: "14px" }}>✕</span>
                  </div>
                  <div style={{ padding: "10px 12px", fontSize: "11px", color: "#555" }}>
                    Hi! How can I help you today? 👋
                  </div>
                </div>
                <div style={{ 
                  width: "44px", 
                  height: "44px", 
                  borderRadius: "50%", 
                  background: primaryColor, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "20px", 
                  boxShadow: "0 4px 12px rgba(0,0,0,.2)", 
                  cursor: "default" 
                }}>
                  💬
                </div>
              </div>
            </div>
          </div>
          )}
          {/* Embed Code Card */}
          {showCorsCard && (
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
            }}
          >
            <h4 style={{ fontWeight: 600, marginBottom: "4px" }}>📋 Embed on Your Website</h4>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-sub)",
                marginBottom: "16px",
              }}
            >
              Copy and paste this code just before the closing <code style={inlineCode}>&lt;/body&gt;</code> tag.
            </p>

            {/* Widget URL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px", color: "var(--color-sub)" }}>
                Widget URL
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f8fafc",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              >
                <code
                  style={{
                    fontSize: "11px",
                    color: "#6366f1",
                    wordBreak: "break-all",
                    flex: 1,
                  }}
                >
                  {widgetUrl}
                </code>
                <button
                  onClick={copyWidgetUrl}
                  style={{
                    padding: "4px 12px",
                    background: copiedUrl ? "#22c55e" : "#64748b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copiedUrl ? "Copied!" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "var(--color-sub)", marginTop: "6px" }}>
                Your Tenant ID: <strong style={{ color: "var(--color-text)" }}>{tenantId}</strong>
              </p>
            </div>

            {/* Script Tag */}
            <label style={{ fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px", color: "var(--color-sub)" }}>
              Embed Script Tag
            </label>
            <div style={{ 
              position: "relative", 
              background: "#1e1e2e", 
              borderRadius: "8px", 
              padding: "14px 16px",
              marginBottom: "16px",
            }}>
              <pre style={{ 
                fontSize: "11px", 
                color: "#a6e3a1", 
                wordBreak: "break-all", 
                margin: 0, 
                paddingRight: "70px", 
                whiteSpace: "pre-wrap", 
                fontFamily: "monospace" 
              }}>
                {scriptTag}
              </pre>
              <button 
                onClick={copyScript}
                style={{ 
                  position: "absolute", 
                  top: "10px", 
                  right: "10px", 
                  padding: "4px 12px", 
                  background: copied ? "#22c55e" : "#667eea", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: "6px", 
                  fontSize: "11px", 
                  fontWeight: 600, 
                  cursor: "pointer" 
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* WordPress Note */}
            <div
              style={{
                background: "#fef9c3",
                border: "1px solid #fde047",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#854d0e", margin: 0 }}>
                <strong>WordPress?</strong> Use the included plugin instead —
                install{" "}
                <code style={{ ...inlineCode, background: "#fde04766" }}>
                  wp-plugin/salon-bot-widget.php
                </code>{" "}
                and set your bot server URL in the plugin settings.
              </p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inlineCode: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "11px",
  background: "#f1f5f9",
  padding: "1px 5px",
  borderRadius: "4px",
  color: "#475569",
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

  return (
    <>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h4 style={{ fontWeight: 600 }}>Branch Management</h4>
          <button style={primaryBtn} onClick={openAdd}>
            + Add Branch
          </button>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "20px" }}>
              <Skeleton style={{ height: "44px" }} />
            </div>
          ) : branches.length === 0 ? (
            <EmptyState icon="🏪" title="No branches yet" />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Address</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Map Link</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr
                    key={b.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={tdStyle}>#{b.number}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{b.name}</td>
                    <td style={tdStyle}>{b.address || "—"}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "monospace",
                        fontSize: "12px",
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
                          style={{ color: "var(--color-rose)" }}
                        >
                          View Map ↗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={outlineBtn} onClick={() => openEdit(b)}>
                          Edit
                        </button>
                        <button
                          style={{
                            ...outlineBtn,
                            color: "var(--color-danger)",
                            borderColor: "var(--color-danger)",
                          }}
                          onClick={() => deleteMutation.mutate(b.id)}
                          disabled={deleteMutation.isPending}
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

      {/* Drawer rendered OUTSIDE the main div structure */}
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

  return (
    <>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h4 style={{ fontWeight: 600 }}>Staff Management</h4>
          <button style={primaryBtn} onClick={openAdd}>
            + Add Staff
          </button>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "20px" }}>
              <Skeleton style={{ height: "44px" }} />
            </div>
          ) : staff.length === 0 ? (
            <EmptyState icon="👥" title="No staff yet" />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  {["Name", "Phone", "Role", "Branch", "Status", "Actions"].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{s.name}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    >
                      {s.phone}
                    </td>
                    <td style={tdStyle}>
                      <Badge status="pending" label={s.role} />
                    </td>
                    <td style={tdStyle}>{s.branch_name ?? "—"}</td>
                    <td style={tdStyle}>
                      <Badge status={s.status} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={outlineBtn} onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button
                          style={{
                            ...outlineBtn,
                            color: "var(--color-danger)",
                            borderColor: "var(--color-danger)",
                          }}
                          onClick={() => deleteMutation.mutate(s.id)}
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

  return (
    <>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h4 style={{ fontWeight: 600 }}>Staff Roles</h4>
          <button style={primaryBtn} onClick={() => setDrawerOpen(true)}>
            + Add Role
          </button>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            maxWidth: "480px",
          }}
        >
          {isLoading ? (
            <div style={{ padding: "20px" }}>
              <Skeleton style={{ height: "44px" }} />
            </div>
          ) : roles.length === 0 ? (
            <EmptyState icon="🏷️" title="No roles yet" />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  {["Role Name", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{r.name}</td>
                    <td style={tdStyle}>
                      <button
                        style={{
                          ...outlineBtn,
                          color: "var(--color-danger)",
                          borderColor: "var(--color-danger)",
                        }}
                        onClick={() => deleteMutation.mutate(r.id)}
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

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "24px",
        maxWidth: "480px",
      }}
    >
      <h4 style={{ fontWeight: 600, marginBottom: "20px" }}>
        🕐 Salon Operating Hours
      </h4>

      <div style={{ marginBottom: "20px" }}>
        <h5 style={{ fontWeight: 600, marginBottom: "12px" }}>
          🗓️ Workdays (Mon – Fri)
        </h5>
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

      <div style={{ marginBottom: "24px" }}>
        <h5 style={{ fontWeight: 600, marginBottom: "12px" }}>
          🏖️ Weekends (Sat – Sun)
        </h5>
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

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        style={primaryBtn}
      >
        Save Hours
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
  return (
    <div>
      <label
        style={{
          fontSize: "12px",
          fontWeight: 500,
          display: "block",
          marginBottom: "4px",
          color: "var(--color-sub)",
        }}
      >
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          fontSize: "13px",
          background: "var(--color-surface)",
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
function AccountTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setCurrentPasswordError("");
    } catch (e: unknown) {
      if (e instanceof Error && e.message.toLowerCase().includes("current password")) {
        setCurrentPasswordError("Current password is incorrect");
      } else {
        toast.error(e instanceof Error ? e.message : "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
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
