interface StatCardProps {
  label: string;
  value: string;
  tone?: "default" | "primary" | "secondary" | "tertiary";
  minWidth?: number;
}

const TONES = {
  default: "text-on-surface",
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
} as const;

export default function StatCard({ label, value, tone = "default", minWidth = 140 }: StatCardProps) {
  return (
    <div
      className="bg-surface rounded-xl p-4 shadow-ambient snap-start shrink-0"
      style={{ minWidth }}
    >
      <p className="text-label-md text-muted-ink mb-1 uppercase">{label}</p>
      <p className={`text-stat-lg ${TONES[tone]}`}>{value}</p>
    </div>
  );
}
