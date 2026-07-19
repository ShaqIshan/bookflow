import Icon from "./Icon";

interface EmptyStateProps {
  message: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-outline-variant rounded-card p-8 text-center bg-surface-container-low/50 flex flex-col items-center gap-3">
      {icon && <Icon name={icon} size={28} className="text-muted-ink" />}
      <p className="text-body-md text-muted-ink">{message}</p>
      {action}
    </div>
  );
}
