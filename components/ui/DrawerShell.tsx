// components/ui/DrawerShell.tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import styles from "./DrawerShell.module.css";

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function DrawerShell({ open, onClose, title, children, width = 520 }: DrawerShellProps) {
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
      <div className={styles.overlay} onClick={onClose} />

      {/* Drawer */}
      <div
        className={styles.drawer}
        style={{ "--_panel-width": `${width}px` } as React.CSSProperties}
      >
        {/* Header */}
        <div className={styles.drawer__header}>
          <h3 className={styles.drawer__title}>{title}</h3>
          <button
            onClick={onClose}
            className={styles.drawer__close}
            aria-label="Close drawer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.drawer__content}>
          {children}
        </div>
      </div>
    </>
  );
}
