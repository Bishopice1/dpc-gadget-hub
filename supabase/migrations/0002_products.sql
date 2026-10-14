-- 0002_products.sql
-- Product catalogue. Publicly readable; writes restricted to admins (RLS in 0005).

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_ngn integer not null check (price_ngn >= 0),
  category text not null
    check (category in ('phones', 'laptops', 'audio', 'accessories')),
  image_urls text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.products.price_ngn is 'Price in whole Nigerian Naira (no kobo).';

create index if not exists products_category_idx
  on public.products (category);
create index if not exists products_created_at_idx
  on public.products (created_at desc);
create index if not exists products_featured_idx
  on public.products (is_featured) where is_featured = true;
create index if not exists products_search_idx
  on public.products using gin (to_tsvector('simple', name || ' ' || description));