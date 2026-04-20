// app/(super)/super-admin/change-password/page.tsx
"use client";

import { useState, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShieldHalf, Eye, EyeOff, ArrowLeft, Lock, Check, X, Loader2 } from "lucide-react";

const C = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  primary: "#0D9488",
  primaryHover: "#0F766E",
  primaryLight: "#CCFBF1",
  primaryGlow: "rgba(13,148,136,0.12)",
  text: "#1A1D23",
  text2: "#5F6577",
  text3: "#9CA3B4",
  border: "#E6E4DF",
  border2: "#F0EEEA",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  success: "#22C55E",
  successLight: "#F0FDF4",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
};

function getStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: "Weak", color: C.danger, bg: C.dangerLight, width: "20%" };
  if (score <= 2) return { label: "Fair", color: C.warning, bg: C.warningLight, width: "40%" };
  if (score <= 3) return { label: "Good", color: "#EAB308", bg: "#FEFCE8", width: "60%" };
  if (score <= 4) return { label: "Strong", color: "#84CC16", bg: "#F7FEE7", width: "80%" };
  return { label: "Excellent", color: C.success, bg: C.successLight, width: "100%" };
}

const requirements = [
  { test: (p: string) => p.length >= 6, label: "At least 6 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const strength = useMemo(() => getStrength(form.newPassword), [form.newPassword]);
  const passwordsMatch = form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  async function handleSave() {
    if (!form.currentPassword) { toast.error("Please enter your current password"); return; }
    if (form.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.put("/super-admin/api/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed successfully");
      router.push("/super-admin/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string; icon: typeof Lock }> = [
    { key: "currentPassword", label: "Current Password", placeholder: "Enter your current password", icon: Lock },
    { key: "newPassword", label: "New Password", placeholder: "Create a strong password", icon: ShieldHalf },
    { key: "confirmPassword", label: "Confirm New Password", placeholder: "Re-enter your new password", icon: Lock },
  ];

  const toggleVisibility = (key: string) => setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{
      padding: "32px 36px",
      background: C.bg,
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer",
            color: C.text3, fontSize: 13, fontWeight: 500,
            marginBottom: 16, padding: "4px 0",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = C.text2)}
          onMouseLeave={e => (e.currentTarget.style.color = C.text3)}
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.primary}, #0F766E)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px ${C.primaryGlow}`,
          }}>
            <ShieldHalf size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24, fontWeight: 700, color: C.text,
              letterSpacing: "-0.025em", lineHeight: 1.2,
            }}>Change Password</h1>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 2 }}>
              Update your super admin account credentials
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border2}`,
        borderRadius: 16,
        maxWidth: 520,
        boxShadow: "0 1px 3px rgba(26,29,35,0.05), 0 8px 24px rgba(26,29,35,0.04)",
        overflow: "hidden",
      }}>
        {/* Card Header Strip */}
        <div style={{
          padding: "20px 28px",
          borderBottom: `1px solid ${C.border2}`,
          background: `linear-gradient(180deg, ${C.primaryGlow}, transparent)`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Lock size={16} style={{ color: C.primary }} />
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14, fontWeight: 600, color: C.text,
          }}>Security Settings</span>
          <span style={{
            marginLeft: "auto",
            fontSize: 11, fontWeight: 600, color: C.primary,
            background: C.primaryLight, padding: "3px 10px",
            borderRadius: 20, letterSpacing: "0.02em",
          }}>Protected</span>
        </div>

        {/* Form Body */}
        <div style={{ padding: "28px" }}>
          {fields.map((f, idx) => {
            const Icon = f.icon;
            const isFocused = focusedField === f.key;
            const showMatch = f.key === "confirmPassword" && form.confirmPassword.length > 0;

            return (
              <div key={f.key} style={{ marginBottom: idx === 1 ? 12 : 22 }}>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: isFocused ? C.primary : C.text2,
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  marginBottom: 8, transition: "color 0.2s",
                }}>{f.label}</label>

                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    color: isFocused ? C.primary : C.text3,
                    transition: "color 0.2s",
                    display: "flex", alignItems: "center",
                  }}>
                    <Icon size={16} />
                  </div>

                  <input
                    type={visible[f.key] ? "text" : "password"}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    onFocus={() => setFocusedField(f.key)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "12px 44px 12px 42px",
                      border: `1.5px solid ${isFocused ? C.primary : showMatch ? (passwordsMatch ? C.success : C.danger) : C.border}`,
                      borderRadius: 10,
                      fontSize: 14, color: C.text, outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                      background: isFocused ? "#fff" : C.surface,
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxShadow: isFocused
                        ? `0 0 0 3px ${C.primaryGlow}`
                        : showMatch
                          ? passwordsMatch
                            ? "0 0 0 3px rgba(34,197,94,0.1)"
                            : "0 0 0 3px rgba(239,68,68,0.08)"
                          : "none",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => toggleVisibility(f.key)}
                    style={{
                      position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: C.text3, padding: 6, borderRadius: 6,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.text2; e.currentTarget.style.background = C.border2; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.text3; e.currentTarget.style.background = "none"; }}
                  >
                    {visible[f.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  {/* Match indicator */}
                  {showMatch && (
                    <div style={{
                      position: "absolute", right: 38, top: "50%", transform: "translateY(-50%)",
                      display: "flex", alignItems: "center",
                    }}>
                      {passwordsMatch ? (
                        <Check size={14} style={{ color: C.success }} />
                      ) : (
                        <X size={14} style={{ color: C.danger }} />
                      )}
                    </div>
                  )}
                </div>

                {/* Password Strength — only for new password */}
                {f.key === "newPassword" && form.newPassword.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      height: 4, borderRadius: 4, background: C.border2,
                      overflow: "hidden", marginBottom: 8,
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: strength.width,
                        background: strength.color,
                        transition: "width 0.3s ease, background 0.3s ease",
                      }} />
                    </div>

                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      marginBottom: 10,
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: strength.color,
                        letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>{strength.label}</span>
                    </div>

                    {/* Requirements checklist */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: "6px 16px",
                    }}>
                      {requirements.map(r => {
                        const met = r.test(form.newPassword);
                        return (
                          <div key={r.label} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontSize: 11, color: met ? C.success : C.text3,
                            transition: "color 0.2s",
                          }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: "50%",
                              border: `1.5px solid ${met ? C.success : C.border}`,
                              background: met ? C.success : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}>
                              {met && <Check size={8} style={{ color: "#fff" }} strokeWidth={3} />}
                            </div>
                            <span>{r.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mismatch message */}
                {f.key === "confirmPassword" && passwordsMismatch && (
                  <p style={{
                    fontSize: 12, color: C.danger, marginTop: 6,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={12} /> Passwords do not match
                  </p>
                )}
                {f.key === "confirmPassword" && passwordsMatch && (
                  <p style={{
                    fontSize: 12, color: C.success, marginTop: 6,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Check size={12} /> Passwords match
                  </p>
                )}
              </div>
            );
          })}

          {/* Divider */}
          <div style={{
            height: 1, background: C.border2, margin: "24px 0 20px",
          }} />

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: "11px 22px",
                background: C.bg,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 13, fontWeight: 600, color: C.text2,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.border2; e.currentTarget.style.borderColor = C.text3; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 1, padding: "11px 22px",
                background: loading
                  ? "#9CA3B4"
                  : `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryHover} 100%)`,
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : `0 2px 8px ${C.primaryGlow}`,
                transition: "opacity 0.15s, box-shadow 0.15s, transform 0.1s",
                transform: loading ? "none" : undefined,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = `0 4px 16px rgba(13,148,136,0.25)`;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>

          {/* Security note */}
          <p style={{
            fontSize: 11, color: C.text3, marginTop: 16,
            textAlign: "center", lineHeight: 1.5,
          }}>
            Your session will remain active. You'll use the new password on next login.
          </p>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}