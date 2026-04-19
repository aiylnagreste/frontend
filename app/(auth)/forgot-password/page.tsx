"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email"); return; }
    setError("");
    setLoading(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success — don't leak whether email exists
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Left visual panel - matching LoginPage style */}
      <div
        style={{
          flex: 1,
          background: "#111318",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(181,72,75,0.15) 0%, transparent 70%)",
            top: -100,
            left: -100,
            pointerEvents: "none",
            animation: "gdDrift 12s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(107,48,87,0.12) 0%, transparent 70%)",
            bottom: -80,
            right: -80,
            pointerEvents: "none",
            animation: "gdDrift 10s ease-in-out infinite alternate-reverse",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            padding: "40px 48px",
          }}
        >
          {/* Brand icon */}
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: 16, 
            background: "linear-gradient(135deg, #b5484b, #6b3057)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 28px", 
            fontSize: 28, 
            color: "#fff", 
            fontWeight: 700, 
            boxShadow: "0 8px 32px rgba(181,72,75,0.3)", 
            fontFamily: "'Space Grotesk', sans-serif" 
          }}>
            🔑
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Forgot Password
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 320,
            }}
          >
            We'll send a reset link to your email. Secure access for salon administrators.
          </p>
        </div>
      </div>

      {/* Right form panel - matching LoginPage styling */}
      <div
        style={{
          width: 480,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 52px",
        }}
      >
        <div style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              color: "#1A1D23",
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            Reset Password
          </h2>
          <p style={{ fontSize: 13, color: "#5F6577" }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {submitted ? (
          // Success state - matches LoginPage error styling but for success
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "#F0FDF4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Mail size={28} color="#16a34a" />
            </div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#1A1D23",
                marginBottom: 8,
              }}
            >
              Check your inbox
            </p>
            <p style={{ color: "#5F6577", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: "#b5484b" }}>{email}</strong>, 
              you'll receive a reset link shortly.<br />
              The link expires in <strong>5 minutes</strong>.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #b5484b, #6b3057)",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderLeft: "3px solid #EF4444",
                }}
              >
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#5F6577",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                Email Address <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@salon.com"
                autoFocus
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1.5px solid #E6E4DF",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1A1D23",
                  outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#b5484b";
                  e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E6E4DF";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                background: loading
                  ? "#9CA3B4"
                  : "linear-gradient(135deg, #b5484b, #6b3057)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                marginTop: 8,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#b5484b",
                  fontSize: 12,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <ArrowLeft size={13} />
                Back to login
              </Link>
            </div>
          </form>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#9CA3B4",
            marginTop: 24,
          }}
        >
          Secure password recovery · Link expires in 5 minutes
        </p>
      </div>

      {/* Add keyframes animation for glow blobs */}
      <style jsx>{`
        @keyframes gdDrift {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            transform: translate(30px, 20px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}