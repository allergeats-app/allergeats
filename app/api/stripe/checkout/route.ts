import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  // Retrieve or create Stripe customer
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      status: "free",
    });
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?upgraded=1`,
      cancel_url: `${origin}/profile`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe session creation failed";
    console.error("[stripe/checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
