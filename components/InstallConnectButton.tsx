"use client";

import { Button } from "@shopify/polaris";
import {
  getOAuthInstallUrl,
  navigateToShopifyOAuth,
} from "@/lib/shopify-install-nav";

type Props = {
  shopDomain: string;
  variant?: "primary" | "secondary" | "plain";
  children?: string;
};

export function InstallConnectButton({
  shopDomain,
  variant = "primary",
  children = "Connect CartRaise",
}: Props) {
  return (
    <Button
      variant={variant}
      onClick={() => navigateToShopifyOAuth(getOAuthInstallUrl(shopDomain))}
    >
      {children}
    </Button>
  );
}
