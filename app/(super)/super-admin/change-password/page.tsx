// app/(super)/super-admin/change-password/page.tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShieldHalf } from "lucide-react";

const C = {
  bg: "#F4F3EF", surface: "#FFFFFF",
  primary: "#0D9488", primaryLight: "#CCFBF1", primaryGlow: "rgba(13,148,136,0.12)",
  text: "#1A1D23", text2: "#5F6577", text3: "#9CA3B4",
  border: "#E6E4DF", border2: "#F0EEEA",
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
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

  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string }> = [
    { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
    { key: "newPassword",     label: "New Password",     placeholder: "Min 6 characters" },
    { key: "confirmPassword", label: "Confirm New Password", placeholder: "Re-enter new password" },
  ];

  return (
    <div style={{ padding: "32px 36px", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Change Password</h1>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>Update your super admin account password</p>
      </div>

      <div style={{
        background: C.surface,
        border: `1px solid ${C.border2}`,
        borderRadius: 12,
        padding: 32,
        maxWidth: 460,
        boxShadow: "0 1px 2px rgba(26,29,35,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldHalf size={16} style={{ color: C.primary }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.text }}>Security Settings</div>
            <div style={{ fontSize: 12, color: C.text3 }}>Update your credentials</div>
          </div>
        </div>

        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{f.label}</label>
            <input
              type="password"
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{
                width: "100%", padding: "11px 14px",
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 14, color: C.text, outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryGlow}`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            />
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 20px", background: C.bg,
              border: `1.5px solid ${C.border}`, borderRadius: 8,
              fontSize: 13, fontWeight: 500, color: C.text2, cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 20px",
              background: loading ? "#9CA3B4" : `linear-gradient(135deg, ${C.primary}, #0F766E)`,
              border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 600, color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >{loading ? "Saving…" : "Update Password"}</button>
        </div>
      </div>
    </div>
  );
}
