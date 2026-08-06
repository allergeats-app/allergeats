"use client";

import { useEffect, useState } from "react";
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

export function useSubscription(): Subscription {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription>(DEFAULT);

  useEffect(() => {
    if (!user) {
      setSub({ ...DEFAULT, loading: false });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSub({ ...DEFAULT, loading: false });
      return;
    }

    async function load() {
      const { data } = await client!
        .from("subscriptions")
        .select("status, cancel_at_period_end, current_period_end")
        .eq("user_id", user!.id)
        .maybeSingle();

      const status = (data?.status ?? "free") as SubscriptionStatus;
      setSub({
        status,
        isPro: status === "active" || status === "trialing",
        cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
        currentPeriodEnd: data?.current_period_end ? new Date(data.current_period_end) : null,
        loading: false,
      });
    }

    load();

    // Live updates when webhook writes to Supabase
    const channel = client
      .channel(`sub:${user.id}:${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const status = (row.status ?? "free") as SubscriptionStatus;
          setSub({
            status,
            isPro: status === "active" || status === "trialing",
            cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
            currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end as string) : null,
            loading: false,
          });
        }
      )
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, [user]);

  return sub;
}
