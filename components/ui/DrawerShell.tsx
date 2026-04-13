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

export function DrawerShell({ open, onClose, title, children, width = 520 }: DrawerShellProps) {
  // Handle escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - solid dark overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 9999,
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />
      
      {/* Drawer - solid white background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width}px`,
          maxWidth: "100vw",
          backgroundColor: "#FFFFFF",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.3)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid #E8E3E0",
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
          }}
        >
          <h3 style={{ 
            fontSize: "18px", 
            fontWeight: 700, 
            margin: 0, 
            color: "#1A1A2E" 
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content - solid white background */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            backgroundColor: "#FFFFFF",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}