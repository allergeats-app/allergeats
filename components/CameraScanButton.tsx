"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CAMERA_SESSION_KEY = "allegeats_camera_scan";

type Props = {
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export function CameraScanButton({ style, children = "Scan a Menu" }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoto(file: File) {
    setScanning(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/scan-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Scan failed"); return; }
      const lines: string[] = data.menuLines ?? [];
      if (!lines.length) { setError("Couldn't read menu items from that photo."); return; }
      sessionStorage.setItem(CAMERA_SESSION_KEY, JSON.stringify(lines));
      router.push("/scan");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={scanning}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ""; }}
        style={{ display: "none" }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={scanning}
        style={style}
      >
        {scanning ? "Reading menu…" : children}
      </button>
      {error && (
        <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4, textAlign: "center" }}>{error}</div>
      )}
    </>
  );
}
