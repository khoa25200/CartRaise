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

  const refreshCampaign = useCallback(async () => {
    if (!shopDomain) {
      setCampaign(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/campaign?shop=${encodeURIComponent(shopDomain)}`
      );
      const data = (await res.json()) as {
        campaign?: CampaignPreviewData;
      };
      if (res.ok) {
        setCampaign(data.campaign ?? null);
      }
    } catch {
      setCampaign(null);
    }
  }, [shopDomain]);

  useEffect(() => {
    void refreshCampaign();
  }, [refreshCampaign]);

  return (
    <AppProvider i18n={enTranslations}>
      <Page title="CartRaise" narrowWidth>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <CampaignPreview campaign={campaign} shopDomain={shopDomain} />
          <CampaignForm shopDomain={shopDomain} onSaved={refreshCampaign} />
        </div>
      </Page>
    </AppProvider>
  );
}
