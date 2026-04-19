"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, ArrowLeft, Shield } from "lucide-react";

function getStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: "Weak", color: "#DC2626", bg: "#FEE2E2", width: "33%" };
  if (score <= 4) return { label: "Fair", color: "#D97706", bg: "#FEF3C7", width: "66%" };
  return { label: "Strong", color: "#16a34a", bg: "#F0FDF4", width: "100%" };
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: met ? "#16a34a" : "#9CA3B4", transition: "color 0.2s" }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", border: met ? "none" : "1.5px solid #D1D5DB", background: met ? "#16a34a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", flexShrink: 0, transition: "all 0.2s" }}>
        {met && "✓"}
      </span>
      <span>{text}</span>
    </div>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = password ? getStrength(password) : null;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;

  if (!token) {
    return (
      <div style={{ padding: "60px 52px" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <span style={{ fontSize: 28 }}>⚠</span>
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
            Invalid Reset Link
          </p>
          <p style={{ color: "#5F6577", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            This password reset link is missing or corrupted. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
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
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasMinLength) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed. The link may have expired.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 8,
    fontSize: 14,
    color: "#1A1D23",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#b5484b";
    e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.12)";
  };

  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E6E4DF";
    e.target.style.boxShadow = "none";
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
  };

  return (
    <div style={{ padding: "60px 52px" }}>
      {success ? (
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
            <CheckCircle size={28} color="#16a34a" />
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
            Password Updated
          </p>
          <p style={{ color: "#5F6577", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Your password has been changed successfully.<br />
            Redirecting to login…
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
            Go to Login
          </Link>
        </div>
      ) : (
        <>
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
              Set New Password
            </h2>
            <p style={{ fontSize: 13, color: "#5F6577" }}>
              Create a strong password to secure your account
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
              role="alert"
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div style={{ marginBottom: password ? 16 : 20 }}>
              <label style={labelStyle}>
                New Password <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoFocus
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={focusHandler}
                  onBlur={blurHandler}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9CA3B4",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {password && (
              <div style={{ marginBottom: 20 }}>
                {/* Strength bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: "#E6E4DF",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: strength?.width || "0%",
                        background: strength?.color || "#E6E4DF",
                        borderRadius: 2,
                        transition: "width 0.3s ease, background 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: strength?.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      minWidth: 40,
                      textAlign: "right",
                      transition: "color 0.3s",
                    }}
                  >
                    {strength?.label}
                  </span>
                </div>

                {/* Requirements checklist */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "5px 16px",
                    padding: "10px 12px",
                    background: "#F8F8F6",
                    borderRadius: 8,
                  }}
                >
                  <Requirement met={hasMinLength} text="8+ characters" />
                  <Requirement met={hasUpper} text="Uppercase letter" />
                  <Requirement met={hasLower} text="Lowercase letter" />
                  <Requirement met={hasNumber} text="Number" />
                  <Requirement met={hasSpecial} text="Special character" />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>
                Confirm Password <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  style={{
                    ...inputStyle,
                    paddingRight: 44,
                    borderColor: confirm.length > 0 && !passwordsMatch ? "#DC2626" : undefined,
                    boxShadow: confirm.length > 0 && !passwordsMatch ? "0 0 0 3px rgba(220,38,38,0.12)" : undefined,
                  }}
                  onFocus={focusHandler}
                  onBlur={(e) => {
                    if (confirm.length > 0 && !passwordsMatch) {
                      e.target.style.borderColor = "#DC2626";
                      e.target.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.12)";
                    } else {
                      blurHandler(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9CA3B4",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm.length > 0 && passwordsMatch && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 500 }}>✓ Passwords match</span>
                </div>
              )}
              {confirm.length > 0 && !passwordsMatch && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 500 }}>✗ Passwords do not match</span>
                </div>
              )}
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
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Updating Password…" : "Update Password"}
            </button>
          </form>

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

          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#9CA3B4",
              marginTop: 24,
            }}
          >
            Secure password update · Your session will require re-authentication
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              boxShadow: "0 8px 32px rgba(181,72,75,0.3)",
            }}
          >
            <Shield size={28} color="#fff" />
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
            Secure Your Account
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 320,
            }}
          >
            Set a strong, unique password. This helps protect your salon data and client information.
          </p>

          {/* Security tips */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              textAlign: "left",
              maxWidth: 280,
              margin: "32px auto 0",
            }}
          >
            {[
              "Use a mix of letters, numbers & symbols",
              "Avoid reusing passwords from other sites",
              "Consider using a password manager",
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(181,72,75,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: "#b5484b",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
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
          overflow: "auto",
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                padding: "60px 52px",
                textAlign: "center",
                color: "#9CA3B4",
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>

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