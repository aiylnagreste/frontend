"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionId = params.get("session_id");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FBF8F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft decorative blobs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(181,72,75,0.08) 0%, transparent 70%)",
          top: "-15%",
          right: "-10%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(196,149,106,0.06) 0%, transparent 70%)",
          bottom: "-10%",
          left: "-8%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(181,72,75,0.05) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          background: "#FFFFFF",
          border: "1px solid rgba(45,42,38,0.06)",
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
          boxShadow:
            "0 1px 3px rgba(45,42,38,0.04), 0 8px 32px rgba(45,42,38,0.06)",
        }}
      >
        {/* Success icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "#F0FDF4",
              border: "1px solid rgba(22,163,74,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle size={34} style={{ color: "#16a34a" }} />
          </div>
        </div>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            ✨
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#5F6577",
              letterSpacing: "-0.01em",
            }}
          >
            Salon
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 32,
            fontWeight: 600,
            color: "#1A1D23",
            letterSpacing: "-0.01em",
            margin: "0 0 10px",
            lineHeight: 1.2,
          }}
        >
          Payment Successful
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#5F6577",
            lineHeight: 1.7,
            margin: "0 0 28px",
            fontWeight: 400,
          }}
        >
          Your account is being set up. You'll receive a welcome email with
          your login credentials shortly.
        </p>

        {/* Email notice */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F0FDF4",
            border: "1px solid rgba(22,163,74,0.12)",
            borderRadius: 12,
            padding: "13px 16px",
            marginBottom: 28,
            textAlign: "left",
          }}
        >
          <Mail size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13,
              color: "#5F6577",
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            Check your inbox for setup instructions and credentials
          </span>
        </div>

        {/* Divider */}
        <div
          style={{ height: 1, background: "#F3F0EC", marginBottom: 28 }}
        />

        {/* What happens next */}
        <div style={{ textAlign: "left", marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#5F6577",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 14,
            }}
          >
            What happens next
          </p>
          {[
            "Credentials emailed to you within 2 minutes",
            "Log in and configure your branches & staff",
            "Share your booking link — go live instantly",
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "rgba(181,72,75,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#b5484b",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "#5F6577",
                  lineHeight: 1.5,
                  fontWeight: 400,
                }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "13px 24px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(181,72,75,0.3)",
            transition: "opacity 0.2s",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            (
              e.currentTarget as HTMLAnchorElement
            ).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
          }}
        >
          Go to Login <ArrowRight size={15} />
        </Link>

        <p style={{ fontSize: 11, color: "#9CA3B4", marginTop: 20 }}>
          Secure admin access · Session managed via HTTP-only cookies
        </p>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#FBF8F5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9CA3B4",
            fontSize: 13,
            padding: 40,
          }}
        >
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}