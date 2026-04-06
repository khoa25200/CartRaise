import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeShopDomain } from "@/lib/shopify";
export const dynamic = "force-dynamic";

type CampaignJson = Record<string, unknown>;

function parsePositiveThreshold(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseFloat(value.trim().replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function normalizeShopFromBody(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value.trim() : String(value).trim();
  if (!s) return null;
  return normalizeShopDomain(s);
}

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
    return NextResponse.json({
      campaign: null,
      shop_installed: false,
    });
  }

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (campErr) {
    return NextResponse.json({ error: campErr.message }, { status: 500 });
  }

  return NextResponse.json({
    campaign,
    shop_installed: true,
  });
}

export async function POST(request: Request) {
  let body: CampaignJson;
  try {
    body = (await request.json()) as CampaignJson;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shopDomain = normalizeShopFromBody(body.shop_domain);
  const threshold = parsePositiveThreshold(body.threshold_amount);
  const giftVariantId =
    body.gift_variant_id == null
      ? ""
      : String(body.gift_variant_id).trim();
  const isActive = (() => {
    const v = body.is_active;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "false" || s === "0") return false;
      if (s === "true" || s === "1") return true;
    }
    return true;
  })();

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
    const installPath = `/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}`;
    return NextResponse.json(
      {
        error:
          "Shop not in database — finish OAuth install first (Merchant approves app, callback saves the shop).",
        code: "SHOP_NOT_INSTALLED",
        install_path: installPath,
      },
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
