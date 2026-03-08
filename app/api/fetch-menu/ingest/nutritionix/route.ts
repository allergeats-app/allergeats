import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query } = await req.json();

  const res = await fetch("https://trackapi.nutritionix.com/v2/search/instant?query=" + encodeURIComponent(query), {
    headers: {
      "x-app-id": process.env.NUTRITIONIX_APP_ID!,
      "x-app-key": process.env.NUTRITIONIX_APP_KEY!
    }
  });

  const data = await res.json();

  return NextResponse.json({ ok: true, data });
}