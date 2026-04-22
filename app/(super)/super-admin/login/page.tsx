"use client";

import { useState, useEffect, useRef } from "react";
import { User, Lock, Sparkles } from "lucide-react";

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

function StatCounter({
  target,
  label,
}: {
  target: number;
  label: string;
}) {
  const val = useCounter(target);
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 26,
          fontWeight: 700,
          color: "#1A1D23",
        }}
      >
        {val}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#5F6577",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: 3,
        }}
      >
        {label}
      </div>
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

  const fields = [
    {
      label: "Username",
      id: "username",
      type: "text",
      value: username,
      set: setUsername,
      placeholder: "Enter your username",
      icon: <User size={16} color="#B0A89F" />,
    },
    {
      label: "Password",
      id: "password",
      type: "password",
      value: password,
      set: setPassword,
      placeholder: "Enter your password",
      icon: <Lock size={16} color="#B0A89F" />,
    },
  ];

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
            Super Admin
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
            Centralized management for your salon network. Monitor performance
            and scale effortlessly.
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
            {fields.map((f, i) => (
              <div key={f.id} style={{ marginBottom: i === 0 ? 20 : 24 }}>
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
                  {f.label}
                </label>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      display: "flex",
                    }}
                  >
                    {f.icon}
                  </div>
                  <input
                    type={f.type}
                    required
                    value={f.value}
                    onChange={(e) => {
                      f.set(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={f.placeholder}
                    autoComplete={f.id}
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
            ))}

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
            Super admin only
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