"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadProfileAllergens, loadProfileSeverities } from "@/lib/allergenProfile";
import { ShowStaffCard } from "@/components/ShowStaffCard";
import type { AllergenId, AllergenSeverity } from "@/lib/types";

export default function AllergyCardPage() {
  const router = useRouter();
  const [allergens, setAllergens]   = useState<AllergenId[]>([]);
  const [severities, setSeverities] = useState<Partial<Record<AllergenId, AllergenSeverity>>>({});
  const [hydrated, setHydrated]     = useState(false);

  useEffect(() => {
    setAllergens(loadProfileAllergens() as AllergenId[]);
    setSeverities(loadProfileSeverities());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <main style={{ minHeight: "100dvh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#ef4444", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (allergens.length === 0) {
    return (
      <main style={{ minHeight: "100dvh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "Inter, -apple-system, Arial, sans-serif" }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginBottom: 20 }}>
          <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="1.5" />
          <path d="M12 8v4m0 4h.01" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 8, textAlign: "center" }}>
          No allergens set
        </div>
        <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 28, textAlign: "center", lineHeight: 1.5, maxWidth: 280 }}>
          Set up your allergy profile to generate a card you can show to restaurant staff.
        </div>
        <Link
          href="/"
          style={{ padding: "12px 24px", borderRadius: 14, background: "#ef4444", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}
        >
          Set up my profile →
        </Link>
      </main>
    );
  }

  return (
    <ShowStaffCard
      allergens={allergens}
      severities={severities}
      onClose={() => router.back()}
    />
  );
}
