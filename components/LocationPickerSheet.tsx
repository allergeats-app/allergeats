"use client";

import { useEffect, useRef, useState } from "react";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

function formatResult(r: NominatimResult): string {
  const a = r.address;
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.county ?? "";
  if (city && a.state) return `${city}, ${a.state}`;
  if (city && a.country) return `${city}, ${a.country}`;
  return r.display_name.split(",").slice(0, 2).join(",").trim();
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, label: string) => void;
  onUseCurrentLocation: () => void;
};

export function LocationPickerSheet({ open, onClose, onSelectLocation, onUseCurrentLocation }: Props) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [locating, setLocating]   = useState(false);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set to true when user hits Enter while results are still loading — auto-picks first result on arrival
  const autoPickRef = useRef(false);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") handleClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    setQuery("");
    setResults([]);
    setError(null);
    onClose();
  }

  // Debounced forward geocode via Nominatim
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setError(null); setSearching(false); autoPickRef.current = false; return; }

    setSearching(true);
    setError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "en", "User-Agent": "AllergEats/1.0" } }
        );
        if (!res.ok) throw new Error();
        const data: NominatimResult[] = await res.json();
        // If user hit Enter while we were fetching, pick the top result immediately
        if (autoPickRef.current && data.length > 0) {
          autoPickRef.current = false;
          pickResult(data[0]);
          return;
        }
        autoPickRef.current = false;
        setResults(data);
        if (!data.length) setError("No places found — try a different search");
      } catch {
        autoPickRef.current = false;
        setError("Couldn't search right now. Check your connection.");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function pickResult(r: NominatimResult) {
    const label = formatResult(r);
    onSelectLocation(parseFloat(r.lat), parseFloat(r.lon), label);
    handleClose();
  }

  function handleCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onUseCurrentLocation();
      handleClose();
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSelectLocation(pos.coords.latitude, pos.coords.longitude, "Current Location");
        handleClose();
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access blocked. Enable it in your browser settings.");
        } else {
          // Timeout or unavailable — hand off to parent which uses cached location
          onUseCurrentLocation();
          handleClose();
        }
      },
      // maximumAge: use a fix up to 30 s old for instant response;
      // fall back to a fresh fix if nothing cached.
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 30000 },
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change location"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
          background: "var(--c-card)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          boxShadow: "0 -16px 56px rgba(0,0,0,0.2)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: open
            ? "transform 0.38s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.28s cubic-bezier(0.4,0,1,1)",
          maxHeight: "min(80dvh, calc(100dvh - 60px))",
          display: "flex", flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--c-border)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 16px", flexShrink: 0,
          borderBottom: "1px solid var(--c-border)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)" }}>Change Location</div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 999,
              background: "var(--c-muted)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--c-sub)",
            }}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" >
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 24px" }}>

          {/* Use current location */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "13px 16px", borderRadius: 16, marginBottom: 16,
              background: locating ? "#fff5f5" : "#fef2f2",
              border: "1.5px solid #1fbdcc",
              color: "#1fbdcc", fontSize: 14, fontWeight: 800,
              cursor: locating ? "default" : "pointer", textAlign: "left",
              opacity: locating ? 0.8 : 1,
            }}
          >
            {locating ? (
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"  style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"  style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            )}
            {locating ? "Finding your location…" : "Use My Current Location"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
            <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>or search</span>
            <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
          </div>

          {/* Search input */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (results.length > 0) {
                  // Results already loaded — pick the top one immediately
                  pickResult(results[0]);
                } else if (searching) {
                  // Still fetching — flag to auto-pick when results arrive
                  autoPickRef.current = true;
                }
              }}
              placeholder="City, neighborhood, or address…"
              aria-label="Search location"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 16px 12px 42px",
                border: "1.5px solid var(--c-border)", borderRadius: 14,
                background: "var(--c-input)", color: "var(--c-text)",
                outline: "none",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); }}
                aria-label="Clear"
                style={{
                  position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: 999,
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--c-sub)",
                }}
              >
                <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" >
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Searching indicator */}
          {searching && (
            <div style={{ fontSize: 13, color: "var(--c-sub)", padding: "8px 4px" }}>Searching…</div>
          )}

          {/* Error */}
          {error && !searching && (
            <div style={{ fontSize: 13, color: "var(--c-sub)", padding: "8px 4px" }}>{error}</div>
          )}

          {/* Results */}
          {!searching && results.length > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              {results.map((r, i) => {
                const label = formatResult(r);
                const sub   = r.display_name.split(",").slice(1, 3).join(",").trim();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickResult(r)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14, textAlign: "left",
                      background: "var(--c-muted)", border: "1px solid var(--c-border)",
                      cursor: "pointer",
                    }}
                  >
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"  style={{ flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                      {sub && <div style={{ fontSize: 12, color: "var(--c-sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{sub}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
