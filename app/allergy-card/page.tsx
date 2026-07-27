"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { loadProfileAllergens, loadProfileSeverities } from "@/lib/allergenProfile";
import { ShowStaffCard } from "@/components/ShowStaffCard";
import type { AllergenId, AllergenSeverity } from "@/lib/types";

export default function AllergyCardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [allergens, setAllergens]   = useState<AllergenId[]>([]);
  const [severities, setSeverities] = useState<Partial<Record<AllergenId, AllergenSeverity>>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setAllergens(loadProfileAllergens() as AllergenId[]);
    setSeverities(loadProfileSeverities());
  }, []);

  if (loading || !user) return null;

  return (
    <ShowStaffCard
      allergens={allergens}
      severities={severities}
      onClose={() => router.back()}
    />
  );
}
