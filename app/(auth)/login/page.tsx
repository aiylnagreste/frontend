"use client";

import { useState } from "react";

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
        display: "flex",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Left visual panel */}
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
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #b5484b, #6b3057)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28, color: "#fff", fontWeight: 700, boxShadow: "0 8px 32px rgba(181,72,75,0.3)", fontFamily: "'Space Grotesk', sans-serif" }}>✨</div>

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
            Salon Admin
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 320,
            }}
          >
            Management portal for your salon. Access appointments, client data,
            and business insights.
          </p>
        </div>
      </div>

      {/* Right form panel */}
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
            Sign In
          </h2>
          <p style={{ fontSize: 13, color: "#5F6577" }}>
            Access your salon dashboard
          </p>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
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
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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

          <div style={{ marginBottom: 20 }}>
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
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Login to Dashboard"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a
            href="/forgot-password"
            style={{
              color: "#b5484b",
              fontSize: 12,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Forgot password?
          </a>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#9CA3B4",
            marginTop: 24,
          }}
        >
          Secure admin access only · Session managed via HTTP-only cookies
        </p>
      </div>
    </div>
  );
}