"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banner,
  Button,
  Card,
  FormLayout,
  Select,
  TextField,
} from "@shopify/polaris";

type Props = {
  shopDomain: string;
  onSaved: () => void;
};

export function CampaignForm({ shopDomain, onSaved }: Props) {
  const [threshold, setThreshold] = useState("");
  const [giftVariantId, setGiftVariantId] = useState("");
  const [isActive, setIsActive] = useState("true");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!shopDomain) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/campaign?shop=${encodeURIComponent(shopDomain)}`
      );
      const data = (await res.json()) as {
        campaign?: {
          threshold_amount: number;
          gift_variant_id: string;
          is_active: boolean;
        } | null;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to load campaign");
        return;
      }
      if (data.campaign) {
        setThreshold(String(data.campaign.threshold_amount));
        setGiftVariantId(data.campaign.gift_variant_id);
        setIsActive(data.campaign.is_active ? "true" : "false");
      }
    } catch {
      setError("Failed to load campaign");
    }
  }, [shopDomain]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    if (!shopDomain.trim()) {
      setError("Missing shop. Open the dashboard with ?shop=your-store.myshopify.com");
      return;
    }
    const thresholdNum = parseFloat(threshold.replace(",", "."));
    if (!Number.isFinite(thresholdNum) || thresholdNum <= 0) {
      setError("Enter a valid threshold amount.");
      return;
    }
    if (!giftVariantId.trim()) {
      setError("Enter a gift variant ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_domain: shopDomain,
          threshold_amount: thresholdNum,
          gift_variant_id: giftVariantId.trim(),
          is_active: isActive === "true",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSuccess(true);
      onSaved();
    } catch {
      setError("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ padding: "1rem" }}>
        {error ? (
          <div style={{ marginBottom: "1rem" }}>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </div>
        ) : null}
        {success ? (
          <div style={{ marginBottom: "1rem" }}>
            <Banner tone="success" onDismiss={() => setSuccess(false)}>
              Campaign saved.
            </Banner>
          </div>
        ) : null}
        <FormLayout>
          <TextField
            label="Threshold amount ($)"
            type="number"
            value={threshold}
            onChange={setThreshold}
            autoComplete="off"
            min={0}
            step={0.01}
          />
          <TextField
            label="Gift variant ID"
            value={giftVariantId}
            onChange={setGiftVariantId}
            autoComplete="off"
            helpText="Numeric variant ID from Shopify admin product variant URL."
          />
          <Select
            label="Campaign status"
            options={[
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ]}
            value={isActive}
            onChange={setIsActive}
          />
          <Button variant="primary" onClick={handleSave} loading={loading}>
            Save campaign
          </Button>
        </FormLayout>
      </div>
    </Card>
  );
}
