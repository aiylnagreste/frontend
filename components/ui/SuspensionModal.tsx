// components/ui/SuspensionModal.tsx
"use client";

export function SuspensionModal({ salonName }: { salonName?: string }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspension-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 26, 46, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
      // Do NOT add onClick to close — this modal is non-dismissible by design
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "14px",
          padding: "32px 36px",
          maxWidth: "460px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(181, 72, 75, 0.12)",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
          }}
          aria-hidden="true"
        >
          🔒
        </div>
        <h2
          id="suspension-title"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--color-ink)",
            margin: "0 0 10px",
          }}
        >
          Account Suspended
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-sub)", lineHeight: 1.55, margin: "0 0 20px" }}>
          {salonName ? `${salonName}'s account` : "Your salon account"} has been suspended. All actions
          are currently disabled. Please contact support to restore access.
        </p>
        <a
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
        </a>
      </div>
    </div>
  );
}
