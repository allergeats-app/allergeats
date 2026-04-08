"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine); // eslint-disable-line react-hooks/set-state-in-effect
    const handleOffline = () => setOffline(true);
    const handleOnline  = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        background: "#1c1c1e", color: "#f2f2f7",
        fontSize: 13, fontWeight: 600, textAlign: "center",
        padding: `max(10px, calc(8px + env(safe-area-inset-top))) 16px 10px`,
        letterSpacing: "0.01em",
      }}
    >
      You&apos;re offline — showing cached data
    </div>
  );
}
