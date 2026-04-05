-- Conversion Booster Lite — minimal schema

create extension if not exists "uuid-ossp";

create table if not exists public.shops (
  id uuid primary key default uuid_generate_v4(),
  shop_domain text not null unique,
  access_token text not null,
  installed_at timestamptz not null default now(),
  plan text not null default 'free',
  is_active boolean not null default true
);

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  threshold_amount numeric(12, 2) not null check (threshold_amount > 0),
  gift_variant_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id)
);

create index if not exists idx_campaigns_shop_id on public.campaigns (shop_id);

alter table public.shops enable row level security;
alter table public.campaigns enable row level security;

-- Service role bypasses RLS; no policies needed for server-only access.
