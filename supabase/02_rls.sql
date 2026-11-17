-- ════════════════════════════════════════════════════════════════════
--  DORIKA — Row Level Security + Storage
--  File 2 of 3:  run AFTER 01_schema.sql
-- ════════════════════════════════════════════════════════════════════

-- Enable RLS on every table ------------------------------------------
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.order_events     enable row level security;
alter table public.custom_requests  enable row level security;
alter table public.custom_events    enable row level security;
alter table public.contact_messages enable row level security;
alter table public.addresses        enable row level security;
alter table public.wishlist         enable row level security;
alter table public.settings         enable row level security;

-- ────────────────────────────────────────��────────────────────────────
--  PROFILES
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────
--  CATEGORIES & PRODUCTS  → public read, admin write
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (is_active or public.is_admin());

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (is_active or public.is_admin());

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
--  ORDERS
--  • Guests create orders via the SERVICE ROLE (server action) → bypasses RLS.
--  • Signed-in users can read their own orders.
--  • Admins can do everything.
--  • Public order tracking is done through a SECURITY DEFINER function
--    (track_order) so no broad select policy is needed.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o
               where o.id = order_items.order_id and o.user_id = auth.uid())
  );
drop policy if exists order_items_admin_write on public.order_items;
create policy order_items_admin_write on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o
               where o.id = order_events.order_id and o.user_id = auth.uid())
  );
drop policy if exists order_events_admin_write on public.order_events;
create policy order_events_admin_write on public.order_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
--  CUSTOM REQUESTS  (same model as orders)
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists custom_owner_read on public.custom_requests;
create policy custom_owner_read on public.custom_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists custom_admin_write on public.custom_requests;
create policy custom_admin_write on public.custom_requests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists custom_events_read on public.custom_events;
create policy custom_events_read on public.custom_events
  for select using (
    public.is_admin()
    or exists (select 1 from public.custom_requests c
               where c.id = custom_events.request_id and c.user_id = auth.uid())
  );
drop policy if exists custom_events_admin_write on public.custom_events;
create policy custom_events_admin_write on public.custom_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
--  CONTACT MESSAGES  → insert handled server-side (service role); admin read
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists contact_admin_all on public.contact_messages;
create policy contact_admin_all on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
--  ADDRESSES & WISHLIST  → owner only
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists addresses_owner on public.addresses;
create policy addresses_owner on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists wishlist_owner on public.wishlist;
create policy wishlist_owner on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
--  SETTINGS  → public read, admin write
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using (true);

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════
--  PUBLIC TRACKING FUNCTIONS  (SECURITY DEFINER — no account needed)
--  Guests look up an order/request with ID + phone.  Returns only
--  safe fields + the status timeline.  Rate-limit at the app layer.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.track_order(p_order_no text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare o public.orders; evts jsonb;
begin
  select * into o from public.orders
  where upper(order_no) = upper(trim(p_order_no))
    and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;

  if o.id is null then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'status', e.status, 'note', e.note, 'created_at', e.created_at
         ) order by e.created_at), '[]'::jsonb)
  into evts from public.order_events e where e.order_id = o.id;

  return jsonb_build_object(
    'type','order',
    'order_no', o.order_no,
    'customer_name', o.customer_name,
    'status', o.status,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'total', o.total,
    'created_at', o.created_at,
    'events', evts
  );
end $$;

create or replace function public.track_custom(p_request_no text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare c public.custom_requests; evts jsonb;
begin
  select * into c from public.custom_requests
  where upper(request_no) = upper(trim(p_request_no))
    and regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;

  if c.id is null then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'status', e.status, 'note', e.note, 'created_at', e.created_at
         ) order by e.created_at), '[]'::jsonb)
  into evts from public.custom_events e where e.request_id = c.id;

  return jsonb_build_object(
    'type','custom',
    'order_no', c.request_no,
    'customer_name', c.full_name,
    'status', c.status,
    'payment_status', c.payment_status,
    'price', c.price,
    'created_at', c.created_at,
    'events', evts
  );
end $$;

-- Allow anonymous + authenticated to call the tracking functions
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.track_custom(text, text) to anon, authenticated;

-- Link guest orders to an account after signup (matched by phone/email)
create or replace function public.link_guest_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare u_email text; u_phone text;
begin
  select email, phone into u_email, u_phone from public.profiles where id = auth.uid();

  update public.orders set user_id = auth.uid()
   where user_id is null
     and ( (u_email is not null and lower(email) = lower(u_email))
        or (u_phone is not null and regexp_replace(phone,'\D','','g') = regexp_replace(u_phone,'\D','','g')) );

  update public.custom_requests set user_id = auth.uid()
   where user_id is null
     and ( (u_email is not null and lower(email) = lower(u_email))
        or (u_phone is not null and regexp_replace(phone,'\D','','g') = regexp_replace(u_phone,'\D','','g')) );
end $$;
grant execute on function public.link_guest_orders() to authenticated;

-- ════════════════════════════════════════════════════════════════════
--  STORAGE BUCKETS
--  • product-images : PUBLIC  (anyone can read; admin writes)
--  • custom-photos  : PRIVATE (admin-only; served via signed URLs)
-- ════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('product-images','product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('custom-photos','custom-photos', false)
on conflict (id) do nothing;

-- product-images: public read, admin write
drop policy if exists product_images_read on storage.objects;
create policy product_images_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_admin_write on storage.objects;
create policy product_images_admin_write on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- custom-photos: admin-only read/write. Guest uploads happen via the
-- service role in a server action; customers never read this bucket.
drop policy if exists custom_photos_admin on storage.objects;
create policy custom_photos_admin on storage.objects
  for all using (bucket_id = 'custom-photos' and public.is_admin())
  with check (bucket_id = 'custom-photos' and public.is_admin());
