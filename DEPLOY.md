# Deploying Dorika for free

The app is a **Next.js 14 server app** (App Router, middleware, server actions, image
optimizer). That rules out static hosting — it needs a Node runtime. Your database, auth
and photo storage already live in Supabase (cloud), so the only thing being deployed is
the Next.js server.

Three free options, ranked by how little can go wrong:

| Host | Free tier | Verdict |
|---|---|---|
| **Vercel** | Hobby, no sleep, Next-native | **Easiest.** Zero config, no cold starts, handles `next/image` natively. |
| **Render** | Free web service, sleeps after 15 min idle | Works. `render.yaml` is ready. First visit after idle takes ~30–60 s. 512 MB build limit is the main risk. |
| **Cloudflare Workers/Pages** | Free | Needs the `@opennextjs/cloudflare` adapter + custom image loader. Most work, most ways to break. Do it only if you specifically want Cloudflare. |

Both Vercel and Render deploy from **GitHub**, so step 1 is the same.

---

## 1. Put the code on GitHub

Run these from `C:\Users\ASUS\Desktop\STRING ART\dorika` (already initialised and committed):

```powershell
# create an empty repo named "dorika" on github.com first (no README, no .gitignore)
git remote add origin https://github.com/<YOUR-USERNAME>/dorika.git
git push -u origin main
```

If Git asks for credentials, use a **Personal Access Token** as the password:
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained →
repo access → Contents: Read and write.

✅ `.env.local` is gitignored, so your Supabase keys are **not** in the repo. They get
entered in the host's dashboard instead.

---

## 2A. Deploy on Vercel (recommended)

1. [vercel.com](https://vercel.com) → sign up with GitHub.
2. **Add New → Project** → import the `dorika` repo.
3. Framework preset auto-detects **Next.js**. Leave build settings untouched.
4. Open **Environment Variables** and add these five (Production **and** Preview):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://zijncihobkzeajbqxwzt.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_…` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your `sb_secret_…` key |
   | `NEXT_PUBLIC_SITE_URL` | `https://dorika.vercel.app` (your real URL) |
   | `ADMIN_EMAIL` | `shopdorika@gmail.com` |

   ⚠️ `NEXT_PUBLIC_*` values are **baked in at build time** — they must exist *before* the
   first build. If you add them afterwards, hit **Redeploy**.
5. **Deploy**. First build ≈ 2 min.

## 2B. Deploy on Render

1. [render.com](https://render.com) → sign up with GitHub.
2. **New → Blueprint** → pick the `dorika` repo. Render reads `render.yaml` automatically.
3. It will prompt for the five `sync: false` variables — paste the same values as the table
   above, with `NEXT_PUBLIC_SITE_URL` = `https://dorika.onrender.com`.
4. **Apply** → it builds and starts.

Manual alternative (no blueprint): **New → Web Service** → repo → Runtime **Node**,
Build `npm ci && npm run build`, Start `npm start`, Plan **Free**, then add env vars.

---

## 3. Point Supabase at the live domain

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://your-domain` (e.g. `https://dorika.vercel.app`)
- **Redirect URLs**: add
  ```
  https://your-domain/account/auth/callback
  ```

Without this, password-reset and signup-confirmation emails send people to `localhost:3000`
and the link fails.

---

## 4. Post-deploy smoke test

1. Open the home page — hero photo and headline render.
2. `/shop` → 12 seeded products.
3. Place a test order → confirm it appears in `/admin/orders`.
4. `/admin/login` with `shopdorika@gmail.com` → dashboard loads.
5. `/account/auth/login` → sign in → `/account` overview.
6. Upload a photo in `/custom-art` → check it lands in Supabase Storage → `custom-photos`.

---

## 5. Things to fix before you take real money

- **Placeholder product photos** are still picsum images — replace them in `/admin/products`.
- **Testimonials** on the home page are labelled as samples.
- **Payment gateways are not live.** COD / bank transfer work as records only; eSewa and
  Khalti just store the chosen method. Add the real redirect + verification webhook first.
- **Email** only sends if `RESEND_API_KEY` is set; otherwise confirmations are logged.
- **Security advisories.** `next@14.2.35` still has open advisories fixed only in Next 15+
  (notably image-optimizer hardening). Current mitigations: `remotePatterns` is limited to
  three known hosts and `dangerouslyAllowSVG` is off. Plan a Next 15 upgrade (it needs
  `cookies()` / `params` made async) before significant traffic.
- **Rotate the Supabase secret key** if it has ever been pasted into a chat or committed.

---

## Free-tier reality check

| | Vercel Hobby | Render Free |
|---|---|---|
| Cold start | none | ~30–60 s after 15 min idle |
| Bandwidth | 100 GB/mo | 100 GB/mo |
| Build memory | ~4 GB | 512 MB (Next builds can be tight) |
| Custom domain | yes | yes |
| Sleeps? | no | yes |

For a shop with occasional orders, either is fine. Vercel avoids the "why is the site slow?"
conversation with customers.
