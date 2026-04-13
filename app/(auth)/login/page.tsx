"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot-password state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    try {
      await fetch("/salon-admin/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch {
      setResetSent(true); // still show success to avoid leaking info
    } finally {
      setResetLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #b5484b 0%, #6b3057 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #b5484b 0%, #6b3057 100%)",
            color: "#fff",
            padding: "36px 40px 28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>💅</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Salon Admin</h1>
          <p style={{ opacity: 0.85, fontSize: "13px", marginTop: "4px" }}>
            Management Portal
          </p>
        </div>

        {!showForgot ? (
          <form onSubmit={handleSubmit} style={{ padding: "32px 40px" }}>
            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#b5484b")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#b5484b")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{ background: "none", border: "none", color: "#b5484b", fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #b5484b 0%, #6b3057 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>
        ) : (
          <div style={{ padding: "32px 40px" }}>
            {resetSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📬</div>
                <p style={{ fontWeight: 600, marginBottom: "8px" }}>Request sent</p>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
                  Your password reset request has been sent to the administrator. They will set a new password for you.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(""); }}
                  style={{ background: "none", border: "none", color: "#b5484b", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                >
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetRequest}>
                <p style={{ fontWeight: 600, marginBottom: "4px" }}>Reset Password</p>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
                  Enter your email and we&apos;ll notify the administrator to reset your password.
                </p>
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: resetLoading ? "#9ca3af" : "linear-gradient(135deg, #b5484b 0%, #6b3057 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: resetLoading ? "not-allowed" : "pointer",
                    marginBottom: "12px",
                  }}
                >
                  {resetLoading ? "Sending…" : "Send Reset Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  style={{ background: "none", border: "none", color: "#6b7280", fontSize: "12px", cursor: "pointer", display: "block", margin: "0 auto" }}
                >
                  Back to login
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
