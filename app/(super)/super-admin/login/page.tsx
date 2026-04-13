"use client";

import { useState } from "react";

export default function SuperLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.href = "/super-admin/dashboard";
      } else {
        setError("Invalid username or password.");
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
            padding: "36px 40px 28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🔐</div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Super Admin</h1>
          <p style={{ opacity: 0.85, fontSize: "13px", marginTop: "4px" }}>
            Salon Management Platform
          </p>
        </div>

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

          {[
            { id: "username", label: "Username", value: username, set: setUsername, type: "text" },
            { id: "password", label: "Password", value: password, set: setPassword, type: "password" },
          ].map((f) => (
            <div key={f.id} style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                {f.label}
              </label>
              <input
                type={f.type}
                required
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", outline: "none" }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Login to Dashboard"}
          </button>

          <p style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af", marginTop: "16px" }}>
            Secure Admin Access Only
          </p>
        </form>
      </div>
    </div>
  );
}
