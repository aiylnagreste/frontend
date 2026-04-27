// components/ui/EmptyState.tsx
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyState__iconWrap}>
        {icon}
      </div>
      <div className={styles.emptyState__title}>{title}</div>
      {description && (
        <div className={styles.emptyState__description}>{description}</div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={styles.emptyState__action}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
