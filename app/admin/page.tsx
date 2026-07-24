"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { correctionCount, exportCorrections, clearAllCorrections, getAllCorrections } from "@/lib/adminCorrections";
import { MOCK_RESTAURANTS, MENU_DATA_VERIFIED_DATE } from "@/lib/mockRestaurants";
import { ALLERGEN_SOURCE_URLS } from "@/lib/allergenSourceUrls";

const SESSION_KEY = "allegeats_admin_authed";

export default function AdminPage() {
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [count, setCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    setCount(correctionCount());
    setTotalItems(MOCK_RESTAURANTS.reduce((acc, r) => acc + r.menuItems.length, 0));
  }, []);

  async function login() {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      if (res.ok) {
        const { token } = await res.json() as { token: string };
        sessionStorage.setItem(SESSION_KEY, "1");
        sessionStorage.setItem("allegeats_admin_token", token);
        setAuthed(true);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  }

  function download() {
    const blob = new Blob([exportCorrections()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allergeats-corrections-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    if (confirm("Delete all saved corrections? This cannot be undone.")) {
      clearAllCorrections();
      setCount(0);
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 20, padding: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-brand)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>AllergEats Admin</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#f2f2f7", marginBottom: 24 }}>Menu Audit Tool</div>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="Admin password"
            autoFocus
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${error ? "#f87171" : "#3c3c3e"}`, background: "#252528", color: "#f2f2f7", fontSize: 15, outline: "none", marginBottom: 12 }}
          />
          {error && <div style={{ fontSize: 13, color: "#f87171", marginBottom: 12 }}>Incorrect password.</div>}
          <button
            onClick={login}
            disabled={checking}
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: checking ? "#9ca3af" : "var(--c-brand)", color: "#001f26", fontSize: 15, fontWeight: 800, cursor: checking ? "not-allowed" : "pointer" }}
          >
            {checking ? "Checking…" : "Enter"}
          </button>
        </div>
      </div>
    );
  }

  const restaurants = MOCK_RESTAURANTS;

  return (
    <div style={{ minHeight: "100dvh", background: "#0f0f0f", color: "#f2f2f7", padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-brand)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>AllergEats Admin</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>Menu Audit Dashboard</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {count > 0 && (
            <>
              <button onClick={download} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #3c3c3e", background: "transparent", color: "#f2f2f7", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Export JSON
              </button>
              <button onClick={handleClear} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #f87171", background: "transparent", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Restaurants", value: restaurants.length },
          { label: "Total Items", value: totalItems },
          { label: "Corrections Saved", value: count, highlight: count > 0 },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{ background: "#1c1c1e", border: `1px solid ${highlight ? "var(--c-brand)" : "#2c2c2e"}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: highlight ? "var(--c-brand)" : "#f2f2f7", letterSpacing: "-0.03em" }}>{value}</div>
            <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Registry Ops */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Ops</div>
        <Link href="/admin/registry" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🗺️</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f2f2f7" }}>Registry Operations</div>
            <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 1 }}>Geo purge · Chain URL seeding · Crawl queue · Anomaly scanner</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 16, color: "#3c3c3e", flexShrink: 0 }}>→</span>
        </Link>
      </div>

      {/* AI Employees */}
      <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Employees</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 32 }}>
        {[
          { emoji: "📋", name: "Menu Manager",     href: "/admin/employees/menu-manager",    desc: "Flags stale & missing menus" },
          { emoji: "🔍", name: "Allergen Auditor",  href: "/admin/employees/allergen-audit",  desc: "Catches allergen data gaps" },
          { emoji: "🏪", name: "Restaurant Ops",    href: "/admin/employees/restaurant-ops",  desc: "Audits registry for duplicates" },
          { emoji: "🗂️", name: "Feedback Triager",  href: "/admin/employees/feedback-triage", desc: "Promotes & rejects learned rules" },
        ].map(({ emoji, name, href, desc }) => (
          <Link key={href} href={href} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(31,189,204,0.1)", border: "1px solid rgba(31,189,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f2f2f7" }}>{name}</div>
              <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 1 }}>{desc}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 16, color: "#3c3c3e", flexShrink: 0 }}>→</span>
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Manual Audit · Data last verified: {MENU_DATA_VERIFIED_DATE}
      </div>

      {/* Restaurant list */}
      <div style={{ display: "grid", gap: 8 }}>
        {restaurants.map((r) => {
          const allCorrections = getAllCorrections();
          const verified = Object.keys(allCorrections).filter(k => k.startsWith(r.id + "::")).length;
          const sourceUrl = ALLERGEN_SOURCE_URLS[r.id];
          return (
            <div key={r.id} style={{ background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 14, overflow: "hidden" }}>
              <Link href={`/admin/menu?id=${r.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#f2f2f7" }}>{r.name}</span>
                    {verified > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-brand)", background: "rgba(31,189,204,0.12)", border: "1px solid rgba(31,189,204,0.3)", padding: "1px 7px", borderRadius: 999 }}>{verified}/{r.menuItems.length}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>{r.cuisine} · {r.menuItems.length} items</div>
                </div>
                <span style={{ fontSize: 18, color: "#3c3c3e", flexShrink: 0 }}>→</span>
              </Link>
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderTop: "1px solid #2c2c2e", textDecoration: "none", background: "rgba(31,189,204,0.04)" }}>
                  <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  <span style={{ fontSize: 11, color: "var(--c-brand)", fontWeight: 700 }}>Open official allergen page</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
