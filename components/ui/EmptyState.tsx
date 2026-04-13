interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: "8px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "32px", lineHeight: 1, marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-ink)" }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: "13px", color: "var(--color-sub)", maxWidth: "280px" }}>
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "8px",
            padding: "8px 18px",
            background: "var(--color-rose)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
