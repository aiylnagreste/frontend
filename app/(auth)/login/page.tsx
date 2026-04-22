"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/salon-admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Invalid email or password.");
      }
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
            <Sparkles size={24} color="#fff" strokeWidth={1.6} />
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
            Salon Admin
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
            Sign in to manage appointments, clients, and business insights.
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
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
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
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
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
                  Signing in…
                </span>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #F3F0EC",
            }}
          >
            <Link
              href="/forgot-password"
              style={{
                color: "#b5484b",
                fontSize: 12,
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#b5484b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#b5484b";
              }}
            >
              Forgot password?
            </Link>
          </div>
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
            Secure & encrypted
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
            Admin access only
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
            Session protected
          </span>
        </div>
      </div>

      {/* Spinner keyframes */}
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