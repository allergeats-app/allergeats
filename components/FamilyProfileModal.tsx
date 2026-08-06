"use client";

import { useEffect, useState } from "react";
import { useFamilyProfiles, type FamilyProfile } from "@/lib/hooks/useFamilyProfiles";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

const EMOJIS = ["🧑", "👩", "👨", "🧒", "👧", "👦", "👴", "👵", "🐶", "🐱"];

export function FamilyProfileModal({
  isDark,
  profile,
  onClose,
  onSaved,
  onDeleted,
}: {
  isDark: boolean;
  profile?: FamilyProfile;
  onClose: () => void;
  onSaved: (id: string) => void;
  onDeleted?: () => void;
}) {
  const { createProfile, updateProfile, deleteProfile } = useFamilyProfiles();

  const [name, setName]           = useState(profile?.name ?? "");
  const [emoji, setEmoji]         = useState(profile?.emoji ?? "🧑");
  const [allergens, setAllergens] = useState<AllergenId[]>(profile?.allergens ?? []);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleAllergen(id: AllergenId) {
    setAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      if (profile) {
        const ok = await updateProfile(profile.id, { name: name.trim(), emoji, allergens });
        if (!ok) throw new Error("Failed to save");
        onSaved(profile.id);
      } else {
        const created = await createProfile(name.trim(), emoji, allergens);
        if (!created) throw new Error("Failed to create — you may have reached the 5-profile limit");
        onSaved(created.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!profile) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await deleteProfile(profile.id);
    onDeleted?.();
  }

  const glassBase   = isDark ? "rgba(14, 8, 36, 0.95)"  : "rgba(250, 248, 255, 0.97)";
  const glassBorder = isDark ? "rgba(139,92,246,0.2)"   : "rgba(124,58,237,0.15)";
  const headingClr  = isDark ? "#f0ecff" : "#1a0533";
  const sub         = isDark ? "#9090b0" : "#6b7280";
  const inputBg     = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.12)";
  const chipBg      = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const activeBg    = isDark ? "rgba(239,68,68,0.18)"   : "rgba(239,68,68,0.1)";
  const activeClr   = isDark ? "#fca5a5" : "#b91c1c";
  const activeBdr   = isDark ? "rgba(239,68,68,0.35)"   : "rgba(239,68,68,0.3)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={profile ? `Edit ${profile.name}` : "Add family profile"}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 max(16px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: isDark ? "rgba(0,0,0,0.7)" : "rgba(10,0,30,0.4)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          animation: "fpFadeIn .2s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 520,
          background: glassBase,
          border: `1px solid ${glassBorder}`,
          borderRadius: "20px 20px 16px 16px",
          backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          boxShadow: isDark
            ? "0 -20px 60px rgba(0,0,0,0.5)"
            : "0 -20px 60px rgba(10,0,30,0.12)",
          padding: "24px 20px 20px",
          animation: "fpSlideUp .25s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "85dvh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: headingClr, letterSpacing: "-.02em" }}>
            {profile ? `Edit ${profile.name}` : "Add family member"}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", cursor: "pointer",
            color: sub, fontSize: 22, lineHeight: 1, padding: "2px 4px",
          }}>×</button>
        </div>

        {/* Emoji picker */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Avatar
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: "none",
                  background: emoji === e ? (isDark ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.12)") : chipBg,
                  fontSize: 20, cursor: "pointer",
                  outline: emoji === e ? "2px solid rgba(124,58,237,0.5)" : "none",
                  transition: "background .12s",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="fp-name" style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 8 }}>
            Name
          </label>
          <input
            id="fp-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom, Jake, Baby"
            maxLength={24}
            style={{
              width: "100%", padding: "11px 14px",
              background: inputBg, border: `1px solid ${inputBorder}`,
              borderRadius: 12, fontSize: 15, color: headingClr,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Allergens */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Allergens
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ALLERGEN_LIST.map((a) => {
              const active = allergens.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAllergen(a.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 99,
                    border: `1px solid ${active ? activeBdr : inputBorder}`,
                    background: active ? activeBg : chipBg,
                    color: active ? activeClr : (isDark ? "#c4c8d8" : "#374151"),
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: "pointer", transition: "all .12s",
                  }}
                >
                  {active ? "✕ " : ""}{a.label}
                </button>
              );
            })}
          </div>
          {allergens.length === 0 && (
            <div style={{ fontSize: 11, color: sub, marginTop: 6 }}>
              Tap allergens to add them. Leave empty for no restrictions.
            </div>
          )}
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {profile && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: "12px 16px", borderRadius: 12, border: "none",
                background: confirmDelete
                  ? (isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)")
                  : chipBg,
                color: confirmDelete ? (isDark ? "#fca5a5" : "#b91c1c") : sub,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete"}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
              background: saving || !name.trim()
                ? "rgba(124,58,237,0.35)"
                : "linear-gradient(135deg, #5b21b6, #7c3aed)",
              color: "#fff", fontSize: 14, fontWeight: 800,
              cursor: saving || !name.trim() ? "not-allowed" : "pointer",
              boxShadow: saving || !name.trim() ? "none" : "0 4px 20px rgba(109,40,217,0.4)",
            }}
          >
            {saving ? "Saving…" : profile ? "Save changes" : "Add profile"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fpFadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fpSlideUp  { from { opacity: 0; transform: translateY(24px) }
                                to   { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}
