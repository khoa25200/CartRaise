"use client";

import { useCallback, useEffect, useState } from "react";
import { AppProvider, Page } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { CampaignForm } from "@/components/CampaignForm";
import {
  CampaignPreview,
  type CampaignPreviewData,
} from "@/components/CampaignPreview";

export default function DashboardPage() {
  const [shopDomain, setShopDomain] = useState("");
  const [campaign, setCampaign] = useState<CampaignPreviewData>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop")?.trim() ?? "";
    setShopDomain(shop);
  }, []);

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
      <Page title="Conversion Booster Lite" narrowWidth>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <CampaignPreview campaign={campaign} shopDomain={shopDomain} />
          <CampaignForm shopDomain={shopDomain} onSaved={refreshCampaign} />
        </div>
      </Page>
    </AppProvider>
  );
}
