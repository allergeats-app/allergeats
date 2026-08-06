"use client";

import { useState } from "react";
import { useFamilyProfiles } from "@/lib/hooks/useFamilyProfiles";
import { FamilyProfileModal } from "@/components/FamilyProfileModal";

export function FamilyProfileSwitcher({ isDark }: { isDark: boolean }) {
  const { profiles, activeId, setActiveId, canAddMore } = useFamilyProfiles();
  const [showModal, setShowModal] = useState(false);

  const border  = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const chipBg  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const activeBg = isDark ? "rgba(124,58,237,0.22)"  : "rgba(124,58,237,0.12)";
  const activeClr = isDark ? "#c4b5fd" : "#5b21b6";
  const sub      = isDark ? "#7a82a6" : "#6b7280";

  if (profiles.length === 0 && !canAddMore) return null;

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: ".08em",
          textTransform: "uppercase", color: sub, marginBottom: 8,
        }}>
          Filtering for
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>

          {/* Personal chip */}
          <button
            onClick={() => setActiveId(null)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 99,
              border: `1px solid ${!activeId ? "rgba(124,58,237,0.4)" : border}`,
              background: !activeId ? activeBg : chipBg,
              color: !activeId ? activeClr : (isDark ? "#c4c8d8" : "#374151"),
              fontSize: 12, fontWeight: !activeId ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 13 }}>🧑</span>
            Me
          </button>

          {/* Family profile chips */}
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 99,
                border: `1px solid ${activeId === p.id ? "rgba(124,58,237,0.4)" : border}`,
                background: activeId === p.id ? activeBg : chipBg,
                color: activeId === p.id ? activeClr : (isDark ? "#c4c8d8" : "#374151"),
                fontSize: 12, fontWeight: activeId === p.id ? 700 : 500,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13 }}>{p.emoji}</span>
              {p.name}
            </button>
          ))}

          {/* Add button */}
          {canAddMore && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 10px", borderRadius: 99,
                border: `1px dashed ${border}`,
                background: "transparent",
                color: sub, fontSize: 12, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <FamilyProfileModal
          isDark={isDark}
          onClose={() => setShowModal(false)}
          onSaved={(id) => { setActiveId(id); setShowModal(false); }}
        />
      )}
    </>
  );
}
