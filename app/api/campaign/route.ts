import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeShopDomain } from "@/lib/shopify";
import type { CampaignPayload } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const shopParam = new URL(request.url).searchParams.get("shop");
  const shopDomain = shopParam ? normalizeShopDomain(shopParam) : null;

  if (!shopDomain) {
    return NextResponse.json(
      { error: "Missing or invalid shop query parameter" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (shopErr) {
    return NextResponse.json({ error: shopErr.message }, { status: 500 });
  }
  if (!shop) {
    return NextResponse.json({ campaign: null });
  }

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (campErr) {
    return NextResponse.json({ error: campErr.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}

export async function POST(request: Request) {
  let body: Partial<CampaignPayload>;
  try {
    body = (await request.json()) as Partial<CampaignPayload>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shopDomain = body.shop_domain
    ? normalizeShopDomain(body.shop_domain)
    : null;
  const threshold =
    typeof body.threshold_amount === "number" ? body.threshold_amount : NaN;
  const giftVariantId =
    typeof body.gift_variant_id === "string"
      ? body.gift_variant_id.trim()
      : "";
  const isActive =
    typeof body.is_active === "boolean" ? body.is_active : true;

  if (!shopDomain || !Number.isFinite(threshold) || threshold <= 0) {
    return NextResponse.json(
      {
        error:
          "shop_domain and positive threshold_amount are required",
      },
      { status: 400 }
    );
  }
  if (!giftVariantId) {
    return NextResponse.json(
      { error: "gift_variant_id is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (shopErr) {
    return NextResponse.json({ error: shopErr.message }, { status: 500 });
  }
  if (!shop) {
    return NextResponse.json(
      { error: "Shop not installed" },
      { status: 404 }
    );
  }

  const { data: campaign, error: upsertErr } = await supabase
    .from("campaigns")
    .upsert(
      {
        shop_id: shop.id,
        threshold_amount: threshold,
        gift_variant_id: giftVariantId,
        is_active: isActive,
      },
      { onConflict: "shop_id" }
    )
    .select()
    .single();

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}
