interface IconProps {
  name: string;
  fill?: boolean;
  size?: number;
  className?: string;
}

/** Material Symbols Outlined glyph. */
export default function Icon({ name, fill, size, className }: IconProps) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined select-none ${fill ? "icon-fill" : ""} ${className ?? ""}`}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  );
}
