"use client";

export function LocationBlockedBanner({
  locationDenied,
  onRetry,
}: {
  locationDenied: boolean;
  onRetry: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 14px", marginBottom: 16,
      borderRadius: 12, background: "var(--c-card)",
      border: "1.5px solid var(--c-border)",
      fontSize: 13, color: "var(--c-sub)", lineHeight: 1.4,
    }}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
      </svg>
      {locationDenied ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <span>
            <span style={{ fontWeight: 700, color: "var(--c-text)" }}>Location blocked. </span>
            {typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent)
              ? "Go to Settings → Privacy & Security → Location Services → Safari → Allow While Using App."
              : "Tap the lock icon in your browser's address bar, set Location to Allow, then try again."}
          </span>
          <button
            type="button"
            onClick={onRetry}
            style={{ alignSelf: "flex-start", padding: "5px 10px", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <span style={{ flex: 1 }}>Location access is unavailable. Enable location to find restaurants near you.</span>
          <button
            type="button"
            onClick={onRetry}
            style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
