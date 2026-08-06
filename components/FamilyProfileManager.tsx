"use client";

import { useState } from "react";
import { useFamilyProfiles, type FamilyProfile } from "@/lib/hooks/useFamilyProfiles";
import { FamilyProfileModal } from "@/components/FamilyProfileModal";

export function FamilyProfileManager({ isDark }: { isDark: boolean }) {
  const { profiles, activeId, setActiveId, canAddMore, loading } = useFamilyProfiles();
  const [editing, setEditing] = useState<FamilyProfile | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const surface  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const sub      = isDark ? "#7a82a6" : "#6b7280";
  const text     = isDark ? "#e2e6f5" : "#111827";

  if (loading) return null;

  return (
    <>
      <div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: text }}>Family Profiles</div>
            <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>
              {profiles.length} / 5 profiles
            </div>
          </div>
          {canAddMore && (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: "7px 14px", borderRadius: 10, border: "none",
                background: isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)",
                color: isDark ? "#c4b5fd" : "#5b21b6",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              + Add member
            </button>
          )}
        </div>

        {profiles.length === 0 ? (
          <div style={{
            padding: "20px 16px", borderRadius: 12,
            background: surface, border: `1px dashed ${border}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>👨‍👩‍👧</div>
            <div style={{ fontSize: 13, color: sub, lineHeight: 1.5 }}>
              Add profiles for family members so you can quickly check menus for anyone.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Personal profile row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 12,
              background: !activeId ? (isDark ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.07)") : surface,
              border: `1px solid ${!activeId ? "rgba(124,58,237,0.3)" : border}`,
              cursor: "pointer",
            }} onClick={() => setActiveId(null)}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🧑</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: text }}>Me (personal)</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 1 }}>Your allergen profile</div>
              </div>
              {!activeId && (
                <span style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#c4b5fd" : "#5b21b6",
                  background: isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)",
                  padding: "2px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Active
                </span>
              )}
            </div>

            {/* Family profile rows */}
            {profiles.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12,
                background: activeId === p.id ? (isDark ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.07)") : surface,
                border: `1px solid ${activeId === p.id ? "rgba(124,58,237,0.3)" : border}`,
                cursor: "pointer",
              }} onClick={() => setActiveId(p.id)}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 1 }}>
                    {p.allergens.length === 0
                      ? "No allergens"
                      : p.allergens.join(", ")}
                  </div>
                </div>
                {activeId === p.id && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#c4b5fd" : "#5b21b6",
                    background: isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)",
                    padding: "2px 7px", borderRadius: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Active
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(p); }}
                  style={{
                    padding: "5px 10px", borderRadius: 8, border: `1px solid ${border}`,
                    background: "none", color: sub, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <FamilyProfileModal
          isDark={isDark}
          onClose={() => setShowAdd(false)}
          onSaved={(id) => { setActiveId(id); setShowAdd(false); }}
        />
      )}

      {editing && (
        <FamilyProfileModal
          isDark={isDark}
          profile={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          onDeleted={() => setEditing(null)}
        />
      )}
    </>
  );
}
