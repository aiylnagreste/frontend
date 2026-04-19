// components/ui/SuspensionModal.tsx
"use client";

import { ShieldOff } from "lucide-react";

export function SuspensionModal({ salonName }: { salonName?: string }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspension-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17, 19, 24, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #E6E4DF",
          borderRadius: "16px",
          padding: "40px 36px 32px",
          maxWidth: "420px",
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(181,72,75,0.15)",
          }}
          aria-hidden="true"
        >
          <ShieldOff size={28} color="#b5484b" strokeWidth={1.8} />
        </div>
        <h2
          id="suspension-title"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#1A1D23",
            margin: "0 0 10px",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Account Suspended
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "#5F6577",
            lineHeight: 1.65,
            margin: "0 0 24px",
          }}
        >
          {salonName
            ? `${salonName}'s account has been suspended.`
            : "Your salon account has been suspended."}{" "}
          All actions are currently disabled. Please contact support to restore
          access.
        </p>
        {/* <a
          href="mailto:support@glowdesk.app"
          style={{
            display: "inline-block",
            padding: "10px 22px",
            background: "var(--color-rose)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Contact Support
        </a> */}
        <div
          style={{
            padding: "12px 16px",
            background: "#F8F8F6",
            borderRadius: "8px",
            border: "1px solid #E6E4DF",
            fontSize: "12px",
            color: "#5F6577",
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, color: "#1A1D23" }}>Need help?</span>{" "}
          Reach out to your account manager or email our support team for
          next steps.
        </div>
      </div>
    </div>
  );
}