"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Suspense } from "react";

const C = {
  bg: "#F4F3EF", surface: "#FFFFFF",
  primary: "#0D9488", primaryLight: "#CCFBF1",
  text: "#1A1D23", text2: "#5F6577", text3: "#9CA3B4",
  border2: "#F0EEEA",
  success: "#10B981", successBg: "#ECFDF5",
};

function SuccessContent() {
  const params = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionId = params.get("session_id");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 20, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.successBg, border: `2px solid #A7F3D0`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={34} style={{ color: C.success }} />
          </div>
        </div>

        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
          Payment Successful
        </h1>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: "0 0 28px" }}>
          Your account is being set up. You&apos;ll receive a welcome email with your login credentials shortly.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.primaryLight, border: `1px solid #99F6E4`, borderRadius: 10, padding: "12px 16px", marginBottom: 28, textAlign: "left" }}>
          <Mail size={16} style={{ color: C.primary, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.primary, fontWeight: 500 }}>Check your inbox for setup instructions</span>
        </div>

        <a
          href="/login"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 24px", fontSize: 14, fontWeight: 700, borderRadius: 10,
            background: C.primary, color: "#fff", textDecoration: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Go to Login <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
