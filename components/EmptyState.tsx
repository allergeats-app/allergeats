type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon = "🍽️", title, subtitle, action }: Props) {
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
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: "#111" }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 280, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
