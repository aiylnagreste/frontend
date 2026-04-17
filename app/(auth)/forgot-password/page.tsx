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
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            padding: "32px 40px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Forgot Password</h1>
          <p style={{ opacity: 0.85, fontSize: "13px", marginTop: "4px" }}>
            We&apos;ll send a reset link to your email
          </p>
        </div>

        <div style={{ padding: "32px 40px" }}>
          {submitted ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Mail size={24} color="#16a34a" />
              </div>
              <p style={{ color: "#374151", fontSize: 15, margin: "0 0 8px", fontWeight: 600 }}>
                Check your inbox
              </p>
              <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
                The link expires in <strong>5 minutes</strong>.
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#7c3aed",
                  fontSize: 13,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                  role="alert"
                >
                  {error}
                </div>
              )}
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Email Address <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  outline: "none",
                  boxSizing: "border-box" as const,
                  transition: "border-color 0.15s",
                }}
                onFocus={e => { e.target.style.borderColor = "#7c3aed"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: loading ? "#a78bfa" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: "#7c3aed",
                    fontSize: 13,
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
        </div>
      </div>
    </div>
  );
}
