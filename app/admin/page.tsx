"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { correctionCount, exportCorrections, clearAllCorrections } from "@/lib/adminCorrections";
import { MOCK_RESTAURANTS, MENU_DATA_VERIFIED_DATE } from "@/lib/mockRestaurants";

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const SESSION_KEY = "allegeats_admin_authed";

export default function AdminPage() {
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);
  const [count, setCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    setCount(correctionCount());
    setTotalItems(MOCK_RESTAURANTS.reduce((acc, r) => acc + r.menuItems.length, 0));
  }, []);

  function login() {
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
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
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1fbdcc", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>AllergEats Admin</div>
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
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "#1fbdcc", color: "#001f26", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
          >
            Enter
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
          <div style={{ fontSize: 11, fontWeight: 800, color: "#1fbdcc", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>AllergEats Admin</div>
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
          <div key={label} style={{ background: "#1c1c1e", border: `1px solid ${highlight ? "#1fbdcc" : "#2c2c2e"}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: highlight ? "#1fbdcc" : "#f2f2f7", letterSpacing: "-0.03em" }}>{value}</div>
            <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Official data last verified: {MENU_DATA_VERIFIED_DATE}
      </div>

      {/* Restaurant list */}
      <div style={{ display: "grid", gap: 8 }}>
        {restaurants.map((r) => (
          <Link key={r.id} href={`/admin/menu?id=${r.id}`} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 14, padding: "14px 18px", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f2f2f7" }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>{r.cuisine} · {r.menuItems.length} items</div>
              </div>
              <span style={{ fontSize: 18, color: "#3c3c3e" }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
