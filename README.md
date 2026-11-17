# Dorika — handmade string art store

A complete, production-shaped e-commerce site for **Dorika**, a string-art studio in
Khairenitar, Tanahun, Nepal. Built as a single Next.js App Router application with a
Supabase (Postgres + Auth + Storage) backend.

The storefront is **guest-first**: anyone can browse, buy and track an order without ever
creating an account. A customer account is offered only as a convenience afterwards.

---

## 1. Business facts baked into the app

These live in `src/lib/config.ts` and the `settings` table — change them there, not in components.

| Item | Value |
|---|---|
| Store | Dorika |
| Phone / WhatsApp | `9708285877` → `https://wa.me/9779708285877` |
| Email | `shopdorika@gmail.com` |
| Location | Khairenitar, Tanahun, Nepal |
| Currency | NPR, rendered as `Rs.` with `en-IN` (lakh/crore) grouping |
| Signature product | Custom String Face Art — **45 cm diameter round plank**, default **Rs. 3,500**, **7–10 days** to make |

Brand palette (extracted from the supplied logo, `../gemini-svg.svg`):

| Token | Hex | Use |
|---|---|---|
| Charcoal | `#24272B` | Wordmark, headings, dark surfaces |
| Terracotta | `#C55A29` | Thread accent, primary CTA, links, active states |
| White / Cream | `#FFFFFF` / `#FBF8F4` | Backgrounds |
| WhatsApp green | `#25D366` | Floating WhatsApp button only |

Typography: **Nunito** (body) and **Quicksand** (display), via `next/font/google`.
The logo is reconstructed as live SVG in `src/components/logo.tsx` so it scales and
recolours on dark surfaces.

---

## 2. What's included

### Public storefront
- **Home** — hero from `settings`, featured products, how-it-works (4 steps), categories,
  testimonials, "why Dorika", contact CTA banner.
- **Shop** — search, category filter, sort, pagination (9/page), URL-synced state.
- **Product page** — gallery, price/compare-at, stock, quantity stepper, wishlist,
  related products, `generateMetadata` + static params.
- **Custom art builder** — multi-step photo upload with client-side compression,
  delivery details, preference fields, Turnstile, honeypot, 10 MB / JPG-PNG-WEBP limits.
- **Cart & guest checkout** — cart drawer + `/cart`, four payment methods gated by settings,
  live delivery-fee summary, no login required.
- **Order confirmation** — order ID, "Confirm on WhatsApp" (ID prefilled), track link, and a
  *soft, optional* signup prompt.
- **Order tracking** — order ID + phone, status timeline, works signed-out.
- **About, Contact (map + form), FAQ, Privacy, Terms, Shipping, Wishlist, 404.**
- **SEO** — metadata/OG/Twitter, `sitemap.ts`, `robots.ts` (disallows `/admin`, `/account`, `/api`).

### Admin back office (`/admin`)
Cookie-guarded, role-checked (`profiles.role = 'admin'`) in middleware **and** in the panel layout.

- **Dashboard** — revenue and order stats, Recharts sales chart (14d / 8w / 6m), low-stock list, recent orders.
- **Orders** — search/filter/paginate, detail with status timeline, payment update, WhatsApp
  hand-off, and a printable A4 invoice (`/admin/orders/[id]/invoice`).
- **Custom requests** — signed-URL photo thumbnails, detail view, status + price + internal notes.
- **Products** — list plus create/edit with multi-image upload to the public `product-images` bucket.
- **Categories** — full CRUD.
- **Customers** — registered accounts and guest buyers merged into one view.
- **Messages** — contact-form inbox with read/unread.
- **Payments** — payment-status overview across orders.
- **Settings** — singleton row that feeds the storefront (hero copy, delivery fee, free-delivery
  threshold, custom-art price/days, payment toggles).
- **CSV export** — `/api/admin/export?type=orders|sales`.

### Customer account area (`/account`) — optional
- `/account/auth/login`, `/account/auth/signup`, `/account/auth/reset`
- `/account/auth/callback` — Route Handler that exchanges Supabase confirmation/recovery links
  (PKCE `code` **or** `token_hash` OTP) for a session cookie.
- `/account` — overview: order count, total spent, custom requests, addresses, recent orders.
- `/account/orders` — filterable list; `/account/orders/[orderNo]` — items, totals, delivery
  address, status timeline, WhatsApp help.
- `/account/custom-requests` — request history (uploaded photos stay private; never rendered here).
- `/account/profile` — name + mobile (the mobile is what re-links past guest orders), password reset.
- `/account/addresses` — add / edit / delete address book, one default at a time.

**Guest-order linking:** after signup or login the app calls the `link_guest_orders()` SQL
function, which attaches any earlier guest orders/requests that match the account's phone or
email. Customers can also trigger it manually from the overview ("Attach my past orders").

---

## 3. Stack and why

**Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.**

- **Supabase over Firebase** — the hardest requirement is *"uploaded customer photos must be
  private and admin-only, served via signed URLs."* Supabase Storage supports RLS policies
  directly on storage objects plus time-limited signed URLs; Firebase Storage relies on security
  rules and download tokens, a poorer fit.
- **Postgres RLS** cleanly enforces "a guest can track an order but cannot read the `orders`
  table". Public tracking goes through two `SECURITY DEFINER` functions (`track_order`,
  `track_custom`) instead of a broad `SELECT` policy.
- **One admin pattern** — `profiles.role` + an `is_admin()` helper protects both tables and buckets.
- **Auth only where it pays for itself** — Supabase Auth is used purely as an identity provider
  for admins and (optional) customers. Guests never touch it.

Installed versions: `next@14.2.15`, `react@18.3.1`, `@supabase/ssr@0.5.2`,
`@supabase/supabase-js@2.45.4`, `tailwindcss@3.4.13`, `recharts@2.12.7`,
`lucide-react@0.447.0`, `browser-image-compression@2.0.2`, `clsx`, `tailwind-merge`.

> ⚠️ `next@14.2.15` carries a known security advisory. Before going live, bump to the newest
> patched 14.2.x (`npm i next@14.2.33`-or-later within the 14.2 line) and re-run the build.
> Upgrading to Next 15 also requires making `cookies()`/`headers()` async in
> `src/lib/supabase/server.ts`.

---

## 4. Quick start

```powershell
cd "C:\Users\ASUS\Desktop\STRING ART\dorika"
npm install                 # 439 packages
Copy-Item .env.example .env.local   # then fill in the values
npm run dev                 # http://localhost:3000
```

### 4.1 Create the database

In the Supabase dashboard → **SQL Editor**, run these files **in order**:

1. `supabase/01_schema.sql` — extensions, 5 enums, 12 tables, indexes, `is_admin()`,
   `handle_new_user()` trigger, `touch_updated_at()` triggers.
2. `supabase/02_rls.sql` — RLS on every table, all policies, `track_order()` / `track_custom()` /
   `link_guest_orders()` functions, both storage buckets (`product-images` public,
   `custom-photos` private) and their storage policies.
3. `supabase/03_seed.sql` — 4 categories and 12 demo products.

### 4.2 Create the admin user

1. Supabase → **Authentication → Users → Add user** (email + password, "Auto confirm").
2. Promote that user to admin:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

The `handle_new_user()` trigger also promotes any account created with the email stored in the
database setting `app.admin_email` (optional alternative):

```sql
alter database postgres set app.admin_email = 'you@example.com';
```

### 4.3 Auth redirect URLs

In **Authentication → URL Configuration**, add:

```
http://localhost:3000/account/auth/callback
https://yourdomain.com/account/auth/callback
```

Both email confirmation and password-recovery links land on that Route Handler.

### 4.4 Scripts

```powershell
npm run dev        # dev server
npm run build      # production build
npm start          # serve the build
npm run lint       # eslint (next/core-web-vitals)
npm run typecheck  # tsc --noEmit
```

---

## 5. Environment variables

Copy `.env.example` → `.env.local`. Only the first block is required; everything else degrades
gracefully.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for writes | Server-only; bypasses RLS for guest order/photo inserts and admin actions |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical URL, OG tags, auth email redirects |
| `ADMIN_EMAIL` | optional | Reference email for admin bootstrap |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | optional | Cloudflare Turnstile; blank = skip (honeypot + rate limiting stay active) |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional | Resend for confirmation emails; blank = log to server console |
| `NEXT_PUBLIC_ESEWA_MERCHANT_CODE` / `ESEWA_SECRET_KEY` | optional | eSewa (scaffolded, not live) |
| `NEXT_PUBLIC_KHALTI_PUBLIC_KEY` / `KHALTI_SECRET_KEY` | optional | Khalti (scaffolded, not live) |
| `NEXT_PUBLIC_BANK_NAME` / `_ACCOUNT_NAME` / `_ACCOUNT_NUMBER` / `_QR_IMAGE_URL` | optional | Displayed on bank-transfer checkout |

**No Supabase keys?** The site still builds and runs: the storefront renders, `/account` shows a
"connect Supabase" notice instead of a login form, and admin routes bounce to `/admin/login`.
`isSupabaseConfigured()` in `src/lib/env.ts` is the single switch.

---

## 6. Security model

- **RLS everywhere.** `orders`, `order_items`, `order_events`, `custom_requests`, `custom_events`,
  `addresses`, `wishlist` and `profiles` are owner-scoped; products/categories/settings are public
  read + admin write.
- **Public tracking without opening the tables.** `track_order` / `track_custom` are
  `SECURITY DEFINER`, require the order ID *and* the phone number, and return only safe fields.
- **Prices are never trusted from the client.** `/api/orders` re-reads every line from the
  database and recomputes subtotal, delivery fee and total server-side.
- **Private photos.** Customer uploads go to the non-public `custom-photos` bucket. The upload
  happens with the service role from a server route; the admin panel reads them through
  short-lived signed URLs. Customers can never read that bucket — including their own account area.
- **Upload validation** is enforced on the server (MIME type JPG/PNG/WEBP, ≤ 10 MB), not just in
  the browser, and a failed insert cleans up the orphaned object.
- **Spam defence.** Fixed-window rate limiting per IP on every write endpoint (`/api/orders` 8/min,
  `/api/custom-requests` 5/min, `/api/contact` 5/min, `/api/track` 15/min), a honeypot field
  (`company_website`, visually hidden via `.hp-field`), and optional Turnstile.
- **Admin guard twice over.** Middleware redirects non-admins, and `requireAdmin()` re-checks in
  the panel layout — a stale cookie cannot leak data through RSC payloads.
- **Middleware scope.** Session refresh runs only on `/admin/:path*` and `/account/:path*`, so
  anonymous storefront traffic never pays for Supabase auth round-trips.

---

## 7. Route map

```
/                          home
/shop                      listing (search · category · sort · page)
/product/[slug]            detail
/custom-art                custom art builder
/cart  /checkout           guest cart + checkout
/order-confirmation        post-order (optional signup prompt)
/track                     public order tracking
/about /contact /faq /privacy /terms /shipping /wishlist
/account                   overview            (auth)
/account/orders            list + [orderNo]    (auth)
/account/custom-requests   list                (auth)
/account/profile           edit                (auth)
/account/addresses         CRUD                (auth)
/account/auth/login|signup|reset|callback      (public)
/admin                     dashboard           (admin)
/admin/orders  /[id]  /[id]/invoice
/admin/custom-requests /[id]
/admin/products  /new  /[id]/edit
/admin/categories /customers /messages /payments /settings
/admin/login
/api/orders /api/custom-requests /api/contact /api/track /api/wishlist
/api/admin/export
```

---

## 8. Project layout

```
src/
  app/
    (public)/            storefront + /account (shares navbar/footer)
    admin/               back office (own sidebar layout)
    api/                 route handlers
    layout.tsx           fonts, metadata, providers
    globals.css          Tailwind layers + .btn-*/.input/.card/.badge utilities
  components/
    account/             auth shell, account nav, shared tiles
    admin/               sidebar, filters, product form, chart, badges
    home/ shop/ product/ checkout/ custom-art/ track/ ui/
  lib/
    config.ts            brand + business constants (single source of truth)
    types.ts             DB-mirroring TypeScript types
    utils.ts             cn, formatNPR, order numbers, status maps, validators
    queries.ts           public reads (safe fallbacks if Supabase is unset)
    account-queries.ts   RLS-scoped customer reads
    admin-queries.ts     admin aggregates
    security.ts          rate limiting, honeypot, Turnstile
    email.ts             Resend wrapper + templated HTML
    auth.ts              getCurrentProfile / requireAdmin / requireCustomerSession
    env.ts               isSupabaseConfigured()
    supabase/            client, server (SSR cookies), admin (service role), middleware
    cart-context.tsx / wishlist-context.tsx
supabase/                 01_schema.sql · 02_rls.sql · 03_seed.sql
```

`HANDOFF.md` is the long-form build log (decisions, schema detail, gotchas).
It is historical context, not current state — this README describes the finished app.

---

## 9. Deploying

Free hosting guide: **[DEPLOY.md](DEPLOY.md)** — GitHub → Vercel (recommended) or Render
(`render.yaml` blueprint included), plus the Supabase redirect-URL setup and a post-deploy
smoke test.

1. Push the repo to GitHub and import it into Vercel (framework auto-detected).
2. Add the environment variables from §5 in **Project → Settings → Environment Variables**
   (use your production domain for `NEXT_PUBLIC_SITE_URL`).
3. Add the production callback URL to Supabase → Authentication → URL Configuration (§4.3).
4. Set the Supabase project's **Site URL** to the production domain.
5. Deploy, then place a test order end-to-end and open the invoice and export from `/admin`.

---

## 10. Known limits / next steps

- **Payments are recorded, not processed.** `cod`, `esewa`, `khalti`, `bank_transfer` are stored
  on the order and shown to admins; no gateway redirect or verification webhook is wired yet.
  The env vars and settings toggles are already in place.
- **Email is optional.** With no `RESEND_API_KEY`, confirmation emails are printed to the server
  log instead of sent.
- **Demo imagery.** Product photos come from `placeholderConfig` in `src/lib/config.ts` (picsum
  seeds) until real photos are uploaded through the admin product form — one place to swap.
- **Sample testimonials** on the home page are labelled as samples.
- **`next@14.2.15` advisory** — patch the minor version before launch (§3).
- **Uploaded photos are never shown to customers**, by design. If a customer-facing preview is
  wanted later, add a per-request signed URL generated server-side after an ownership check.
