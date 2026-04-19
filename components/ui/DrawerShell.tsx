// components/ui/DrawerShell.tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function DrawerShell({
  open,
  onClose,
  title,
  children,
  width = 520,
}: DrawerShellProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(17, 19, 24, 0.55)",
          zIndex: 9999,
          backdropFilter: "blur(3px)",
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width}px`,
          maxWidth: "100vw",
          backgroundColor: "#fff",
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.2)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: "1px solid #E6E4DF",
            flexShrink: 0,
            backgroundColor: "#fff",
          }}
        >
          <h3
            style={{
              fontSize: "17px",
              fontWeight: 700,
              margin: 0,
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #E6E4DF",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5F6577",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F8F8F6";
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.color = "#1A1D23";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#E6E4DF";
              e.currentTarget.style.color = "#5F6577";
            }}
            aria-label="Close drawer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px",
            backgroundColor: "#fff",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}