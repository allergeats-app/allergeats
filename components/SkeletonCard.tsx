"use client";

export function SkeletonCard({ featured = false }: { featured?: boolean }) {
  return (
    <div style={{
      background: "var(--c-card)", border: "1px solid var(--c-border)",
      borderRadius: 24, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    }}>
      <div className="skeleton" style={{ height: 110, borderRadius: 0 }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div className="skeleton" style={{ height: featured ? 18 : 14, width: "60%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 11, width: "35%", marginBottom: featured ? 14 : 10 }} />
        <div className="skeleton" style={{ height: 5, width: "100%", borderRadius: 999, marginBottom: featured ? 10 : 0 }} />
        {featured && (
          <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
            <div className="skeleton" style={{ height: 11, width: 36 }} />
            <div className="skeleton" style={{ height: 11, width: 36 }} />
            <div className="skeleton" style={{ height: 11, width: 36 }} />
          </div>
        )}
      </div>
    </div>
  );
}
