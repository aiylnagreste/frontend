// app/super-admin/integrations/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

import {
  MessageCircle,
  Camera,
  Share2,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  Save,
  X,
  Link2,
  Trash2,
  AlertTriangle,
  Search,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  fetchIntegrationsSalons,
  fetchIntegrationConfig,
  saveIntegrationConfig,
  deleteIntegrationChannel,
  type SalonIntegration,
  type WebhookConfigDetail,
} from "@/lib/queries";

export default function SuperIntegrationsPage() {
  const [selectedAdmin, setSelectedAdmin] = useState<SalonIntegration | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: admins, isLoading } = useQuery({
    queryKey: ["super-integrations", "admins"],
    queryFn: async () => {
      const data = await fetchIntegrationsSalons();
      return data.filter(
        (admin: SalonIntegration) =>
          admin.plan_features?.whatsapp ||
          admin.plan_features?.instagram ||
          admin.plan_features?.facebook
      );
    },
  });

  const filteredAdmins = admins?.filter((admin: SalonIntegration) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      admin.salon_name?.toLowerCase().includes(searchLower) ||
      admin.owner_name?.toLowerCase().includes(searchLower) ||
      admin.tenant_id?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div style={{ padding: "28px 36px", background: "#F4F3EF", minHeight: "100vh" }}>
        <Skeleton style={{ height: 40, width: "25%", marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 24 }}>
          <Skeleton style={{ width: 360, height: 500 }} />
          <Skeleton style={{ flex: 1, height: 500 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 36px", background: "#F4F3EF", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(181,72,75,0.25)",
            }}
          >
            <Settings size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1A1D23",
                letterSpacing: "-0.025em",
                margin: 0,
              }}
            >
              Salon Integrations
            </h1>
            <p style={{ fontSize: 14, color: "#5F6577", marginTop: 2 }}>
              Manage social media integrations for all salons
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Left Panel - Salon List */}
        <div
          style={{
            width: 360,
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            flexShrink: 0,
          }}
        >
          {/* Search Header */}
          <div style={{ padding: "20px", borderBottom: "1px solid #E6E4DF" }}>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3B4",
                }}
              />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  border: "1.5px solid #E6E4DF",
                  borderRadius: 10,
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#b5484b")}
                onBlur={(e) => (e.target.style.borderColor = "#E6E4DF")}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#5F6577" }}>
                <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                {filteredAdmins?.length || 0} salon{filteredAdmins?.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 11, color: "#9CA3B4" }}>
                {admins?.filter((a: SalonIntegration) => 
                  a.has_whatsapp || a.has_instagram || a.has_facebook
                ).length || 0} configured
              </span>
            </div>
          </div>

          {/* Admin List */}
          <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
            {!filteredAdmins?.length ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <AlertCircle size={32} style={{ color: "#9CA3B4", marginBottom: 12 }} />
                <p style={{ color: "#9CA3B4", fontSize: 13 }}>No salons found</p>
              </div>
            ) : (
              filteredAdmins.map((admin: SalonIntegration, index: number) => {
                const uniqueKey = admin.tenant_id || `admin-${index}`;
                const isSelected = selectedAdmin?.tenant_id === admin.tenant_id;
                const connectedCount = [
                  admin.has_whatsapp,
                  admin.has_instagram,
                  admin.has_facebook,
                ].filter(Boolean).length;
                const totalCount = [
                  admin.plan_features?.whatsapp,
                  admin.plan_features?.instagram,
                  admin.plan_features?.facebook,
                ].filter(Boolean).length;
                const allConfigured = connectedCount === totalCount && totalCount > 0;
                const hasSomeConfigured = connectedCount > 0;

                return (
                  <button
                    key={uniqueKey}
                    onClick={() => setSelectedAdmin(admin)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid #F0EEEA",
                      background: isSelected ? "rgba(181,72,75,0.08)" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#FAFAF8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#fff";
                      }
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: "linear-gradient(135deg, #b5484b, #6b3057)",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: isSelected ? "#b5484b" : "#1A1D23",
                            fontSize: 14,
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {admin.owner_name || admin.salon_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: isSelected ? "#b5484b" : "#9CA3B4",
                            fontFamily: "monospace",
                            background: isSelected ? "rgba(181,72,75,0.08)" : "#F8F8F6",
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}
                        >
                          {admin.tenant_id}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {totalCount > 0 && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              borderRadius: 20,
                              background: allConfigured ? "#DCFCE7" : hasSomeConfigured ? "#FEF3C7" : "#F3F4F6",
                            }}
                          >
                            {allConfigured ? (
                              <CheckCircle size={10} color="#166534" />
                            ) : hasSomeConfigured ? (
                              <AlertCircle size={10} color="#92400E" />
                            ) : (
                              <XCircle size={10} color="#9CA3B4" />
                            )}
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: allConfigured ? "#166534" : hasSomeConfigured ? "#92400E" : "#9CA3B4",
                              }}
                            >
                              {connectedCount}/{totalCount}
                            </span>
                          </div>
                        )}
                        <ChevronRight
                          size={16}
                          style={{ 
                            color: isSelected ? "#b5484b" : "#C8C6C1", 
                            flexShrink: 0,
                            transition: "transform 0.2s, color 0.2s",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {admin.plan_features?.whatsapp && (
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 4, 
                          opacity: admin.has_whatsapp ? 1 : 0.4,
                          transition: "opacity 0.2s",
                        }}>
                          <MessageCircle size={12} color={admin.has_whatsapp ? "#25D366" : "#9CA3B4"} />
                          <span style={{ fontSize: 10, color: admin.has_whatsapp ? "#166534" : "#9CA3B4" }}>WA</span>
                        </div>
                      )}
                      {admin.plan_features?.instagram && (
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 4, 
                          opacity: admin.has_instagram ? 1 : 0.4,
                          transition: "opacity 0.2s",
                        }}>
                          <Camera size={12} color={admin.has_instagram ? "#E4405F" : "#9CA3B4"} />
                          <span style={{ fontSize: 10, color: admin.has_instagram ? "#9D174D" : "#9CA3B4" }}>IG</span>
                        </div>
                      )}
                      {admin.plan_features?.facebook && (
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 4, 
                          opacity: admin.has_facebook ? 1 : 0.4,
                          transition: "opacity 0.2s",
                        }}>
                          <Share2 size={12} color={admin.has_facebook ? "#1877F2" : "#9CA3B4"} />
                          <span style={{ fontSize: 10, color: admin.has_facebook ? "#1E40AF" : "#9CA3B4" }}>FB</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Integration Config */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            minHeight: 500,
          }}
        >
          {!selectedAdmin ? (
            <div
              style={{
                padding: 80,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  background: "#F8F8F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Link2 size={40} style={{ color: "#C8C6C1" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1D23", marginBottom: 8 }}>Select a Salon</h3>
              <p style={{ color: "#9CA3B4", fontSize: 13, maxWidth: 280 }}>
                Choose a salon from the list to view and manage their integration settings
              </p>
            </div>
          ) : (
            <IntegrationPanel key={selectedAdmin.salon_id} admin={selectedAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Integration Panel ────────────────────────────────────────────────────

function IntegrationPanel({ admin }: { admin: SalonIntegration }) {
  const qc = useQueryClient();
  const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "";

  const { data: config, isLoading } = useQuery({
    queryKey: ["super-integrations", "config", admin.tenant_id],
    queryFn: () => fetchIntegrationConfig(admin.salon_id),
    enabled: !!admin.salon_id,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, string>) => saveIntegrationConfig(admin.salon_id, payload),
    onSuccess: () => {
      toast.success("Integration saved successfully");
      qc.invalidateQueries({ queryKey: ["super-integrations", "config", admin.tenant_id] });
      qc.invalidateQueries({ queryKey: ["super-integrations", "admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (channel: string) => deleteIntegrationChannel(admin.salon_id, channel),
    onSuccess: (_, channel) => {
      toast.success(`${channel} integration removed`);
      qc.invalidateQueries({ queryKey: ["super-integrations", "config", admin.tenant_id] });
      qc.invalidateQueries({ queryKey: ["super-integrations", "admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <RefreshCw size={24} style={{ color: "#9CA3B4", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const defaultConfig: WebhookConfigDetail = {
    whatsapp_phone_number_id: null,
    whatsapp_access_token: null,
    instagram_access_token: null,
    facebook_access_token: null,
  };

  const currentConfig = config || defaultConfig;

  return (
    <div>
      <div
        style={{
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(181,72,75,0.04) 0%, rgba(107,48,87,0.02) 100%)",
          borderBottom: "1px solid #E6E4DF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(181,72,75,0.2)",
            }}
          >
            {(admin.salon_name || admin.owner_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#1A1D23",
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {admin.salon_name || admin.owner_name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "#5F6577",
                  fontFamily: "monospace",
                  background: "#F8F8F6",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {admin.tenant_id}
              </span>
              {admin.owner_name && admin.salon_name && admin.owner_name !== admin.salon_name && (
                <>
                  <span style={{ fontSize: 12, color: "#9CA3B4" }}>·</span>
                  <span style={{ fontSize: 12, color: "#5F6577" }}>Owner: {admin.owner_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* WhatsApp */}
        {admin.plan_features?.whatsapp && (
          <ChannelSection
            icon={<MessageCircle size={20} color="#25D366" />}
            title="WhatsApp Business"
            color="#25D366"
            channelName="whatsapp"
            webhookUrl={`${backendOrigin}/webhooks/${admin.tenant_id}/whatsapp`}
            isConfigured={admin.has_whatsapp}
            fields={[
              {
                key: "wa_phone_number_id",
                label: "Phone Number ID",
                value: currentConfig.whatsapp_phone_number_id,
                placeholder: "Enter Phone Number ID from Meta",
              },
              {
                key: "wa_access_token",
                label: "Access Token",
                value: currentConfig.whatsapp_access_token,
                placeholder: "Enter Access Token",
                isSecret: true,
              },
              {
                key: "wa_verify_token",
                label: "Verify Token",
                value: null,
                placeholder: "Enter Verify Token (must match Meta console)",
              },
            ]}
            onSave={saveMutation.mutate}
            isSaving={saveMutation.isPending}
            onDelete={() => deleteMutation.mutate("whatsapp")}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {/* Instagram */}
        {admin.plan_features?.instagram && (
          <ChannelSection
            icon={<Camera size={20} color="#E4405F" />}
            title="Instagram"
            color="#E4405F"
            channelName="instagram"
            webhookUrl={`${backendOrigin}/webhooks/${admin.tenant_id}/instagram`}
            isConfigured={admin.has_instagram}
            fields={[
              {
                key: "ig_page_access_token",
                label: "Page Access Token",
                value: currentConfig.instagram_access_token,
                placeholder: "Enter Page Access Token",
                isSecret: true,
              },
              {
                key: "ig_verify_token",
                label: "Verify Token",
                value: null,
                placeholder: "Enter Verify Token (must match Meta console)",
              },
            ]}
            onSave={saveMutation.mutate}
            isSaving={saveMutation.isPending}
            onDelete={() => deleteMutation.mutate("instagram")}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {/* Facebook */}
        {admin.plan_features?.facebook && (
          <ChannelSection
            icon={<Share2 size={20} color="#1877F2" />}
            title="Facebook Messenger"
            color="#1877F2"
            channelName="facebook"
            webhookUrl={`${backendOrigin}/webhooks/${admin.tenant_id}/facebook`}
            isConfigured={admin.has_facebook}
            fields={[
              {
                key: "fb_page_access_token",
                label: "Page Access Token",
                value: currentConfig.facebook_access_token,
                placeholder: "Enter Page Access Token",
                isSecret: true,
              },
              {
                key: "fb_verify_token",
                label: "Verify Token",
                value: null,
                placeholder: "Enter Verify Token (must match Meta console)",
              },
            ]}
            onSave={saveMutation.mutate}
            isSaving={saveMutation.isPending}
            onDelete={() => deleteMutation.mutate("facebook")}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// ─── Channel Section ──────────────────────────────────────────────────────

interface FieldConfig {
  key: string;
  label: string;
  value: string | null;
  placeholder: string;
  isSecret?: boolean;
}

function ChannelSection({
  icon,
  title,
  color,
  channelName,
  webhookUrl,
  isConfigured,
  fields,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  channelName: string;
  webhookUrl: string;
  isConfigured: boolean;
  fields: FieldConfig[];
  onSave: (payload: Record<string, string>) => void;
  isSaving: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleEdit = () => {
    setValues({});
    setIsEditing(true);
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    setValues({});
    setIsEditing(false);
    setShowDeleteConfirm(false);
  };

  const handleSave = () => {
    onSave(values);
    setValues({});
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        border: `1px solid ${isConfigured ? "#D1FAE5" : "#E6E4DF"}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #E6E4DF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isConfigured ? "#F0FDF4" : "#FAFAF8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1A1D23" }}>{title}</span>
        </div>
        <Badge status={isConfigured ? "active" : "inactive"} label={isConfigured ? "Connected" : "Not configured"} />
      </div>

      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#9CA3B4",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Webhook URL
          </label>
          <WebhookUrlBox url={webhookUrl} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {fields.map((field) => (
            <div key={field.key}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9CA3B4",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {field.label}
              </label>
              {isEditing ? (
                <input
                  type={field.isSecret ? "password" : "text"}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #E6E4DF",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: "#fff",
                    boxSizing: "border-box",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = color)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E6E4DF")}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: isConfigured && field.value ? "#F0FDF4" : "#F8F8F6",
                    border: `1px solid ${isConfigured && field.value ? "#BBF7D0" : "#E6E4DF"}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: isConfigured && field.value ? "#166534" : "#9CA3B4",
                    fontFamily: field.isSecret ? "monospace" : "inherit",
                  }}
                >
                  {field.isSecret && field.value ? "••••••••••••••••" : field.value || "Not configured"}
                </div>
              )}
            </div>
          ))}
        </div>

        {isEditing && isConfigured && (
          <div
            style={{
              padding: "12px 16px",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 8,
              fontSize: 12,
              color: "#92400E",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            💡 Leave fields blank to keep existing values. Only filled fields will be updated.
          </div>
        )}

        {showDeleteConfirm && (
          <div
            style={{
              padding: "16px",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertTriangle size={18} style={{ color: "#DC2626", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", marginBottom: 2 }}>Remove {title} integration?</div>
              <div style={{ fontSize: 12, color: "#B91C1C" }}>This will disconnect {title} and delete all stored credentials.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "6px 14px",
                  background: "#fff",
                  color: "#5F6577",
                  border: "1px solid #E6E4DF",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: "6px 14px",
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 8 }}>
          {isConfigured && !isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "8px 16px",
                background: "#fff",
                color: "#DC2626",
                border: "1px solid #FECACA",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
          {(!isConfigured || isEditing) && <div />}

          {isEditing ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "8px 18px",
                  background: "#fff",
                  color: "#5F6577",
                  border: "1px solid #E6E4DF",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "8px 18px",
                  background: isSaving ? "#9CA3B4" : `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              style={{
                padding: "8px 18px",
                background: "#fff",
                color: "#1A1D23",
                border: "1px solid #E6E4DF",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E6E4DF";
                e.currentTarget.style.color = "#1A1D23";
              }}
            >
              {isConfigured ? "Update Credentials" : "Configure Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Webhook URL Box ──────────────────────────────────────────────────────

function WebhookUrlBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Webhook URL copied");
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div
        style={{
          flex: 1,
          padding: "10px 14px",
          background: "#fff",
          border: "1px solid #E6E4DF",
          borderRadius: 8,
          fontSize: 12,
          fontFamily: "monospace",
          color: "#b5484b",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {url}
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: "8px 16px",
          background: copied ? "#16a34a" : "#F8F8F6",
          color: copied ? "#fff" : "#5F6577",
          border: `1px solid ${copied ? "#16a34a" : "#E6E4DF"}`,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}