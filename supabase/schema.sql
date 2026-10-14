-- ============================================================================
-- DPC Gadget Hub — database schema
-- How to run: Supabase Dashboard → SQL Editor → New query → paste this
-- file's contents → Run. Safe to re-run (IF NOT EXISTS + policy drops).
-- NOTE: order creation uses the service-role key (bypasses RLS by design);
-- browser reads go through the anon key and are limited by the policies below.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- products --
create table if not exists public.products (
  id            uuid        primary key,
  name          text        not null,
  slug          text        not null unique,
  description   text        not null default '',
  price_ngn     integer     not null check (price_ngn >= 0),
  category      text        not null,
  image_urls    text[]      not null default '{}',
  stock         integer     not null default 0 check (stock >= 0),
  is_featured   boolean     not null default false,
  created_at    timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select using (true);

-- ------------------------------------------------------------------- carts --
create table if not exists public.carts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.carts enable row level security;
drop policy if exists "carts owner all" on public.carts;
create policy "carts owner all"
  on public.carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------- cart_items --
create table if not exists public.cart_items (
  id         uuid    primary key default gen_random_uuid(),
  cart_id    uuid    not null references public.carts (id) on delete cascade,
  product_id uuid    not null references public.products (id) on delete cascade,
  quantity   integer not null check (quantity >= 1 and quantity <= 99),
  unique (cart_id, product_id)
);
alter table public.cart_items enable row level security;
drop policy if exists "cart_items owner all" on public.cart_items;
create policy "cart_items owner all"
  on public.cart_items for all
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ));

-- ------------------------------------------------------------------ orders --
create table if not exists public.orders (
  id             uuid        primary key default gen_random_uuid(),
  order_number   text        not null unique,
  user_id        uuid        not null references auth.users (id) on delete cascade,
  status         text        not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method text        not null
    check (payment_method in ('pay_on_delivery', 'bank_transfer')),
  total_ngn      integer     not null check (total_ngn >= 0),
  full_name      text        not null,
  phone          text        not null,
  address        text        not null,
  city           text        not null,
  state          text        not null,
  note           text,
  created_at     timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "orders owner read" on public.orders;
create policy "orders owner read"
  on public.orders for select using (auth.uid() = user_id);

-- ------------------------------------------------------------- order_items --
create table if not exists public.order_items (
  id              uuid    primary key default gen_random_uuid(),
  order_id        uuid    not null references public.orders (id) on delete cascade,
  product_id      uuid    references public.products (id) on delete set null,
  name            text    not null,
  unit_price_ngn  integer not null check (unit_price_ngn >= 0),
  quantity        integer not null check (quantity >= 1)
);
alter table public.order_items enable row level security;
drop policy if exists "order_items owner read" on public.order_items;
create policy "order_items owner read"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- ------------------------------------------------------------ admin_emails --
-- Allow-list for /admin. Kept in sync with the ADMIN_EMAILS env var by
-- syncAdminEmail() on every OAuth sign-in (service role, non-fatal on error).
create table if not exists public.admin_emails (
  email      text        primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;
drop policy if exists "admin_emails owner read" on public.admin_emails;
create policy "admin_emails owner read"
  on public.admin_emails for select
  using (lower((auth.jwt() ->> 'email')::text) = email);
