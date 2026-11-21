/**
 * Full data backup of the Dorika Supabase project.
 *
 * Uses the Supabase REST + Storage APIs with the service-role key, so it needs
 * NO database password and no Postgres client installed. Node 18+ only.
 *
 *   node scripts/backup.mjs
 *
 * Output (gitignored):
 *   backups/dorika-YYYY-MM-DD_HHmmss/
 *     tables/<table>.json     every row, one array per table
 *     storage-index.json      every stored file path + metadata
 *     storage/<path>          customer-uploaded photos (private bucket)
 *     MANIFEST.json           counts, sizes, timestamps, key fingerprints
 *
 * What this does NOT capture: schema, functions, RLS policies, triggers.
 * Those live in supabase/*.sql and the git history — restore by running the
 * SQL files against a fresh project, then re-importing these JSON rows.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

// ── Load .env.local without pulling in a dependency ──────────────
function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...loadEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Every table that holds irreplaceable business data.
const TABLES = [
  "profiles",
  "categories",
  "products",
  "product_images",
  "orders",
  "order_items",
  "order_events",
  "custom_requests",
  "custom_events",
  "addresses",
  "settings",
  "contact_messages",
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
const root = join("backups", `dorika-${stamp}`);
mkdirSync(join(root, "tables"), { recursive: true });

const PACE = 1000; // Supabase caps REST responses; page through to be safe
const manifest = { created_at: new Date().toISOString(), project: url, tables: {}, storage: {} };

for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += PACE) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .range(from, from + PACE - 1);

    if (error) {
      // A table that doesn't exist is not fatal — record and continue.
      manifest.tables[table] = { error: error.message, rows: 0 };
      console.warn(`  ${table}: ${error.message}`);
      break;
    }
    rows.push(...data);
    if (data.length < PACE) break;
  }

  if (!manifest.tables[table]?.error) {
    writeFileSync(join(root, "tables", `${table}.json`), JSON.stringify(rows, null, 2));
    manifest.tables[table] = { rows: rows.length };
    console.log(`  ${table}: ${rows.length} rows`);
  }
}

// ── Storage: index everything, download the irreplaceable bucket ──
async function walk(bucket, prefix = "") {
  const out = [];
  const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) {
    console.warn(`  storage ${bucket}/${prefix}: ${error.message}`);
    return out;
  }
  for (const item of data) {
    if (item.id === null) {
      out.push(...(await walk(bucket, prefix ? `${prefix}/${item.name}` : item.name)));
    } else {
      out.push({ bucket, path: prefix ? `${prefix}/${item.name}` : item.name, size: item.metadata?.size ?? null });
    }
  }
  return out;
}

const BUCKETS = ["custom-photos", "product-images"];
const index = [];

for (const bucket of BUCKETS) {
  const files = await walk(bucket);
  index.push(...files);
  manifest.storage[bucket] = { files: files.length };

  // Customer uploads are irreplaceable; product images are re-addable from disk.
  if (bucket === "custom-photos") {
    for (const f of files) {
      const { data, error } = await db.storage.from(bucket).download(f.path);
      if (error) {
        console.warn(`  download ${f.path}: ${error.message}`);
        continue;
      }
      const dest = join(root, "storage", bucket, f.path);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, Buffer.from(await data.arrayBuffer()));
    }
  }
}

writeFileSync(join(root, "storage-index.json"), JSON.stringify(index, null, 2));

// Fingerprint the keys used, never the values themselves.
manifest.key_fingerprint = {
  url,
  service_role: `${key.slice(0, 12)}…${key.slice(-4)}`,
};

writeFileSync(join(root, "MANIFEST.json"), JSON.stringify(manifest, null, 2));

const totalRows = Object.values(manifest.tables).reduce((n, t) => n + (t.rows ?? 0), 0);
console.log(`\nBackup complete: ${root}`);
console.log(`  ${totalRows} rows across ${Object.keys(manifest.tables).length} tables`);
console.log(`  ${index.length} stored files indexed`);
