"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
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
        background: "#FBF8F5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
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

      {/* Back link */}
      <Link
        href="/login"
        style={{
          position: "absolute",
          top: 32,
          left: 40,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#A89F96",
          fontSize: 13,
          textDecoration: "none",
          fontWeight: 500,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#b5484b";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#A89F96";
        }}
      >
        <ArrowLeft size={15} />
        Back to login
      </Link>

      {/* Main card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 430,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 8px 32px rgba(181,72,75,0.3)",
            }}
          >
            <KeyRound size={24} color="#fff" strokeWidth={1.6} />
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 600,
              color: "#1A1D23",
              letterSpacing: "-0.01em",
              marginBottom: 10,
            }}
          >
            Forgot Password
          </h1>
          <p
            style={{
              color: "#5F6577",
              fontSize: 14,
              lineHeight: 1.65,
              maxWidth: 300,
              margin: "0 auto",
            }}
          >
            No worries, it happens. Enter your email and we'll send you a
            reset link.
          </p>
        </div>

        {/* Card body */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "36px 32px",
            boxShadow:
              "0 1px 3px rgba(45,42,38,0.04), 0 8px 32px rgba(45,42,38,0.06)",
            border: "1px solid rgba(45,42,38,0.06)",
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 50,
                  background: "#F0FDF4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <ShieldCheck size={24} color="#16a34a" strokeWidth={1.8} />
              </div>

              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1A1D23",
                  marginBottom: 8,
                }}
              >
                Check your inbox
              </p>
              <p
                style={{
                  color: "#5F6577",
                  fontSize: 13,
                  lineHeight: 1.7,
                  marginBottom: 4,
                }}
              >
                If an account exists for
              </p>
              <p
                style={{
                  color: "#b5484b",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  wordBreak: "break-all" as const,
                }}
              >
                {email}
              </p>
              <p
                style={{
                  color: "#5F6577",
                  fontSize: 13,
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                you'll receive a reset link shortly.
              </p>

              <div
                style={{
                  background: "#FDF8F5",
                  border: "1px solid rgba(196,149,106,0.15)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 28,
                }}
              >
                <p
                  style={{
                    color: "#5F6577",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  ⏱ The link expires in{" "}
                  <span style={{ color: "#A07850", fontWeight: 600 }}>
                    5 minutes
                  </span>
                  . Didn't receive it? Check your spam folder or try again.
                </p>
              </div>

              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  padding: "13px 20px",
                  background: "linear-gradient(135deg, #b5484b, #6b3057)",
                  color: "#fff",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "'Inter', sans-serif",
                  transition: "opacity 0.2s",
                  boxShadow: "0 8px 32px rgba(181,72,75,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
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
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "#DC2626",
                    padding: "11px 14px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#EF4444",
                      flexShrink: 0,
                    }}
                  />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5F6577",
                    marginBottom: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    color="#B0A89F"
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="admin@salon.com"
                    autoFocus
                    autoComplete="email"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 40px",
                      border: "1.5px solid #E6E4DF",
                      borderRadius: 12,
                      fontSize: 14,
                      color: "#1A1D23",
                      outline: "none",
                      fontFamily: "'Inter', sans-serif",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#b5484b";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(181,72,75,0.12)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E6E4DF";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  background: loading
                    ? "#9CA3B4"
                    : "linear-gradient(135deg, #b5484b, #6b3057)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "opacity 0.2s",
                  boxShadow: loading
                    ? "none"
                    : "0 8px 32px rgba(181,72,75,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {loading ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                    Sending link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            marginTop: 28,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#9CA3B4",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#4CAF7D",
                display: "inline-block",
              }}
            />
            Encrypted
          </span>
          <span style={{ fontSize: 11, color: "#E5E0DB" }}>·</span>
          <span
            style={{
              fontSize: 11,
              color: "#9CA3B4",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#C4956A",
                display: "inline-block",
              }}
            />
            Link expires in 5 min
          </span>
          <span style={{ fontSize: 11, color: "#E5E0DB" }}>·</span>
          <span
            style={{
              fontSize: 11,
              color: "#9CA3B4",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#8BA4C4",
                display: "inline-block",
              }}
            />
            No email stored
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}