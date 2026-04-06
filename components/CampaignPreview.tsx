"use client";

import { Banner, Card, Text } from "@shopify/polaris";

export type CampaignPreviewData = {
  threshold_amount: number;
  gift_variant_id: string;
  is_active: boolean;
  created_at?: string;
} | null;

type Props = {
  campaign: CampaignPreviewData;
  shopDomain: string;
  /** null = still loading install status */
  shopInstalled: boolean | null;
};

export function CampaignPreview({
  campaign,
  shopDomain,
  shopInstalled,
}: Props) {
  const installHref = shopDomain
    ? `/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}`
    : "";

  return (
    <Card>
      <div style={{ padding: "1rem" }}>
        <Text as="h2" variant="headingMd">
          Current campaign
        </Text>
        <div style={{ marginTop: "0.75rem" }}>
          {!shopDomain ? (
            <Banner tone="warning">
              Add <code>?shop=your-store.myshopify.com</code> to the URL after
              installing the app.
            </Banner>
          ) : shopInstalled === false ? (
            <Banner tone="critical" title="App install not completed">
              <p>
                Open the install link → merchant approves scopes → Shopify
                redirects to <code>/api/shopify/callback</code>, which saves the
                shop in Supabase. Skipping OAuth leaves no shop row, so saving
                the campaign fails.
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                <a href={installHref} target="_top" rel="noreferrer">
                  Install or reconnect CartRaise for {shopDomain}
                </a>{" "}
                (<code>target=&quot;_top&quot;</code> breaks out of the admin
                iframe for OAuth).
              </p>
            </Banner>
          ) : shopInstalled === true && !campaign ? (
            <Banner tone="info">
              No campaign saved yet. Set threshold and gift variant, then save.
            </Banner>
          ) : campaign ? (
            <>
              <Text as="p" variant="bodyMd">
                <strong>Shop:</strong> {shopDomain}
              </Text>
              <Text as="p" variant="bodyMd">
                <strong>Threshold:</strong> $
                {Number(campaign.threshold_amount).toFixed(2)}
              </Text>
              <Text as="p" variant="bodyMd">
                <strong>Gift variant ID:</strong> {campaign.gift_variant_id}
              </Text>
              <Text as="p" variant="bodyMd">
                <strong>Status:</strong>{" "}
                {campaign.is_active ? "Active" : "Inactive"}
              </Text>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
