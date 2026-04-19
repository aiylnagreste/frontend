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
        padding: "64px 24px",
        gap: "6px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "#F8F8F6",
          border: "1px solid #E6E4DF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "#1A1D23",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
      {description && (
        <div style={{ fontSize: "13px", color: "#5F6577", maxWidth: "300px", lineHeight: 1.6 }}>
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "12px",
            padding: "9px 20px",
            background: "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}