// app/success/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle, ArrowRight, Home, Mail } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  
  const sessionId = searchParams.get("session_id");
  const upgrade = searchParams.get("upgrade") === "true";
  const cancelled = searchParams.get("cancelled") === "1";

  useEffect(() => {
    if (cancelled) {
      setStatus("error");
      setMessage("Payment was cancelled. No changes were made.");
      setTimeout(() => {
        router.push(upgrade ? "/salon-admin/dashboard" : "/");
      }, 3000);
      return;
    }

    if (!sessionId) {
      setStatus("success");
      setMessage(
        upgrade 
          ? "Your plan has been upgraded successfully!"
          : "Your subscription is now active! You can now access your salon dashboard."
      );
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (upgrade) {
              router.push("/salon-admin/dashboard");
            } else {
              router.push("/salon-admin/login?registered=1");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }

    const verifySubscription = async () => {
      try {
        const response = await fetch("/api/stripe/verify-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, is_upgrade: upgrade }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMessage(
            upgrade 
              ? "Your plan has been upgraded successfully! Your new features are now available."
              : "Your subscription is now active! You can now access your salon dashboard."
          );
          
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                if (upgrade) {
                  router.push("/salon-admin/dashboard");
                } else {
                  router.push("/salon-admin/login?registered=1");
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify subscription. Please contact support.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your subscription.");
      }
    };

    verifySubscription();
  }, [sessionId, upgrade, cancelled, router]);

  if (status === "loading") {
    return (
      <div style={styles.container}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />
        <div style={styles.card}>
          <Loader2 size={48} style={styles.spinner} />
          <div style={styles.brand}>
            <div style={styles.brandIcon}>✨</div>
            <span style={styles.brandText}>Salon</span>
          </div>
          <h2 style={styles.title}>Processing Your {upgrade ? "Upgrade" : "Subscription"}</h2>
          <p style={styles.description}>Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={styles.container}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />
        <div style={styles.card}>
          <div style={styles.iconCircleError}>
            <XCircle size={34} style={{ color: "#EF4444" }} />
          </div>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>✨</div>
            <span style={styles.brandText}>Salon</span>
          </div>
          <h2 style={styles.errorTitle}>Something Went Wrong</h2>
          <p style={styles.description}>{message}</p>
          <div style={styles.buttonGroup}>
            <Link href="/" style={styles.button}>
              Go to Homepage
            </Link>
            {upgrade && (
              <Link href="/salon-admin/dashboard" style={styles.secondaryButton}>
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />
      
      <div style={styles.card}>
        <div style={styles.iconCircle}>
          <CheckCircle size={34} style={{ color: "#16a34a" }} />
        </div>

        <div style={styles.brand}>
          <div style={styles.brandIcon}>✨</div>
          <span style={styles.brandText}>Salon</span>
        </div>

        <h1 style={styles.mainTitle}>
          {upgrade ? "Upgrade Successful!" : "Payment Successful!"}
        </h1>

        <p style={styles.description}>
          {message || (upgrade 
            ? "Your plan has been upgraded successfully! Your new features are now available."
            : "Your subscription is now active! You can now access your salon dashboard.")}
        </p>

        {!upgrade && (
          <div style={styles.emailNotice}>
            <Mail size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span style={styles.emailNoticeText}>
              Check your inbox for setup instructions and credentials
            </span>
          </div>
        )}

        <div style={styles.divider} />

        <div style={styles.nextSteps}>
          <p style={styles.nextStepsTitle}>What happens next</p>
          {upgrade ? (
            <>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>1</div>
                <span style={styles.stepText}>Your new features are available immediately</span>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>2</div>
                <span style={styles.stepText}>Your billing cycle has been updated</span>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>3</div>
                <span style={styles.stepText}>You'll receive a confirmation email shortly</span>
              </div>
            </>
          ) : (
            <>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>1</div>
                <span style={styles.stepText}>Credentials emailed to you within 2 minutes</span>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>2</div>
                <span style={styles.stepText}>Log in and configure your branches & staff</span>
              </div>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>3</div>
                <span style={styles.stepText}>Share your booking link — go live instantly</span>
              </div>
            </>
          )}
        </div>

        <div style={styles.buttonGroup}>
          <Link 
            href={upgrade ? "/salon-admin/dashboard" : "/salon-admin/login"} 
            style={styles.button}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            {upgrade ? "Go to Dashboard" : "Go to Login"}
            <ArrowRight size={15} />
          </Link>
          <Link href="/" style={styles.secondaryButton}>
            <Home size={15} />
            Back to Home
          </Link>
        </div>

        {!upgrade && (
          <p style={styles.secureNote}>
            Secure admin access · Session managed via HTTP-only cookies
          </p>
        )}
        
        {upgrade && (
          <p style={styles.redirectNote}>
            Redirecting automatically in {countdown} seconds...
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={styles.container}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />
        <div style={styles.card}>
          <Loader2 size={48} style={styles.spinner} />
          <div style={styles.brand}>
            <div style={styles.brandIcon}>✨</div>
            <span style={styles.brandText}>Salon</span>
          </div>
          <p style={styles.description}>Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#FBF8F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(181,72,75,0.08) 0%, transparent 70%)",
    top: "-15%",
    right: "-10%",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,149,106,0.06) 0%, transparent 70%)",
    bottom: "-10%",
    left: "-8%",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(181,72,75,0.05) 0%, transparent 70%)",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "#FFFFFF",
    border: "1px solid rgba(45,42,38,0.06)",
    borderRadius: 20,
    padding: "48px 40px",
    maxWidth: 460,
    width: "100%",
    textAlign: "center" as const,
    boxShadow: "0 1px 3px rgba(45,42,38,0.04), 0 8px 32px rgba(45,42,38,0.06)",
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "#F0FDF4",
    border: "1px solid rgba(22,163,74,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
  },
  iconCircleError: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "#FEF2F2",
    border: "1px solid rgba(239,68,68,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
  },
  brandText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 15,
    fontWeight: 600,
    color: "#5F6577",
    letterSpacing: "-0.01em",
  },
  mainTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 32,
    fontWeight: 600,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    margin: "0 0 10px",
    lineHeight: 1.2,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 26,
    fontWeight: 600,
    color: "#1A1D23",
    letterSpacing: "-0.01em",
    margin: "0 0 12px",
    lineHeight: 1.2,
  },
  errorTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 26,
    fontWeight: 600,
    color: "#DC2626",
    letterSpacing: "-0.01em",
    margin: "0 0 12px",
    lineHeight: 1.2,
  },
  description: {
    fontSize: 14,
    color: "#5F6577",
    lineHeight: 1.7,
    margin: "0 0 28px",
    fontWeight: 400,
  },
  emailNotice: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#F0FDF4",
    border: "1px solid rgba(22,163,74,0.12)",
    borderRadius: 12,
    padding: "13px 16px",
    marginBottom: 28,
    textAlign: "left" as const,
  },
  emailNoticeText: {
    fontSize: 13,
    color: "#5F6577",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  divider: {
    height: 1,
    background: "#F3F0EC",
    marginBottom: 28,
  },
  nextSteps: {
    textAlign: "left" as const,
    marginBottom: 32,
  },
  nextStepsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#5F6577",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    marginBottom: 14,
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "rgba(181,72,75,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    color: "#b5484b",
    flexShrink: 0,
    marginTop: 1,
  },
  stepText: {
    fontSize: 13,
    color: "#5F6577",
    lineHeight: 1.5,
    fontWeight: 400,
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap" as const,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "13px 24px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    color: "#fff",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 8px 32px rgba(181,72,75,0.3)",
    transition: "opacity 0.2s",
    fontFamily: "'Inter', sans-serif",
  },
  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 24px",
    borderRadius: 12,
    background: "#FFFFFF",
    color: "#5F6577",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
    fontFamily: "'Inter', sans-serif",
    border: "1.5px solid #E6E4DF",
  },
  redirectNote: {
    fontSize: 12,
    color: "#9CA3B4",
    marginTop: 16,
  },
  secureNote: {
    fontSize: 11,
    color: "#9CA3B4",
    marginTop: 20,
  },
  spinner: {
    animation: "spin 1s linear infinite",
    marginBottom: 24,
    color: "#b5484b",
    marginLeft: "auto",
    marginRight: "auto",
    display: "block",
  },
};