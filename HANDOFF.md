# DORIKA — Build Handoff Report

> **Purpose of this file:** Complete state transfer. The previous session was interrupted mid-build due to token limits. This document contains everything the next AI needs to continue **without asking the user a single clarifying question**.
>
> **Read this whole file before writing any code.**

---

## 1. TL;DR — Status at a glance

> **BUILD COMPLETE — status refreshed.** Everything below this table that describes work as
> "not started" is historical. The admin panel, the optional customer account area, the README
> and the production build verification are all finished. See the TL;DR table and §11.

| # | Task | Status |
|---|------|--------|
| 1 | Project scaffold (Next.js + TS + Tailwind + config) | ✅ **DONE** |
| 2 | Database schema + RLS + seed data | ✅ **DONE** |
| 3 | Core lib (Supabase clients, types, config, utils, security) | ✅ **DONE** |
| 4 | Shared UI components + layout (navbar, footer, WhatsApp, logo) | ✅ **DONE** |
| 5 | All public pages | ✅ **DONE** |
| 6 | API routes + spam protection | ✅ **DONE** |
| 7 | Admin panel (dashboard, orders, invoice, custom art, products, categories, customers, messages, payments, settings, CSV export) | ✅ **DONE** |
| 8 | Optional user dashboard (`/account`: login/signup/reset/callback, overview, orders + detail, custom requests, profile, addresses) | ✅ **DONE** |
| 9 | README + build verification | ✅ **DONE** (`README.md`, `tsc --noEmit`, `next lint`, `next build` all green) |

**Where the build ended:** the public storefront, the admin back office and the optional
customer account area are all in place. `npx tsc --noEmit`, `npx next lint` and `npx next build`
all pass (44 routes), and the running server was smoke-tested: the three auth pages return 200
with a graceful "Supabase not configured" notice, and `/account`, `/account/orders` correctly
307 to `/account/auth/login`.

---

## 2. Project location & how to run

```
Project root:  C:\Users\ASUS\Desktop\STRING ART\dorika
```

The parent folder `C:\Users\ASUS\Desktop\STRING ART` also holds the original brand logo,
`gemini-svg.svg` (the source of the palette and the live logo reconstruction in
`src/components/logo.tsx`).

```powershell
cd "C:\Users\ASUS\Desktop\STRING ART\dorika"
npm install          # already done — 439 packages, node_modules present
npx tsc --noEmit     # currently PASSES
npx next build       # verification run in progress at handoff — check result
npm run dev          # will NOT work until .env.local exists (see §10, Blocker 1)
```

---

## 3. Stack decision & rationale (needed for README)

**Chosen: Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase.**

Rationale to reuse verbatim in the README:

- **Supabase over Firebase** because the project's hardest requirement is *"uploaded customer photos must be private, admin-only, served via signed URLs."* Supabase Storage supports RLS policies directly on storage objects plus time-limited signed URLs. Firebase Storage relies on security rules and download tokens, which is a poorer fit.
- **Postgres RLS** lets us enforce "guests can track an order but cannot read the orders table" cleanly. Public tracking is done through two `SECURITY DEFINER` functions (`track_order`, `track_custom`) rather than a broad `SELECT` policy — so the orders table stays closed to anonymous users.
- **Admin role** lives in `public.profiles.role` with an `is_admin()` helper. One pattern protects both tables and storage buckets.
- **Auth is only needed for admin + optional customers**, so we use Supabase Auth purely as an identity provider; guests never touch it.

**Installed versions** (`package.json`): `next@14.2.15`, `react@18.3.1`, `@supabase/ssr@0.5.2`, `@supabase/supabase-js@2.45.4`, `tailwindcss@3.4.13`, `recharts@2.12.7` (npm resolved 2.15.4), `lucide-react@0.447.0`, `browser-image-compression@2.0.2`, `clsx`, `tailwind-merge`.

> ⚠️ `npm install` warned: **`next@14.2.15` has a known security vulnerability** — recommend bumping to a patched 14.2.x in the README (or upgrade to 15 if the next AI is willing to handle the `cookies()` async change).

---

## 4. Brand identity (extracted from the supplied logo SVG)

The user's logo file: `C:\Users\ASUS\Desktop\STRING ART\gemini-svg.svg`

Palette **must not be changed** — it is derived from the actual logo:

| Token | Hex | Use |
|---|---|---|
| Charcoal | `#24272B` | Wordmark, headings, dark surfaces |
| Terracotta | `#C55A29` | Thread accent, primary CTA, links, active states |
| White / Cream | `#FFFFFF` / `#FBF8F4` | Backgrounds |
| WhatsApp green | `#25D366` | Floating WhatsApp button only |

Typography: **Nunito** (body, via `--font-nunito`) and **Quicksand** (display/headings, via `--font-quicksand`), both loaded with `next/font/google` in `src/app/layout.tsx`. These match the rounded font stack declared inside the original SVG.

Logo is **reconstructed as live SVG** in `src/components/logo.tsx` (`Logo` with `variant="dark" | "light"`, and `LogoMark` for tight spaces), so it scales cleanly and recolours for the dark footer. A matching favicon is at `public/favicon.svg`.

**Business facts (hard-coded in `src/lib/config.ts` — do not alter):**
- Store: Dorika
- Phone / WhatsApp: `9708285877` → `https://wa.me/9779708285877`
- Email: `shopdorika@gmail.com`
- Location: Khairenitar, Tanahun, Nepal
- Currency: NPR, rendered as `Rs.` with `en-IN` lakh grouping
- Signature product: custom String Face Art, **45cm diameter round plank**, default price **Rs. 3,500**, making time **7–10 days**

---

## 5. Complete file inventory — everything that EXISTS and WORKS

### 5.1 Root config
| File | Notes |
|---|---|
| `package.json` | Scripts: dev, build, start, lint, typecheck |
| `tsconfig.json` | Strict, path alias `@/*` → `./src/*` |
| `next.config.mjs` | Image `remotePatterns` for picsum / unsplash / `**.supabase.co`; `serverActions.bodySizeLimit: "12mb"` |
| `tailwind.config.ts` | Full brand palette (`charcoal`, `terracotta`, `cream`, `whatsapp`), `wa-pulse` / `fade-up` / `fade-in` keyframes, shadows `soft`/`card`/`float` |
| `postcss.config.mjs` | tailwind + autoprefixer |
| `.eslintrc.json` | `next/core-web-vitals` |
| `.gitignore` | Standard Next; ignores `.env*` |
| `.env.example` | **Done** — all vars documented with comments (Supabase, admin email, Turnstile, Resend, eSewa, Khalti, bank/QR) |
| `next-env.d.ts` | Generated |

### 5.2 Database (`supabase/`) — must be run manually in Supabase SQL Editor, in order
| File | Contents |
|---|---|
| `01_schema.sql` | Extensions, 5 enums, 13 tables, indexes, `is_admin()`, `handle_new_user()` trigger on `auth.users`, `touch_updated_at()` triggers |
| `02_rls.sql` | RLS on all tables, all policies, `track_order()` / `track_custom()` / `link_guest_orders()` SECURITY DEFINER functions, creates both storage buckets + storage policies |
| `03_seed.sql` | 4 categories, 12 products |

Schema detail is in **§6** below.

### 5.3 `src/lib/`
| File | Key exports | Notes |
|---|---|---|
| `config.ts` | `siteConfig`, `whatsappLink(msg?)`, `placeholderConfig`, `productImage(images, i)`, `navLinks` | Single source of truth for all brand/contact data + the **single placeholder-image config** the user asked for |
| `types.ts` | `Product`, `Category`, `Order`, `OrderItem`, `OrderEvent`, `CustomRequest`, `ContactMessage`, `Settings`, `Address`, `Profile`, `CartItem`, `TrackResult`, `OrderStatus`, `CustomStatus`, `PaymentMethod`, `PaymentStatus`, `UserRole` | Mirrors DB exactly |
| `utils.ts` | `cn`, `formatNPR`, `generateOrderNo()` → `DRK-XXXXXX`, `generateRequestNo()` → `DRK-C-XXXXX`, `slugify`, `normalizePhone`, `formatDate`, `formatDateTime`, `STATUS_FLOW`, `statusLabel`, `statusColor`, `isValidEmail`, `isValidNepaliPhone` | Order numbers use a no-ambiguous-chars alphabet |
| `security.ts` | `rateLimit(key, limit, windowMs)`, `getClientIp(headers)`, `HONEYPOT_FIELD = "company_website"`, `isHoneypotTripped`, `verifyTurnstile(token, ip)` | In-memory fixed-window limiter. **Imported by client components too** — keep it free of `server-only` |
| `email.ts` | `sendEmail({to,subject,html})`, `orderConfirmationHtml({...})` | Resend if `RESEND_API_KEY` set, else logs to console. **Has a known type wart — see §10, Bug 3** |
| `queries.ts` | `getSettings`, `getCategories`, `getFeaturedProducts`, `getProducts`, `getProductBySlug`, `getRelatedProducts`, `getAllProductSlugs` | All wrapped in try/catch returning safe fallbacks, so pages render even before Supabase is configured |
| `auth.ts` | `getCurrentProfile()`, `requireAdmin()`, `requireUser()` | Server-side guards using `redirect()` |
| `supabase/client.ts` | `createClient()` | Browser, anon key |
| `supabase/server.ts` | `createClient()` | SSR cookie-bound, **fixed typing** |
| `supabase/admin.ts` | `createAdminClient()` | Service role, bypasses RLS, **server-only** |
| `supabase/middleware.ts` | `updateSession(request)` | Refreshes session, guards `/admin/*` (role check) and `/account/*` |
| `cart-context.tsx` | `CartProvider`, `useCart()` | localStorage key `dorika_cart_v1`; exposes `items,count,subtotal,isOpen,setOpen,addItem,removeItem,updateQty,clear` |
| `wishlist-context.tsx` | `WishlistProvider`, `useWishlist()` | localStorage key `dorika_wishlist_v1`; exposes `ids,count,has,toggle,remove` |

### 5.4 `src/components/`
| File | Notes |
|---|---|
| `logo.tsx` | `Logo` (`variant`, `withLink`, `className`), `LogoMark` |
| `navbar.tsx` | Sticky, scroll-shadow, desktop links + icons (search, wishlist, cart w/ badge, account), mobile slide-down menu. **Returns `null` when `pathname.startsWith("/admin")`** |
| `footer.tsx` | Brand + social, Explore, Help, contact, WhatsApp CTA, copyright bar |
| `whatsapp-button.tsx` | **Exact spec met:** fixed bottom-right, 60px, WhatsApp green, white glyph, red dot, `animate-wa-pulse`, hover scale, prefilled message. Rendered globally in `providers.tsx` |
| `cart-drawer.tsx` | Slide-in right panel, qty steppers, remove, subtotal, checkout CTA |
| `product-card.tsx` | Image, wishlist heart, Custom/Sale/Sold-out badges, category, name, dummy stars, price + compare-at, Add button (or "Create" → `/custom-art` for custom products) |
| `providers.tsx` | Wraps `CartProvider` + `WishlistProvider`, renders `CartDrawer` + `WhatsAppButton` |
| `turnstile.tsx` | Loads Cloudflare Turnstile if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set; else calls `onToken("disabled")` |
| `faq-accordion.tsx` | Animated single-open accordion |
| `legal-layout.tsx` | `LegalLayout`, `LegalSection` — prose shell for legal pages |
| `ui/button.tsx` | `Button` with `variant` primary/dark/outline/ghost, `size` sm/md/lg |
| `ui/input.tsx` | `Input`, `Textarea`, `Select`, `Field` (label + required + hint) |
| `ui/section-heading.tsx` | `SectionHeading` (eyebrow, title, subtitle, align) |
| `home/hero.tsx` | Headline/tagline from `settings`, CTAs "Shop Now" + "Create Your Custom Art", trust dots, hero image w/ 45cm plank callout |
| `home/featured-products.tsx` | Grid of featured, "View all" |
| `home/how-it-works.tsx` | 4 steps: Upload photo → We design → We hand-craft on 45cm plank → Delivered |
| `home/categories.tsx` | 4-up image tiles linking to `/shop?category=slug` |
| `home/testimonials.tsx` | 3 dummy reviews, labelled "(Sample reviews shown for demo.)" |
| `home/why-dorika.tsx` | 6 reasons (handmade, custom, nationwide, quality, love, on-time) |
| `home/cta-banner.tsx` | Dark CTA banner + 3-up contact strip |
| `shop/shop-filters.tsx` | Search (debounced via form), category chips, sort select; syncs to URL |
| `shop/pagination.tsx` | Windowed page numbers with ellipsis |
| `product/product-detail-client.tsx` | Gallery + thumbnails, price, size/stock badges, qty stepper, Add to Cart / Buy Now / wishlist. Custom products show a "Start your custom art" panel instead |
| `custom-art/custom-art-builder.tsx` | See §7 — the most complex component |
| `checkout/checkout-client.tsx` | Guest checkout: address fields, 4 payment methods gated by settings, live summary with delivery fee, Turnstile, posts to `/api/orders`, redirects to `/order-confirmation` |
| `contact/contact-form.tsx` | Name/phone/email/subject/message + Turnstile + honeypot → `/api/contact`, success state |
| `track/track-client.tsx` | Order ID + phone → `/api/track`, renders status timeline using `STATUS_FLOW`, handles cancelled |

### 5.5 `src/app/`
| Route | Notes |
|---|---|
| `layout.tsx` | Fonts, full `Metadata` (title template, description, keywords, OG, Twitter, icons), `Viewport` themeColor `#24272B`, wraps in `Providers` |
| `(public)/layout.tsx` | `Navbar` + `<main>` + `Footer` |
| `(public)/page.tsx` | Home; `revalidate = 60`; composes all home sections from live queries |
| `(public)/shop/page.tsx` | `revalidate = 30`; search + category + sort + pagination (9/page) |
| `(public)/product/[slug]/page.tsx` | `generateStaticParams`, `generateMetadata`, breadcrumb, related products |
| `(public)/custom-art/page.tsx` | Spec header (45cm / price / making time) + builder |
| `(public)/cart/page.tsx` | Cart page (client) |
| `(public)/checkout/page.tsx` | Hosts `CheckoutClient`, passes settings |
| `(public)/order-confirmation/page.tsx` | Order ID, WhatsApp confirm with ID prefilled, track link, **soft optional signup prompt** |
| `(public)/track/page.tsx` | Hosts `TrackClient` |
| `(public)/about/page.tsx` | Story, mission, craft process, maker section, values |
| `(public)/contact/page.tsx` | Info cards, form, embedded Google Map of Khairenitar |
| `(public)/faq/page.tsx` | 9 Q&As |
| `(public)/privacy/page.tsx`, `terms/page.tsx`, `shipping/page.tsx` | Real content, not lorem |
| `not-found.tsx` | Branded 404 (has its own Navbar/Footer since it sits outside `(public)`) |
| `sitemap.ts` | Static routes + all product slugs |
| `robots.ts` | Disallows `/admin`, `/account`, `/api` |
| `globals.css` | Tailwind layers + `.btn-*`, `.input`, `.label`, `.card`, `.badge`, `.section`, `.eyebrow`, `.hp-field` (honeypot) utilities |

### 5.6 API routes (all `runtime = "nodejs"`)
| Route | Method | Behaviour |
|---|---|---|
| `/api/orders` | POST | Rate limit 8/min/IP → honeypot → Turnstile → validate name+phone → **re-prices every line from the DB (never trusts client prices)** → computes delivery fee from `settings` (free over `free_delivery_over`) → inserts order + items + initial `order_events` row → sends confirmation email → returns `{ order_no, total }`. Attaches `user_id` if a session exists |
| `/api/custom-requests` | POST (multipart) | Rate limit 5/min → honeypot → Turnstile → validate → enforce JPG/PNG/WEBP + ≤10MB server-side → uploads to **private** `custom-photos` bucket at `{request_no}/{timestamp}.{ext}` → inserts `custom_requests` + `custom_events` → emails → returns `{ request_no, price }`. Cleans up the upload if the insert fails |
| `/api/contact` | POST | Rate limit 5/min → honeypot → Turnstile → insert into `contact_messages` |
| `/api/track` | POST | Rate limit 15/min → routes to `track_custom` if the ID starts with `DRK-C-`, else `track_order` → returns `{ result }` or 404 |

---

## 6. Database schema — exact reference

**Enums:** `order_status` = pending, confirmed, in_progress, shipped, delivered, cancelled · `payment_method` = cod, esewa, khalti, bank_transfer · `payment_status` = unpaid, pending, paid, refunded, failed · `custom_status` = same as order_status · `user_role` = customer, admin

**Tables:**

- **`profiles`** — `id` uuid PK→`auth.users`, `email`, `full_name`, `phone`, `role user_role default 'customer'`, `created_at`, `updated_at`
- **`categories`** — `id`, `name`, `slug` unique, `description`, `image_url`, `sort_order`, `is_active`, `created_at`
- **`products`** — `id`, `name`, `slug` unique, `description`, `price numeric(12,2)`, `compare_at`, `category_id`→categories, `images text[]`, `size`, `stock`, `is_featured`, `is_active`, `is_custom`, `created_at`, `updated_at`
- **`orders`** — `id`, `order_no` unique, `user_id`→auth.users (nullable = guest), `customer_name`, `phone`, `email`, `district`, `city`, `address`, `landmark`, `notes`, `subtotal`, `delivery_fee`, `total`, `status`, `payment_method`, `payment_status`, `created_at`, `updated_at`
- **`order_items`** — `id`, `order_id`, `product_id`, `product_name`, `image_url`, `unit_price`, `quantity`, `line_total`
- **`order_events`** — `id`, `order_id`, `status`, `note`, `created_at` ← drives the tracking timeline
- **`custom_requests`** — `id`, `request_no` unique, `user_id`, `photo_path`, `full_name`, `phone`, `whatsapp`, `email`, `district`, `municipality`, `ward_tole`, `full_address`, `landmark`, `alt_phone`, `preferred_date` (date), `gift_or_self`, `background_pref`, `special_instructions`, `plank_size` (default `'45cm diameter round plank'`), `price`, `status`, `payment_status`, `admin_notes`, `created_at`, `updated_at`
- **`custom_events`** — `id`, `request_id`, `status`, `note`, `created_at`
- **`contact_messages`** — `id`, `name`, `email`, `phone`, `subject`, `message`, `is_read`, `created_at`
- **`addresses`** — `id`, `user_id`, `label`, `full_name`, `phone`, `district`, `city`, `address`, `landmark`, `is_default`, `created_at`
- **`wishlist`** — PK (`user_id`, `product_id`), `created_at`
- **`settings`** — singleton `id = 1` (CHECK constraint): `store_name`, `store_email`, `store_phone`, `whatsapp`, `address`, `currency`, `delivery_fee` (150), `free_delivery_over` (5000), `custom_art_price` (3500), `custom_art_days` ('7–10 days'), `hero_headline`, `hero_tagline`, `cod_enabled` (true), `esewa_enabled` (false), `khalti_enabled` (false), `bank_enabled` (true), `updated_at`

**Functions:** `is_admin()` · `handle_new_user()` (trigger on `auth.users` — grants `admin` when `new.email = current_setting('app.admin_email', true)`) · `touch_updated_at()` · `track_order(text,text)` · `track_custom(text,text)` · `link_guest_orders()`

**Storage buckets:** `product-images` (**public**, public read + admin write) · `custom-photos` (**private**, admin-only policies; guest uploads go through the service role in the API route)

**Seed:** categories `wall-art`, `custom-face-art`, `home-decor`, `gifts`; 12 products (2 flagged `is_custom`: `custom-string-face-art` Rs.3,500 and `couple-portrait-face-art` Rs.5,500). All images are `https://picsum.photos/seed/dorika-pN/900/900`.

**Seeded RLS model (important — do not "simplify" this):**
- `categories`, `products`, `settings` → public SELECT of active rows; admin ALL
- `orders`, `order_items`, `order_events`, `custom_requests`, `custom_events` → owner-or-admin SELECT; admin ALL. **No anonymous SELECT.** Guests can only reach their own row via the SECURITY DEFINER RPCs
- `contact_messages` → admin only (inserts happen via service role)
- `addresses`, `wishlist` → owner only
- `profiles` → self-read-or-admin; self-update

---

## 7. Deep dive: the two most complex finished features (so you can match their patterns)

### 7.1 `src/components/custom-art/custom-art-builder.tsx` (multi-step, guest, 439 lines)

Client component. Props: `{ price: number; makingTime: string }`.

- **Steps array:** `["Photo","Details","Review","Done"]`, rendered as a numbered progress rail for the first three (`Check` icon for completed steps, terracotta fill).
- **Photo step:** drag-and-drop zone + click-to-browse. Input is `accept="image/jpeg,image/png,image/webp"` with `capture="environment"` so phones offer the camera. Validates MIME + 10MB client-side, then compresses with `browser-image-compression` (`maxSizeMB: 2`, `maxWidthOrHeight: 1600`, `useWebWorker: true`). Falls back to the original file if compression throws. Shows a square preview with a "choose different photo" button.
- **Details step:** all required + optional fields exactly as the user specified. `sameWhatsapp` checkbox conditionally reveals the WhatsApp input. Optional fields are tucked into a collapsed `<details>` block to keep mobile tidy.
- **Review step:** photo + `<dl>` summary rows + plank/making-time/price recap + `<Turnstile>`.
- **Submit:** builds `FormData`, appends `photo`, every string field, `whatsapp` (resolved from the checkbox), `turnstileToken`, and the honeypot, then POSTs to `/api/custom-requests`.
- **Draft persistence:** text fields only persist to `localStorage` under `dorika_custom_draft_v1` on every change and are restored on mount. **The photo cannot be persisted** (File objects aren't serializable) — this is intentional and should be documented in the README.
- **Confirmation screen:** replaces the form on success; shows Order ID, a WhatsApp button with the ID prefilled, a track link, and the soft optional-account prompt.
- Validation gate per step is in `canNext()`; `next()` surfaces an inline error instead of advancing.

### 7.2 Checkout flow

`cart-context` (localStorage) → `/cart` → `/checkout` → `CheckoutClient` POSTs JSON to `/api/orders` → server re-prices → `/order-confirmation?order=DRK-XXXXXX`.

Payment methods render from `settings.cod_enabled / esewa_enabled / khalti_enabled / bank_enabled`. Because the seed sets `esewa_enabled` and `khalti_enabled` to **false**, only **COD** and **Bank Transfer** appear until an admin turns the others on. Payment keys are stubbed in `.env.example` for later wiring — **no gateway call exists yet** (correct for this stage; the user asked only for the structure).

---

## 8. ⚠️ WHERE I STOPPED — exact state

Last actions performed, in order:

1. Wrote every file listed in §5.
2. Ran `npx tsc --noEmit` → **11 errors**, all `implicitly has an 'any' type` on the Supabase cookie callbacks.
3. Edited `src/lib/supabase/server.ts` — added `import { createServerClient, type CookieOptions }`, added `type CookieToSet = { name: string; value: string; options: CookieOptions }`, annotated `setAll(cookiesToSet: CookieToSet[])`.
4. Edited `src/lib/supabase/middleware.ts` — same fix.
5. Re-ran `npx tsc --noEmit` → **passed, zero output**.
6. Started `npx next build` in the background for verification.
7. **User interrupted here.** No admin or account files had been created yet.

**Nothing is half-written.** Every existing file is complete and consistent. There are no `TODO` markers, no stubbed components, no broken imports. The public site is a coherent, shippable build.

**Task board state (still open when interrupted):**
- Task 7 — Admin panel — `pending`
- Task 8 — Optional user dashboard — `pending`
- Task 9 — README + final verification — `pending` (only `.env.example` finished)

---

## 9. WHAT REMAINS — full build spec

Build these in the order given. Each item lists the exact path, purpose, and requirements. **Do not reduce scope** — the user explicitly said "Do not skip the admin panel or the optional user dashboard."

### 9.1 Admin auth (do this first — everything else depends on it)

| Path | Type | Requirements |
|---|---|---|
| `src/app/admin/login/page.tsx` | Server page + client form | Email + password login. `supabase.auth.signInWithPassword` via a server action in `src/app/admin/login/actions.ts`. On success `redirect("/admin")`. If the resulting profile role is not `admin`, sign out and show "This account does not have admin access." Read `?error=not_admin` and `?redirect=` from the query (the middleware already sets these). Card layout on a cream background, Dorika logo centred. Link back to the storefront. |
| `src/app/admin/login/actions.ts` | `"use server"` | `signIn(formData)`, `signOut()`. `signOut` → `supabase.auth.signOut()` then `redirect("/admin/login")`. |

> The middleware already redirects unauthenticated `/admin/*` requests to `/admin/login` and appends `?redirect=<path>`, and redirects non-admins with `?error=not_admin`. **Honour those params — do not change the middleware contract.**

### 9.2 Admin shell

`src/app/admin/layout.tsx` — Server component.
- Call `requireAdmin()` from `@/lib/auth` at the top (invalid/absent session already redirected by middleware, but re-verify server-side).
- Fixed left sidebar on `lg+` (w-64, `bg-charcoal-800`), collapsible drawer on mobile.
- Sidebar content: `Logo variant="light"`, then nav items with lucide icons —
  Dashboard (`LayoutDashboard`, `/admin`), Orders (`ShoppingBag`, `/admin/orders`), Custom Art (`Palette`, `/admin/custom-requests`), Products (`Package`, `/admin/products`), Categories (`Tags`, `/admin/categories`), Customers (`Users`, `/admin/customers`), Messages (`Mail`, `/admin/messages`), Payments (`CreditCard`, `/admin/payments`), Settings (`Settings`, `/admin/settings`).
- Active state from `usePathname` → needs a small client `AdminSidebar` component at `src/components/admin/admin-sidebar.tsx`.
- Top bar: page title, admin email, "View store" link, sign-out button.
- **Notification badges:** unread `contact_messages` count, `pending` orders count, `pending` custom requests count. Fetch counts in the layout (server) and pass to the sidebar.
- ⚠️ `Navbar` already returns `null` on `/admin`, and admin lives outside the `(public)` group, so there is no double-navbar risk. Keep it that way.

### 9.3 Admin dashboard — `src/app/admin/page.tsx`

Server component, `requireAdmin()`.

Stat cards (all computed from Supabase, ideally with a few `.select("...", { count: "exact", head: true })` calls):
- **Revenue total** — `sum(orders.total)` where `status != 'cancelled'`
- **Orders today / this week / this month** — count by `created_at` range
- **Pending orders** — `status = 'pending'`
- **New custom requests** — `status = 'pending'`
- **New customers** — `profiles` where `role='customer'` created this month, **plus** distinct guest phones with a first order this month (the user asked for "new customers" and guests count)
- **Low stock alerts** — `products.stock <= 5` and `is_active`, listed by name with the current stock

Charts / tables:
- **Sales chart** — `recharts` `AreaChart` or `BarChart`, with a client-side Daily / Weekly / Monthly toggle (`src/components/admin/sales-chart.tsx`). Bucket orders by day for the last 14 days, by ISO week for the last 8 weeks, by month for the last 6 months. Pass a pre-bucketed array from the server.
- **Best sellers** — top 5 products by summed `order_items.quantity` (join or aggregate in JS from a bounded query).
- **Recent orders** — latest 10 rows: order no, customer, total, status badge, date, link to detail.

### 9.4 Orders — `src/app/admin/orders/page.tsx`

- Table columns: Order No, Customer, Phone, Date, Total, Payment method, Payment status, Order status, actions.
- **Search** across `order_no`, `customer_name`, `phone` (use `.or()` with `ilike`).
- **Filters:** status (all 6), payment method, payment status, date from/to. Implement as URL search params + a client filter bar, mirroring the pattern in `src/components/shop/shop-filters.tsx`.
- Pagination, 20/page.
- **CSV export button** hitting `/api/admin/export?type=orders` with the current filters.

`src/app/admin/orders/[id]/page.tsx`
- Header: order no, created date, status badge.
- Customer block: name, phone (click-to-call `tel:`), email, district/city/address/landmark, notes.
- Items table with image thumb, name, unit price, qty, line total, then subtotal / delivery / total.
- **Status update form** (server action): a `<select>` of all statuses + optional note textarea. On save: `UPDATE orders SET status`, then `INSERT INTO order_events (order_id, status, note)`. Then `revalidatePath` the order, the list, and `/track`. Show the existing `order_events` as a timeline.
- **Payment status** update control (unpaid/pending/paid/refunded/failed).
- **Print invoice** button → `/admin/orders/[id]/invoice`.
- Link to WhatsApp the customer (`https://wa.me/977<phone>`).

`src/app/admin/orders/[id]/invoice/page.tsx`
- Print-optimised A4. Logo, store info from `settings`, order no + date, bill-to block, items table, totals, payment method/status, thank-you line.
- `@media print` CSS: hide the sidebar/toolbar, `@page { size: A4; margin: 16mm }`. A "Print" button calling `window.print()` in a tiny client component.
- This route must render **outside** the admin sidebar chrome — put it in its own segment so the sidebar doesn't print. Simplest approach: keep it under `/admin/orders/[id]/invoice` but wrap the sidebar in a `print:hidden` class.

### 9.5 Custom Art Requests — `src/app/admin/custom-requests/page.tsx`

- List: request no, customer, phone, date, price, status badge, small **thumbnail of the face photo**.
- **Thumbnails require signed URLs.** In the server component, call
  `admin.storage.from("custom-photos").createSignedUrl(row.photo_path, 60 * 60)`.
  The bucket is private, so a plain public URL will 404. Batch these with `Promise.all`. Never expose the service key client-side — generate the signed URL on the server and pass the signed string down.
- Filter by status, search by request no / name / phone.

`src/app/admin/custom-requests/[id]/page.tsx`
- Large **signed-URL photo display**, plus a **Download photo** button
  (`createSignedUrl(path, 60, { download: true })`).
- Full customer detail block — every field captured by the builder, including the optional ones and `special_instructions`.
- **Status update** + note → insert into `custom_events` (same pattern as orders).
- **`admin_notes`** free-text textarea with its own save action (this is the user's internal note field).
- **Set price** numeric input with its own save action.
- Payment status control.
- "Confirm on WhatsApp" link with a prefilled message including the request no.

### 9.6 Products — `src/app/admin/products/`

`page.tsx` — table: image thumb, name, category, price, stock, featured toggle, active toggle, edit/delete. Inline toggles can be small server actions. Low-stock rows highlighted. "Add product" button.

`product-form.tsx` (shared client component) used by both `new/page.tsx` and `[id]/edit/page.tsx`.
Fields: name, slug (auto-derived from name via `slugify` until the user edits it manually), description, price, compare_at, category select (from `getCategories()` — but use the **admin** query so inactive categories appear), size, stock, `is_featured`, `is_active`, `is_custom`, and **multiple image upload**.
Image upload: client uploads to the `product-images` bucket via the browser Supabase client (public bucket → the admin's session satisfies the storage policy), collecting public URLs into a `string[]`, with drag-to-reorder and per-image remove. Persist the array into `products.images`.

`new`/`[id]/edit` pages: server components that load categories (+ the product) and render the form with server actions for insert/update/delete. On save: `revalidatePath("/")`, `revalidatePath("/shop")`, `revalidatePath("/product/<slug>")`.

> ⚠️ Pages use `revalidate = 30/60`. After admin mutations you **must** call `revalidatePath` or the storefront will serve stale data for up to a minute.

### 9.7 Categories — `src/app/admin/categories/page.tsx`

Inline CRUD table: name, slug, description, image_url, sort_order, is_active, product count. Add/edit via a modal or an inline row form. Deleting a category sets `products.category_id = NULL` (the FK is `ON DELETE SET NULL`).

### 9.8 Customers — `src/app/admin/customers/`

`page.tsx` — **two sources merged into one list**, because the user explicitly asked for "including guest customers":
1. Registered: `profiles` where `role='customer'` joined to order aggregates.
2. Guests: distinct `orders.phone` where `user_id IS NULL`, aggregated client-side or via a Postgres view.

Columns: name, phone, email, type badge (Registered / Guest), orders count, total spent, last order date. Search by name/phone/email.

`[id]/page.tsx` — for registered users keyed by profile id; for guests keyed by phone (URL-encode it). Show contact details, saved addresses, full order history, and custom art requests.

### 9.9 Messages — `src/app/admin/messages/page.tsx`

Inbox list (name, subject, date, read/unread). Click → detail pane or `/admin/messages/[id]` with the full message, a "Reply via email" `mailto:` button prefilled with the subject, "Mark as read/unread", and "Delete". Unread count feeds the sidebar badge. Default filter shows unread first.

### 9.10 Payments — `src/app/admin/payments/page.tsx`

Overview only (no gateway integration): totals by method and by payment status, a table of orders with payment method / status / total / date, and quick "Mark paid" actions. Filters mirror the orders page.

### 9.11 Settings — `src/app/admin/settings/page.tsx`

One server-rendered form bound to the `settings` singleton (`id = 1`), saved by a server action doing an `UPDATE`:
- **Store info:** store_name, store_email, store_phone, whatsapp, address, currency
- **Delivery:** delivery_fee, free_delivery_over
- **Custom art:** custom_art_price, custom_art_days
- **Payment methods:** cod_enabled, esewa_enabled, khalti_enabled, bank_enabled (toggles)
- **Banners / hero editor:** hero_headline, hero_tagline — these already feed the homepage Hero, so saving must `revalidatePath("/")`.

Group into labelled `<fieldset>` cards. Show a success toast on save.

### 9.12 CSV export — `src/app/api/admin/export/route.ts`

GET handler, `requireAdmin()`-equivalent check via the server Supabase client (a route handler can't use `redirect`; return 401/403 JSON instead).
- `?type=orders` → all orders honouring the same filters as the list.
- `?type=sales` → aggregated daily sales (date, orders, revenue).
- Emit proper CSV: escape quotes, `\r\n` line endings, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="dorika-orders-YYYY-MM-DD.csv"`.

### 9.13 Notification badges

Already covered in 9.2, but explicitly: the user asked for **"Notifications for new orders and custom requests."** Implement as counts in the sidebar (pending orders, pending custom requests, unread messages). A realtime toast is optional polish — a polling badge is acceptable and simpler.

---

## 10. Optional user dashboard (`/account`) — full spec

The user asked for this to exist **only for people who choose to sign up**, and stressed repeatedly that guests must never be forced to create one. Preserve that tone everywhere: no hard walls, no "create an account to continue".

### 10.1 Auth pages — `src/app/account/auth/`

The middleware **excludes** `/account/auth/*` from the login guard, so these are reachable when signed out.

| Path | Requirements |
|---|---|
| `login/page.tsx` | Email + password. Server action using `signInWithPassword`. `?redirect=` support. Prominent "Continue as guest" link back to `/shop`. |
| `signup/page.tsx` | Full name, email, password (+ confirm). `signUp` with `options: { data: { full_name } }` so the `handle_new_user` trigger picks up the name. Copy must state: **"Optional — you can always shop as a guest."** After success, call `link_guest_orders()` RPC so any guest orders with the same phone/email attach to the account. |
| `forgot-password/page.tsx` | Email → `resetPasswordForEmail` with `redirectTo: ${SITE_URL}/account/auth/reset-password`. Always show the same neutral "If that email exists, we've sent a link" message. |
| `reset-password/page.tsx` | Handles the Supabase recovery link; new password + confirm → `updateUser({ password })`. |

**Google login (if possible):** add a "Continue with Google" button on both login and signup calling
`supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${SITE_URL}/account` } })`.
Requires the user to enable Google in the Supabase dashboard — document this in the README under "Optional: Google login".

`src/app/account/auth/actions.ts` — one `"use server"` file with `signIn`, `signUp`, `signOut`, `requestPasswordReset`, `updatePassword`.

### 10.2 Account shell — `src/app/account/layout.tsx`

⚠️ **Critical layout detail:** this layout wraps *both* `/account/auth/*` and the protected pages. If you call `requireUser()` at the top of the layout it will trap unauthenticated visitors in a redirect loop on the login page. Two safe options:

- **Preferred:** make the protected pages live in a `(dashboard)` route group with its own layout that calls `requireUser()`, e.g.
  `src/app/account/(dashboard)/layout.tsx` → guard + shell; `src/app/account/auth/*` stays outside it. URLs remain `/account`, `/account/orders`, etc.
- Alternative: keep one layout but call `getCurrentProfile()` (not `requireUser`) and render the shell only when a profile exists.

Shell: lighter than admin — left/top nav with Overview, My Orders, Custom Art, Wishlist, Profile, Addresses, plus sign-out. Mobile: horizontal scrollable tab bar.

### 10.3 Account pages (all under `(dashboard)`)

| Path | Requirements |
|---|---|
| `page.tsx` (Overview) | Greeting with name, 3 stat tiles (total orders, active orders, custom requests), latest order card with status, wishlist count, quick links. |
| `orders/page.tsx` | The user's orders (`user_id = auth.uid()` — RLS already enforces it, but filter explicitly). Status badges, date, total, link to detail. Empty state → "Browse the shop". |
| `orders/[id]/page.tsx` | Items, totals, shipping address, payment info, and the **full status timeline** from `order_events` (reuse the visual pattern from `src/components/track/track-client.tsx`). |
| `custom-requests/page.tsx` | The user's custom requests. **Their own uploaded photo** via a signed URL generated **server-side** — use the *user's* server client so RLS applies; if that fails for a private bucket, fall back to the admin client **only after verifying `user_id === auth.uid()`** in the query. Status badge + timeline. Empty state → link to `/custom-art`. |
| `profile/page.tsx` | Edit `full_name`, `phone`, `email` (email change → `updateUser`, which emails a confirmation). Show read-only account created date + role. |
| `addresses/page.tsx` | CRUD on `addresses` for the current user. Fields per schema. Set-default toggle (unset others when one is set). Empty state with "Add your first address". |
| `wishlist/page.tsx` | See §10.4 — **read the conflict warning.** |

### 10.4 ⚠️ Wishlist routing conflict — must fix

`src/components/navbar.tsx` links the heart icon (and the mobile menu) to **`/account/wishlist`**. But:
1. The middleware guards `/account/*`, so a **guest** clicking it is bounced to login — which directly violates the "guests never hit a login wall" rule.
2. The page doesn't exist yet, so it 404s either way.

**Fix (pick one, and keep the navbar link in sync):**
- **Recommended:** create a **public** `/wishlist` route that reads the localStorage ids from `useWishlist()`, fetches those products, and renders `ProductCard`s — works for guests *and* signed-in users with zero auth friction. Then change both navbar links from `/account/wishlist` to `/wishlist`.
- Alternatively keep `/account/wishlist` and add it as an explicit exception in the middleware matcher.

The public route is better UX and matches the brief. If you add it, also drop the `/account/wishlist` entry from the mobile menu. Signed-in users can additionally sync to the `wishlist` table, but localStorage must remain the source of truth for guests.

You'll need a new query helper — `getProductsByIds(ids: string[])` in `src/lib/queries.ts` — since none exists yet.

---

## 11. Known bugs, warts and gotchas

Fix these as you go. They are real, not hypothetical.

**Blocker 1 — no `.env.local`.** It was never created, only `.env.example`. Consequences:
- `src/middleware.ts` calls `createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)`. With the var undefined the non-null assertion buys nothing and `createServerClient` **throws on every request**, so the whole site 500s.
- **Fix:** create `.env.local` from `.env.example`, and harden `updateSession()` to `return NextResponse.next()` early when the URL/key are missing. Keep the loud throw inside `createAdminClient()` (that one *should* fail loudly), but the middleware must degrade gracefully.

**Bug 2 — dangling routes.** `/account`, `/account/wishlist`, `/admin/login` are all linked from live UI but don't exist. They resolve once §§9–10 are built. Don't launch before they do.

**Bug 3 — `email.ts` type wart.** `orderConfirmationHtml()` declares `{ orderNo, name, total?, trackUrl, kind }`, but `src/app/api/custom-requests/route.ts` passes `price` and silences it with `as never`. Clean this up: rename the field to `amount?: number` and update both call sites (orders passes `total`, custom passes `price`). Remove the `as never` cast.

**Bug 4 — middleware matcher is redundant and heavy.** Current matcher lists `/admin/:path*`, `/account/:path*` **and** a catch-all. The catch-all subsumes the other two, so `updateSession` runs `auth.getUser()` on *every* public page request — an unnecessary round-trip on every page view for a store where ~99% of traffic is anonymous. Narrow it to `["/admin/:path*", "/account/:path*"]` unless you actually need refresh on public pages.

**Bug 5 — stale storefront after admin edits.** Pages set `revalidate = 30/60`. Every admin mutation needs explicit `revalidatePath()` calls (§9.6) or the shop will show old data.

**Bug 6 — `ProductCard` renders a literal "(dummy)"** next to the 5 stars. Intentional placeholder, but it must not ship. Either remove the text or replace the stars with a real rating later.

**Bug 7 — `next@14.2.15` security advisory** (per the npm install warning). Bump to the latest patched 14.2.x at minimum.

**Bug 8 — `.gitignore` ignores `next-env.d.ts`** while the file is present. Harmless (Next regenerates it), but be aware if you rely on `git status` cleanliness.

**Note — paid-payment flow is intentionally absent.** `esewa`/`khalti` only select a method; no redirect, no signature, no verification callback. That matches "structure the integration so keys can be added later", but the README must say so plainly so the owner doesn't think it's live.

---

## 12. Design system — reuse these, don't invent new ones

Component classes available from `globals.css`: `.btn` base with `.btn-primary` / `.btn-dark` / `.btn-outline` / `.btn-ghost`, sizes `.btn-sm` / `.btn-md` / `.btn-lg`; `.input`, `.label`, `.card`, `.badge`, `.section`, `.eyebrow`, `.container-page`, `.hp-field`, `.no-scrollbar`, `.text-balance`.

React primitives: `Button`, `Input`, `Textarea`, `Select`, `Field`, `SectionHeading`, `Logo`, `LogoMark`, `ProductCard`, `Turnstile`.

Utility helpers: `cn()`, `formatNPR()`, `formatDate()`, `formatDateTime()`, `statusLabel`, `statusColor`, `STATUS_FLOW`, `slugify`, `generateOrderNo`, `generateRequestNo`, `isValidNepaliPhone`.

Conventions to match: `forwardRef` for UI primitives; client components marked `"use client"` and kept leaf-ward; server components fetch and pass serialisable props down; cards `rounded-2xl border border-charcoal-100 bg-white shadow-soft`; section padding via `.section`; headings `font-display font-extrabold`; status pills via `statusColor[status]` + `statusLabel[status]`.

Accessibility expectations already in place — keep them: `aria-label` on icon-only buttons, `aria-expanded` on disclosures, visible `:focus-visible` rings, semantic `<nav>`/`<main>`/`<footer>`, `alt` text on every `Image`, `fill` + `sizes` on next/image.

---

## 13. Setup & deployment (content for the README you must write)

1. `npm install`
2. Create a Supabase project.
3. SQL Editor → run in order: `supabase/01_schema.sql`, `supabase/02_rls.sql`, `supabase/03_seed.sql`.
4. Before running 01, set the admin email so the trigger can grant the role:
   `alter database postgres set app.admin_email = 'shopdorika@gmail.com';` (or run `select set_config('app.admin_email','shopdorika@gmail.com',false);` in the same session).
   Belt-and-braces alternative to document: after signing up, `update public.profiles set role='admin' where email='shopdorika@gmail.com';`
5. Authentication → Providers → enable Email. Optional: enable Google + add the callback URL.
6. Storage → confirm `product-images` (public) and `custom-photos` (private) exist — `02_rls.sql` creates them.
7. Copy `.env.example` → `.env.local`, fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`.
8. `npm run dev` → create the admin account at `/account/auth/signup` using the admin email, then verify `profiles.role = 'admin'`, then log in at `/admin/login`.
9. Deploy: push to GitHub → import on Vercel → paste the same env vars → add the production domain to Supabase Auth redirect URLs and to `NEXT_PUBLIC_SITE_URL`.
10. Document optional integrations: Turnstile keys, Resend API key + verified sender, eSewa/Khalti keys, bank/QR display values.

**Remaining optional env vars to document:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_ESEWA_MERCHANT_CODE`, `ESEWA_SECRET_KEY`, `NEXT_PUBLIC_KHALTI_PUBLIC_KEY`, `KHALTI_SECRET_KEY`, `NEXT_PUBLIC_BANK_NAME`, `NEXT_PUBLIC_BANK_ACCOUNT_NAME`, `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER`, `NEXT_PUBLIC_BANK_QR_IMAGE_URL`.

---

## 14. Definition of done — verify every line

**Guest experience (already built — regression-test it):**
- [ ] Browse, search, filter, sort, paginate the shop with no account
- [ ] Add to cart from a card and from the product page; cart badge + drawer update
- [ ] Wishlist heart persists across reloads (localStorage)
- [ ] Guest checkout with COD and Bank Transfer → Order ID → confirmation page
- [ ] `/track` with Order ID + phone shows the timeline
- [ ] Custom Art: 4 steps, photo compression, draft survives refresh, submits, returns an Order ID, WhatsApp button carries the ID
- [ ] Contact form saves to `contact_messages`
- [ ] Floating WhatsApp button on every page, correct prefilled text, red dot, pulse
- [ ] Mobile 375px: no horizontal scroll; nav menu opens/closes
- [ ] No page anywhere demands a login for a guest

**Admin (to build):**
- [ ] `/admin/*` unreachable without an admin session; non-admins bounced with `not_admin`
- [ ] Dashboard numbers match the DB
- [ ] Order status change writes an `order_events` row and appears in `/track`
- [ ] Custom request photo opens via signed URL and downloads
- [ ] Product create/edit with multi-image upload; delete works
- [ ] Category CRUD
- [ ] Customer list includes guests
- [ ] Messages inbox marks read
- [ ] Settings save updates the hero and delivery fee on the storefront
- [ ] CSV export downloads a valid file
- [ ] Print invoice renders clean on A4

**Account (to build):**
- [ ] Signup → guest orders with the same phone/email become visible
- [ ] Password reset round-trips
- [ ] Orders/custom requests/profile/addresses all function
- [ ] Wishlist works **as a guest** without any login redirect

**Final:**
- [ ] `npx tsc --noEmit` clean
- [ ] `npx next build` clean
- [ ] README covers setup, schema, admin bootstrapping, env vars, Vercel deploy, and the "payments are stubs" caveat

---

## 15. Final notes for the next AI

- **The user cares most about:** it looking professional, being genuinely functional (not mockups), mobile-first, and guests never being forced to log in. They said "TAKE AS LONG AS U WANT BUT I NEED IT PROFESSIONAL."
- **Do not redesign the public site.** It's finished, consistent, and the user hasn't seen it yet. Extend it; don't rework it.
- **Reuse the existing patterns** rather than introducing new libraries. Everything needed is already installed (`recharts` for charts, `lucide-react` for icons, `browser-image-compression` for uploads).
- **Placeholder images** are centralised in `placeholderConfig` inside `src/lib/config.ts`, and per-product overrides come from `products.images`. Don't scatter hard-coded image URLs.
- The logo must keep appearing in the navbar, footer, favicon, and now the **admin panel** and **login screen** — the user asked for that explicitly.
- Run `npx tsc --noEmit` after each major chunk. The codebase was left in a clean-typing state; keep it that way.

---

## 16. Build verification result (confirmed)

`npx next build` was run to completion after the interruption — **exit code 0, no errors.** Both `npx tsc --noEmit` and `npx next build` pass on the current tree, so you are starting from a green baseline.

Route output (proves what is actually wired up):

```
┌ ƒ /                         197 B    111 kB
├ ○ /_not-found               149 B   87.3 kB
├ ○ /about                    186 B   99.2 kB
├ ƒ /api/contact                0 B      0 B
├ ƒ /api/custom-requests        0 B      0 B
├ ƒ /api/orders                 0 B      0 B
├ ƒ /api/track                  0 B      0 B
├ ○ /cart                     3.8 kB    111 kB
├ ƒ /checkout                6.31 kB    107 kB
├ ○ /contact                 3.51 kB   98.7 kB
├ ƒ /custom-art              26.8 kB    127 kB
├ ○ /faq                     2.79 kB    105 kB
├ ƒ /order-confirmation       174 B   94.2 kB
├ ○ /privacy                  149 B   87.3 kB
├ ● /product/[slug]          2.18 kB    113 kB
├ ○ /robots.txt                 0 B      0 B
├ ○ /shipping                 149 B   87.3 kB
├ ƒ /shop                     1.5 kB    112 kB
├ ƒ /sitemap.xml                0 B      0 B
├ ○ /terms                    149 B   87.3 kB
└ ○ /track                   3.59 kB   98.8 kB
+ First Load JS shared        87.2 kB
ƒ Middleware                    87 kB
```

Observations you can act on:
- **First Load JS ~87–127 kB** — healthy for a marketing/storefront build.
- `/custom-art` at **26.8 kB** is the heaviest route because of `browser-image-compression`; it is already isolated to that route only. Leave it.
- `/product/[slug]` is **SSG (`●`)** via `generateStaticParams` and prerendered at build time — remember to `revalidatePath` after product edits.
- **Middleware is 87 kB** — unusually heavy, because it bundles the full Supabase auth client. Narrowing the matcher (see Bug 4) and avoiding `auth.getUser()` on public routes will cut this meaningfully.
- `/shop` and `/` are `ƒ` (dynamic) rather than static because they read cookies/DB per request — expected and fine.

**Nothing in the build output indicates missing modules or unresolved imports**, which confirms every file listed in §5 is wired together correctly.

---

## 17. Quick-start for the next AI — first 5 commands

```powershell
cd "C:\Users\ASUS\Desktop\STRING ART\dorika"
Get-Content HANDOFF.md          # this file
Copy-Item .env.example .env.local   # then fill Supabase keys
npx tsc --noEmit                # expect: clean
npm run dev                     # storefront runs once env is set
```

Then open **§9.1** and start with the admin login page. Work top-down through §9, then §10, then §13 (README), and finish against the §14 checklist.

---

## 18. FINAL — what the last session added (account area, README, verification)

Everything in §9 (admin) and §13 (README) is now done. This section records the final additions
so nobody re-implements them.

### 18.1 New files — optional customer account area
```
src/lib/env.ts                                  isSupabaseConfigured() / isServiceRoleConfigured()
src/lib/account-sync.ts                         syncCustomerAccount(): metadata → profile, then link_guest_orders()
src/lib/account-queries.ts                      getAccountOrders / getAccountOrder / getAccountCustomRequests
                                                / getAccountAddresses / getAccountProfile / getAccountSummary
src/lib/auth.ts                                 + requireCustomerSession()  (session-only guard)
src/components/account/auth-shell.tsx           AuthShell, FormError, FormSuccess, SupabaseSetupNotice
src/components/account/account-nav.tsx          sidebar/nav with active states + sign out
src/components/account/ui.tsx                   PanelHeader, StatTile, Notice, EmptyPanel, MoneyRow
src/app/(public)/account/actions.ts             signOutCustomer, updateProfileAction, saveAddressAction,
                                                deleteAddressAction, setDefaultAddressAction, claimGuestOrdersAction
src/app/(public)/account/auth/actions.ts        signInAction, signUpAction, requestResetAction, updatePasswordAction
src/app/(public)/account/auth/callback/route.ts PKCE code OR token_hash OTP → session cookie → next
src/app/(public)/account/auth/login/page.tsx
src/app/(public)/account/auth/signup/page.tsx
src/app/(public)/account/auth/reset/page.tsx    request mode, or "choose a new password" when a session exists
src/app/(public)/account/(dashboard)/layout.tsx requireCustomerSession + AccountNav
src/app/(public)/account/(dashboard)/page.tsx           /account overview
src/app/(public)/account/(dashboard)/orders/page.tsx    filterable list (+?status=)
src/app/(public)/account/(dashboard)/orders/[orderNo]/page.tsx   items, totals, timeline, WhatsApp help
src/app/(public)/account/(dashboard)/custom-requests/page.tsx
src/app/(public)/account/(dashboard)/profile/page.tsx
src/app/(public)/account/(dashboard)/addresses/page.tsx  add/edit/delete/default
README.md                                        full project documentation
```

The account area lives inside the `(public)` route group, so it inherits the storefront
navbar/footer, cart drawer and WhatsApp button. The `(dashboard)` route group wraps only the
guarded pages, which keeps `/account/auth/*` reachable while signed out — matching the guard
already present in `src/lib/supabase/middleware.ts` (`/account/auth/*` is exempt).

### 18.2 Decisions worth keeping
- **Guest-first, no forced login.** Nothing in checkout, tracking or order confirmation requires
  an account. `/account` is linked from the navbar icon but never demanded.
- **Guest-order linking is explicit and idempotent.** `link_guest_orders()` runs after signup and
  login (best-effort, inside try/catch) and again on demand from the overview page.
- **Uploaded photos are never re-served to customers.** The account area shows "photo received —
  visible to the studio only". This keeps the `custom-photos` bucket admin-only with no new
  signed-URL surface to audit.
- **Unconfigured Supabase must not crash anything.** `isSupabaseConfigured()` gates every auth
  form; the pages render a setup notice instead. Verified against a running production build.
- **One default address.** `saveAddressAction` / `setDefaultAddressAction` clear the previous
  default before setting the new one (no DB constraint relies on ordering).

### 18.3 Verification actually performed (not assumed)
```
npx tsc --noEmit      → clean
npx next lint         → "No ESLint warnings or errors"
npx next build        → 44 routes generated, no warnings other than webpack cache size notes
next start -p 3100    → /account/auth/login|signup|reset = 200 with setup notice
                        /account, /account/orders = 307 → /account/auth/login
                        /shop, /track = 200 (storefront unaffected)
```

### 18.4 Still open (deliberately, documented in README §10)
- Payment gateways are recorded but not processed (no eSewa/Khalti redirect or webhook).
- Patch `next@14.2.15` to a newer 14.2.x before launch.
- Real product photography replaces the picsum placeholders via the admin product form.
