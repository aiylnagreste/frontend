// components/ui/ModalShell.tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import styles from "./ModalShell.module.css";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function ModalShell({ open, onClose, title, children, width = 480 }: ModalShellProps) {
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

      {/* Modal Card - Centered, no animation */}
      {/* inline: caller-provided runtime panel width (unbounded number) — sets a CSS variable consumed by .modal in ModalShell.module.css */}
      <div
        className={styles.modal}
        style={{ "--_panel-width": `${width}px` } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modal__header}>
          <h3 className={styles.modal__title}>{title}</h3>
          <button
            onClick={onClose}
            className={styles.modal__close}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className={styles.modal__content}>
          {children}
        </div>
      </div>
    </>
  );
}
