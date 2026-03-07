type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, subtitle, action }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 17, color: "var(--c-text)" }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 14, color: "var(--c-sub)", maxWidth: 280, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
