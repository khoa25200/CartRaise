"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppProvider, Page } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { CampaignForm } from "@/components/CampaignForm";
import {
  CampaignPreview,
  type CampaignPreviewData,
} from "@/components/CampaignPreview";
import { resolveEmbeddedShop } from "@/lib/embedded-shop";

export function DashboardClient() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const host = searchParams.get("host");
  const shopDomain = useMemo(
    () => resolveEmbeddedShop(shop, host),
    [shop, host]
  );

  const [campaign, setCampaign] = useState<CampaignPreviewData>(null);
  /** null = not loaded yet; false = OAuth never saved shop to Supabase */
  const [shopInstalled, setShopInstalled] = useState<boolean | null>(null);

  const refreshCampaign = useCallback(async () => {
    if (!shopDomain) {
      setCampaign(null);
      setShopInstalled(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/campaign?shop=${encodeURIComponent(shopDomain)}`
      );
      const data = (await res.json()) as {
        campaign?: CampaignPreviewData;
        shop_installed?: boolean;
        error?: string;
      };
      if (res.ok) {
        setCampaign(data.campaign ?? null);
        setShopInstalled(Boolean(data.shop_installed));
      } else {
        setCampaign(null);
        setShopInstalled(null);
      }
    } catch {
      setCampaign(null);
      setShopInstalled(null);
    }
  }, [shopDomain]);

  useEffect(() => {
    void refreshCampaign();
  }, [refreshCampaign]);

  return (
    <AppProvider i18n={enTranslations}>
      <Page title="CartRaise" narrowWidth>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <CampaignPreview
            campaign={campaign}
            shopDomain={shopDomain}
            shopInstalled={shopInstalled}
          />
          <CampaignForm
            shopDomain={shopDomain}
            shopInstalled={shopInstalled}
            onSaved={refreshCampaign}
          />
        </div>
      </Page>
    </AppProvider>
  );
}
