"use client";

import { useState, useEffect, useRef } from "react";

function useCounter(target: number, duration: number = 1200) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function StatCounter({ target, label }: { target: number; label: string }) {
  const val = useCounter(target);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>{val}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{label}</div>
    </div>
  );
}

export default function SuperLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Left visual panel */}
      <div style={{
        flex: 1,
        background: "#111318",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow blobs */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)",
          top: -100, left: -100, pointerEvents: "none",
          animation: "gdDrift 12s ease-in-out infinite alternate",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,145,58,0.10) 0%, transparent 70%)",
          bottom: -80, right: -80, pointerEvents: "none",
          animation: "gdDrift 10s ease-in-out infinite alternate-reverse",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 48px" }}>
          {/* Brand icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg, #0D9488, #E8913A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px",
            fontSize: 28, color: "#fff", fontWeight: 700,
            boxShadow: "0 8px 32px rgba(13,148,136,0.3)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}>G</div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
            GlowDesk
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, maxWidth: 320 }}>
            Centralized management for your salon network. Monitor performance, manage subscriptions, and scale effortlessly.
          </p>

          <div style={{ display: "flex", gap: 40, marginTop: 52, justifyContent: "center" }}>
            <StatCounter target={247} label="Active Salons" />
            <StatCounter target={98} label="Uptime %" />
            <StatCounter target={12} label="This Month" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        width: 480,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 52px",
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1D23", letterSpacing: "-0.02em", marginBottom: 6 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: "#5F6577" }}>Access your super admin dashboard</p>
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", color: "#DC2626",
            padding: "12px 16px", borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
            borderLeft: "3px solid #EF4444",
          }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: "Username", id: "username", type: "text", value: username, set: setUsername, placeholder: "Enter your username" },
            { label: "Password", id: "password", type: "password", value: password, set: setPassword, placeholder: "Enter your password" },
          ].map(f => (
            <div key={f.id} style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 600,
                color: "#5F6577", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
              }}>{f.label}</label>
              <input
                type={f.type}
                required
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                autoComplete={f.id}
                style={{
                  width: "100%", padding: "12px 16px",
                  border: "1.5px solid #E6E4DF", borderRadius: 8,
                  fontSize: 14, color: "#1A1D23", outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#0D9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#E6E4DF";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: loading ? "#9CA3B4" : "linear-gradient(135deg, #0D9488, #0F766E)",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              marginTop: 8,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Login to Dashboard"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3B4", marginTop: 24 }}>
          Secure admin access only · Session managed via HTTP-only cookies
        </p>
      </div>
    </div>
  );
}
