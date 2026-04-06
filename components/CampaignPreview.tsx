"use client";

import { Banner, Card, EmptyState, Text } from "@shopify/polaris";
import {
  getOAuthInstallUrl,
  navigateToShopifyOAuth,
} from "@/lib/shopify-install-nav";

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
  return (
    <Card>
      <div style={{ padding: "1rem" }}>
        <Text as="h2" variant="headingMd">
          Current campaign
        </Text>
        <div style={{ marginTop: "0.75rem" }}>
          {!shopDomain ? (
            <EmptyState
              heading="Open CartRaise from Shopify admin"
              image="/install-empty-state.svg"
              imageContained
            >
              <p>
                This screen needs your store context. Install or open the app
                from <strong>Settings → Apps and sales channels</strong> so the
                URL includes <code>shop</code> (and <code>host</code> when
                embedded).
              </p>
            </EmptyState>
          ) : shopInstalled === false ? (
            <EmptyState
              heading="Connect CartRaise to this store"
              image="/install-empty-state.svg"
              imageContained
              action={{
                content: "Connect store",
                onAction: () =>
                  navigateToShopifyOAuth(getOAuthInstallUrl(shopDomain)),
              }}
              footerContent={
                <p style={{ marginTop: "0.5rem" }}>
                  You’ll approve app access, then Shopify returns you here. Uses
                  the same browser window (Shopify admin navigation pattern).
                </p>
              }
            >
              <p>
                Link <strong>{shopDomain}</strong> so CartRaise can store your
                settings and use the scopes you approved in the Partner app.
              </p>
            </EmptyState>
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
