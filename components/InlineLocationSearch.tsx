"use client";

import { useEffect, useRef, useState } from "react";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string; town?: string; village?: string; hamlet?: string;
    county?: string; state?: string; country?: string;
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
  locationLabel: string;
  locationMode: "precise" | "approximate" | "cached" | "unavailable";
  resultsSource: "live" | "mock";
  onSelectLocation: (lat: number, lng: number, label: string) => void;
  onUseCurrentLocation: () => void;
};

export function InlineLocationSearch({
  locationLabel, locationMode, resultsSource,
  onSelectLocation, onUseCurrentLocation,
}: Props) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPickRef = useRef(false);

  const dotColor =
    locationMode === "precise"     ? "#22c55e" :
    locationMode === "cached"      ? "#f59e0b" :
    locationMode === "approximate" ? "#f59e0b" : "#d1d5db";

  function openSearch() {
    setOpen(true);
    setQuery("");
    setResults([]);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
    setSearching(false);
    autoPickRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeSearch(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Debounced Nominatim search
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
          { headers: { "Accept-Language": "en", "User-Agent": "AllergEats/1.0" } },
        );
        if (!res.ok) throw new Error();
        const data: NominatimResult[] = await res.json();
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
    }, 380);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickResult(r: NominatimResult) {
    onSelectLocation(parseFloat(r.lat), parseFloat(r.lon), formatResult(r));
    closeSearch();
  }

  function handleGPS() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onUseCurrentLocation();
      closeSearch();
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onSelectLocation(pos.coords.latitude, pos.coords.longitude, "Current Location");
        closeSearch();
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location blocked. Enable it in browser settings.");
        } else {
          onUseCurrentLocation();
          closeSearch();
        }
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 30000 },
    );
  }

  const showDropdown = open && (locating || searching || results.length > 0 || error);

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: 0, flex: 1 }}>

      {/* Collapsed: location label button */}
      {!open && (
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search location"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", padding: 0,
            cursor: "pointer", minWidth: 0, overflow: "hidden",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: 999, flexShrink: 0,
            background: dotColor,
            boxShadow: locationMode === "precise" ? `0 0 0 3px ${dotColor}28` : "none",
            transition: "background 0.3s, box-shadow 0.3s",
          }} />
          <span style={{
            fontSize: 13, fontWeight: 600, color: "var(--c-text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {locationLabel}
          </span>
          {resultsSource === "mock" && (
            <span style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.04em", flexShrink: 0 }}>
              DEMO
            </span>
          )}
          <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="var(--c-sub)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      )}

      {/* Expanded: search input */}
      {open && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* GPS button */}
          <button
            type="button"
            onClick={handleGPS}
            disabled={locating}
            aria-label="Use current location"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 8,
              background: "var(--c-brand-bg)", border: "1px solid var(--c-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: locating ? "default" : "pointer", opacity: locating ? 0.6 : 1,
            }}
          >
            {locating ? (
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: "spin 0.9s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            )}
          </button>

          {/* Text input */}
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (results.length > 0) pickResult(results[0]);
                else if (searching) autoPickRef.current = true;
              }}
              placeholder="City or address…"
              aria-label="Search location"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "6px 28px 6px 10px",
                border: "1.5px solid var(--c-brand)", borderRadius: 8,
                background: "var(--c-input)", color: "var(--c-text)",
                fontSize: 13, fontWeight: 500,
                outline: "none",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                aria-label="Clear"
                style={{
                  position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                  width: 20, height: 20, borderRadius: 999,
                  background: "var(--c-muted)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--c-sub)",
                }}
              >
                <svg aria-hidden="true" width="8" height="8" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={closeSearch}
            style={{
              flexShrink: 0, fontSize: 13, fontWeight: 600, color: "var(--c-sub)",
              background: "none", border: "none", padding: "0 2px", cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "var(--c-hdr)",
          border: "1px solid var(--c-border)",
          borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
          zIndex: 300,
          maxHeight: 280,
          overflowY: "auto",
        }}>
          {(searching || locating) && (
            <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--c-sub)" }}>
              {locating ? "Finding your location…" : "Searching…"}
            </div>
          )}
          {error && !searching && !locating && (
            <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--c-sub)" }}>{error}</div>
          )}
          {!searching && !locating && results.map((r, i) => {
            const label = formatResult(r);
            const sub   = r.display_name.split(",").slice(1, 3).join(",").trim();
            return (
              <button
                key={i}
                type="button"
                onClick={() => pickResult(r)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px", textAlign: "left",
                  background: "transparent", border: "none",
                  borderTop: i === 0 ? "none" : "1px solid var(--c-border)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--c-muted)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="var(--c-sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                  {sub && <div style={{ fontSize: 12, color: "var(--c-sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
