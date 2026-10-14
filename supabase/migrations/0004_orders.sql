-- 0004_orders.sql
-- Orders + immutable line-item snapshots. Created exclusively server-side
-- with the service role key (stock check + decrement + price recompute).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null
    check (payment_method in ('pay_on_delivery', 'bank_transfer')),
  total_ngn integer not null check (total_ngn >= 0),
  -- Delivery details
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.orders is 'Orders are inserted only by the service role; clients may read their own rows.';

create index if not exists orders_user_id_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx
  on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  unit_price_ngn integer not null check (unit_price_ngn >= 0),
  quantity integer not null check (quantity > 0)
);

comment on column public.order_items.name is 'Product name snapshot at time of order.';
comment on column public.order_items.unit_price_ngn is 'Price snapshot at time of order, in Naira.';

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);