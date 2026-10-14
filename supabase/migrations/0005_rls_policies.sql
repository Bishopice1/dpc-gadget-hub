-- 0005_rls_policies.sql
-- Row Level Security for every table.
-- Ownership rules:
--   * profiles / carts / cart_items: owners only.
--   * orders / order_items: users can read their own; all writes happen
--     server-side via the service role (which bypasses RLS), so stock checks
--     and price recomputation cannot be skipped by a crafted client request.
--   * products: public read; writes only for admins (is_admin()).

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

-- Least privilege: no client role may touch the admin list directly.
revoke all on table public.admin_emails from anon, authenticated;
-- (Apply migrations as the table owner / postgres so the service role and
-- SECURITY DEFINER functions keep full access.)

-- SECURITY DEFINER so it can read admin_emails even though that table has no
-- client policies. Checks the JWT email claim against the admin list.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_emails a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
  on public.products for delete
  to authenticated
  using (public.is_admin());
-- ---------------------------------------------------------------------------
-- carts + cart_items
-- ---------------------------------------------------------------------------
alter table public.carts enable row level security;

drop policy if exists "carts_select_own" on public.carts;
create policy "carts_select_own"
  on public.carts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own"
  on public.carts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own"
  on public.carts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_delete_own"
  on public.carts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
  on public.cart_items for select
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ));

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
  on public.cart_items for insert
  to authenticated
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ));

drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own"
  on public.cart_items for update
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ));

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own"
  on public.cart_items for delete
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- orders + order_items (read own; writes are service-role only by design)
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

-- admin_emails has no client policies: only the service role (bypasses RLS)
-- and the SECURITY DEFINER is_admin() function can read it.