export type ShopRow = {
  id: string;
  shop_domain: string;
  access_token: string;
  installed_at: string;
  plan: string;
  is_active: boolean;
};

export type CampaignRow = {
  id: string;
  shop_id: string;
  threshold_amount: number;
  gift_variant_id: string;
  is_active: boolean;
  created_at: string;
};

export type CartCheckInput = {
  shop_domain: string;
  cart_total: number;
};

export type CartCheckOutput = {
  progress: number;
  remaining: number;
  message: string;
  should_add_gift: boolean;
};

export type CampaignPayload = {
  shop_domain: string;
  threshold_amount: number;
  gift_variant_id: string;
  is_active: boolean;
};
