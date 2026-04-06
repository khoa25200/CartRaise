import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { calculateCartProgress } from "@/lib/logic";
import { normalizeShopDomain } from "@/lib/shopify";
export const dynamic = "force-dynamic";

type CartCheckJson = Record<string, unknown>;

function parseCartTotal(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseFloat(value.trim().replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function shopFromBody(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value.trim() : String(value).trim();
  return s ? normalizeShopDomain(s) : null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  let body: CartCheckJson;
  try {
    body = (await request.json()) as CartCheckJson;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  const shopDomain = shopFromBody(body.shop_domain);
  const cartTotal = parseCartTotal(body.cart_total);

  if (!shopDomain || !Number.isFinite(cartTotal)) {
    return NextResponse.json(
      { error: "shop_domain and cart_total are required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id, is_active")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (shopErr) {
    return NextResponse.json(
      { error: shopErr.message },
      { status: 500, headers: corsHeaders }
    );
  }
  if (!shop || !shop.is_active) {
    return NextResponse.json(
      {
        progress: 0,
        remaining: 0,
        message: "Store not connected.",
        should_add_gift: false,
      },
      { headers: corsHeaders }
    );
  }

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("threshold_amount, gift_variant_id, is_active")
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (campErr) {
    return NextResponse.json(
      { error: campErr.message },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!campaign || !campaign.is_active) {
    return NextResponse.json(
      {
        progress: 0,
        remaining: 0,
        message: "No active campaign.",
        should_add_gift: false,
      },
      { headers: corsHeaders }
    );
  }

  const threshold = Number(campaign.threshold_amount);
  const { progress, remaining, message } = calculateCartProgress(
    cartTotal,
    threshold
  );

  const should_add_gift = cartTotal >= threshold;

  return NextResponse.json(
    {
      progress,
      remaining,
      message,
      should_add_gift,
    },
    { headers: corsHeaders }
  );
}
