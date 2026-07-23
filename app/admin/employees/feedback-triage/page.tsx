"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentConsole } from "@/components/admin/AgentConsole";
import { useAgentStream } from "@/lib/hooks/useAgentStream";
import { getAllFeedback } from "@/lib/learning/feedbackStore";
import type { AgentAction } from "@/components/admin/AgentConsole";
import type { CandidateRule } from "@/lib/learning/types";

const SESSION_KEY   = "allegeats_admin_authed";
const RULES_KEY     = "allegeats_candidate_rules";

function loadRules(): CandidateRule[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RULES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveRules(rules: CandidateRule[]): void {
  try { localStorage.setItem(RULES_KEY, JSON.stringify(rules)); } catch { }
}

export default function FeedbackTriagePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ctx, setCtx]     = useState("");

  const { running, streamText, actions, run, resolve } = useAgentStream(
    "/api/admin/agent/feedback-triage"
  );

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1" || !sessionStorage.getItem("allegeats_admin_token")) {
      sessionStorage.removeItem(SESSION_KEY);
      router.replace("/admin");
      return;
    }
    const feedback = getAllFeedback();
    const rules    = loadRules();
    const ready_   = rules.filter(r => !r.conflicted && (r.trustWeightTotal >= 8 || r.trustWeightTotal >= 4)).length;
    setCtx(`${feedback.length} feedback entries · ${rules.length} candidate rules · ${ready_} ready to review`);
    setReady(true);
  }, [router]);

  function handleRun() {
    const feedback = getAllFeedback();
    const rules    = loadRules();
    run({ feedback, rules });
  }

  function handleApprove(action: AgentAction) {
    if (action.type === "promote_rule" || action.type === "reject_rule") {
      const d = action.details as { ruleId: string; newStatus?: string };
      const rules = loadRules();
      const updated = rules.map(r => {
        if (r.id !== d.ruleId) return r;
        return {
          ...r,
          status: action.type === "promote_rule"
            ? ((d.newStatus as CandidateRule["status"]) ?? "validated")
            : "rejected" as CandidateRule["status"],
        };
      });
      saveRules(updated);
    }
    resolve(action.id, "approved");
  }

  if (!ready) return null;

  return (
    <AgentConsole
      name="Feedback Triager"
      emoji="🗂️"
      role="Reviews user feedback and candidate rules — promotes strong patterns, rejects weak ones"
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
