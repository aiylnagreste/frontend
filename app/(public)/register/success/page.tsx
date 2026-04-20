"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const params    = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionId = params.get("session_id");

  return (
    <div style={{
      minHeight:   "100vh",
      background:  "#0F1115",
      display:     "flex",
      alignItems:  "center",
      justifyContent: "center",
      padding:     24,
      fontFamily:  "'DM Sans', sans-serif",
      position:    "relative",
      overflow:    "hidden",
    }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(181,72,75,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 300, height: 300, background: "radial-gradient(ellipse, rgba(201,160,112,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        position:    "relative",
        background:  "linear-gradient(145deg, #1E2330, #181C26)",
        border:      "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding:     "52px 44px",
        maxWidth:    460,
        width:       "100%",
        textAlign:   "center",
        boxShadow:   "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}>

        {/* Success icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width:        72,
            height:       72,
            borderRadius: "50%",
            background:   "rgba(123, 154, 112, 0.12)",
            border:       "1px solid rgba(123, 154, 112, 0.3)",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            boxShadow:    "0 0 30px rgba(123,154,112,0.15)",
          }}>
            <CheckCircle size={34} style={{ color: "#7B9A70" }} />
          </div>
        </div>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #B5484B, #6B3057)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✨</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "rgba(237,232,227,0.6)", letterSpacing: "-0.01em" }}>Salon</span>
        </div>

        <h1 style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      36,
          fontWeight:    500,
          color:         "#EDE8E3",
          letterSpacing: "-0.01em",
          margin:        "0 0 10px",
          lineHeight:    1.1,
        }}>
          Payment Successful
        </h1>

        <p style={{
          fontSize:     14,
          color:        "#8E8A86",
          lineHeight:   1.7,
          margin:       "0 0 32px",
          fontWeight:   300,
        }}>
          Your account is being set up. You'll receive a welcome email with your login credentials shortly.
        </p>

        {/* Email notice */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          background:   "rgba(123, 154, 112, 0.08)",
          border:       "1px solid rgba(123, 154, 112, 0.2)",
          borderRadius: 10,
          padding:      "13px 16px",
          marginBottom: 32,
          textAlign:    "left",
        }}>
          <Mail size={16} style={{ color: "#7B9A70", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#A0C090", fontWeight: 500, lineHeight: 1.4 }}>
            Check your inbox for setup instructions and credentials
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 28 }} />

        {/* What happens next */}
        <div style={{ textAlign: "left", marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#4E4A46", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>What happens next</p>
          {[
            "Credentials emailed to you within 2 minutes",
            "Log in and configure your branches & staff",
            "Share your booking link — go live instantly",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(181,72,75,0.15)", border: "1px solid rgba(181,72,75,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#C9856A", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: "#8E8A86", lineHeight: 1.5, fontWeight: 300 }}>{step}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/login" style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          gap:           8,
          padding:       "13px 28px",
          borderRadius:  10,
          background:    "linear-gradient(135deg, #B5484B, #6B3057)",
          color:         "#F5EDE8",
          textDecoration:"none",
          fontSize:      14,
          fontWeight:    600,
          boxShadow:     "0 4px 20px rgba(181,72,75,0.3)",
          transition:    "opacity 0.2s",
          fontFamily:    "inherit",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
        >
          Go to Login <ArrowRight size={15} />
        </Link>

        <p style={{ fontSize: 11, color: "#3A3830", marginTop: 20 }}>
          Secure admin access · Session managed via HTTP-only cookies
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Space+Grotesk:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>
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