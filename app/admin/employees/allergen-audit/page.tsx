"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentConsole } from "@/components/admin/AgentConsole";
import { useAgentStream } from "@/lib/hooks/useAgentStream";
import { getAllCorrections, saveCorrection, correctionCount } from "@/lib/adminCorrections";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import type { AgentAction } from "@/components/admin/AgentConsole";
import type { AllergenId } from "@/lib/types";

const SESSION_KEY = "allegeats_admin_authed";

export default function AllergenAuditPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ctx, setCtx]     = useState("");

  const { running, streamText, actions, run, resolve } = useAgentStream(
    "/api/admin/agent/allergen-audit"
  );

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1" || !sessionStorage.getItem("allegeats_admin_token")) {
      sessionStorage.removeItem(SESSION_KEY);
      router.replace("/admin");
      return;
    }
    const totalItems = MOCK_RESTAURANTS.reduce((n, r) => n + r.menuItems.length, 0);
    const cCount = correctionCount();
    setCtx(`${MOCK_RESTAURANTS.length} restaurants · ${totalItems} items · ${cCount} existing corrections`);
    setReady(true);
  }, [router]);

  function handleRun() {
    run({ corrections: getAllCorrections() });
  }

  function handleApprove(action: AgentAction) {
    if (action.type === "propose_correction") {
      const d = action.details as {
        restaurantId: string;
        itemId: string;
        proposedAllergens: string[];
        reason?: string;
      };
      saveCorrection({
        restaurantId: d.restaurantId,
        itemId: d.itemId,
        allergens: (d.proposedAllergens ?? []) as AllergenId[],
        auditNotes: d.reason ? `AI Auditor: ${d.reason}` : "AI Auditor suggestion",
        verifiedAt: new Date().toISOString(),
      });
    }
    resolve(action.id, "approved");
  }

  if (!ready) return null;

  return (
    <AgentConsole
      name="Allergen Auditor"
      emoji="🔍"
      role="Reviews menu items for allergen data gaps — proposes corrections based on ingredient knowledge"
      contextLabel={ctx}
      running={running}
      streamText={streamText}
      actions={actions}
      onRun={handleRun}
      onApprove={handleApprove}
      onReject={a => resolve(a.id, "rejected")}
    />
  );
}
