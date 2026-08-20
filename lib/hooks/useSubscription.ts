"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

export type SubscriptionStatus = "free" | "active" | "trialing" | "past_due" | "canceled";

export type Subscription = {
  status: SubscriptionStatus;
  isPro: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  loading: boolean;
};

const DEFAULT: Subscription = {
  status: "free",
  isPro: false,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  loading: true,
};

export function useSubscription(): Subscription & { refresh: () => Promise<void> } {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription>(DEFAULT);

  const refresh = useCallback(async () => {
    if (!user) { setSub({ ...DEFAULT, loading: false }); return; }
    const client = getSupabaseClient();
    if (!client) { setSub({ ...DEFAULT, loading: false }); return; }

    const { data } = await client
      .from("subscriptions")
      .select("status, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    const status = (data?.status ?? "free") as SubscriptionStatus;
    setSub({
      status,
      isPro: status === "active" || status === "trialing",
      cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
      currentPeriodEnd: data?.current_period_end ? new Date(data.current_period_end) : null,
      loading: false,
    });
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...sub, refresh };
}
