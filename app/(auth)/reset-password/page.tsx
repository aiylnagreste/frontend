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
  if (score <= 2)
    return {
      label: "Weak",
      color: "#DC2626",
      bg: "#FEE2E2",
      width: "33%",
    };
  if (score <= 4)
    return {
      label: "Fair",
      color: "#D97706",
      bg: "#FEF3C7",
      width: "66%",
    };
  return {
    label: "Strong",
    color: "#16a34a",
    bg: "#F0FDF4",
    width: "100%",
  };
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: met ? "#16a34a" : "#9CA3B4",
        transition: "color 0.2s",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: met ? "none" : "1.5px solid #D1D5DB",
          background: met ? "#16a34a" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
          color: "#fff",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
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
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 430 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 4px 20px rgba(239,68,68,0.1)",
            }}
          >
            <span style={{ fontSize: 24 }}>⚠</span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              fontWeight: 600,
              color: "#1A1D23",
              marginBottom: 10,
            }}
          >
            Invalid Reset Link
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
            This password reset link is missing or corrupted. Please request a
            new one.
          </p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "28px 32px",
            boxShadow:
              "0 1px 3px rgba(45,42,38,0.04), 0 8px 32px rgba(45,42,38,0.06)",
            border: "1px solid rgba(45,42,38,0.06)",
            textAlign: "center",
          }}
        >
          <Link
            href="/forgot-password"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #b5484b, #6b3057)",
              color: "#fff",
              padding: "13px 20px",
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
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasMinLength) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
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

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px 12px 40px",
    border: "1.5px solid #E6E4DF",
    borderRadius: 12,
    fontSize: 14,
    color: "#1A1D23",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
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
    fontSize: 12,
    fontWeight: 600,
    color: "#5F6577",
    marginBottom: 8,
    letterSpacing: "0.02em",
  };

  return (
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 430 }}>
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
          <Shield size={24} color="#fff" strokeWidth={1.6} />
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
          Set New Password
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
          Create a strong password to keep your salon account secure.
        </p>
      </div>

      {/* Card body */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow:
            "0 1px 3px rgba(45,42,38,0.04), 0 8px 32px rgba(45,42,38,0.06)",
          border: "1px solid rgba(45,42,38,0.06)",
        }}
      >
        {success ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
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
              <CheckCircle size={24} color="#16a34a" strokeWidth={1.8} />
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
              Password Updated
            </p>
            <p
              style={{
                color: "#5F6577",
                fontSize: 13,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Your password has been changed successfully.
              <br />
              Redirecting to login…
            </p>
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
              Go to Login
            </Link>
          </div>
        ) : (
          <>
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
                role="alert"
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
              {/* New Password */}
              <div style={{ marginBottom: password ? 14 : 20 }}>
                <label style={labelStyle}>
                  New Password <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Shield
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
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter new password"
                    autoFocus
                    autoComplete="new-password"
                    style={{ ...inputBase, paddingRight: 44 }}
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
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#b5484b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#9CA3B4";
                    }}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Strength */}
              {password && (
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
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
                        minWidth: 42,
                        textAlign: "right",
                        transition: "color 0.3s",
                      }}
                    >
                      {strength?.label}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "5px 16px",
                      padding: "10px 12px",
                      background: "#F8F8F6",
                      borderRadius: 10,
                      border: "1px solid #F3F0EC",
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
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  Confirm Password <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Shield
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
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    style={{
                      ...inputBase,
                      paddingRight: 44,
                      borderColor:
                        confirm.length > 0 && !passwordsMatch
                          ? "#DC2626"
                          : undefined,
                      boxShadow:
                        confirm.length > 0 && !passwordsMatch
                          ? "0 0 0 3px rgba(220,38,38,0.12)"
                          : undefined,
                    }}
                    onFocus={focusHandler}
                    onBlur={(e) => {
                      if (confirm.length > 0 && !passwordsMatch) {
                        e.target.style.borderColor = "#DC2626";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(220,38,38,0.12)";
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
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#b5484b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#9CA3B4";
                    }}
                    aria-label={
                      showConfirm ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm.length > 0 && passwordsMatch && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#16a34a",
                        fontWeight: 500,
                      }}
                    >
                      ✓ Passwords match
                    </span>
                  </div>
                )}
                {confirm.length > 0 && !passwordsMatch && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#DC2626",
                        fontWeight: 500,
                      }}
                    >
                      ✗ Passwords do not match
                    </span>
                  </div>
                )}
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
                    Updating Password…
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>

            <div
              style={{
                textAlign: "center",
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid #F3F0EC",
              }}
            >
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
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#b5484b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#b5484b";
                }}
              >
                <ArrowLeft size={13} />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Security tips */}
      {!success && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: 430,
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
                gap: 8,
                fontSize: 11,
                color: "#9CA3B4",
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "rgba(181,72,75,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "#b5484b",
                  flexShrink: 0,
                  marginTop: 1,
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer hints */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          marginTop: 24,
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
          Encrypted update
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
          Re-auth required
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
          One-time use link
        </span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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

      <Suspense
        fallback={
          <div
            style={{
              textAlign: "center",
              color: "#9CA3B4",
              fontSize: 13,
              padding: 40,
            }}
          >
            Loading…
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>

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