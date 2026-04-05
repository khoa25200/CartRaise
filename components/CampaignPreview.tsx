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
};

export function CampaignPreview({ campaign, shopDomain }: Props) {
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
          ) : !campaign ? (
            <Banner tone="info">
              No campaign saved yet. Set threshold and gift variant, then save.
            </Banner>
          ) : (
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
          )}
        </div>
      </div>
    </Card>
  );
}
