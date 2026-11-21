-- ════════════════════════════════════════════════════════════════════
--  04 — Manual payment details (eSewa / Khalti / Bank transfer)
--
--  Run this once in Supabase → SQL Editor.
--  Safe to re-run: every statement uses IF NOT EXISTS.
--
--  Why manual: merchant gateways in Nepal (eSewa, Khalti, ConnectIPS)
--  require a paid merchant account (reported ~Rs 25–30k onboarding plus
--  2–3% per transaction). Until volume justifies that, the customer pays
--  directly to the shop's wallet/account, enters the transaction id, and
--  the owner confirms with "Mark as paid" in the admin panel.
-- ════════════════════════════════════════════════════════════════════

-- Where customers send money. Shown at checkout only when non-empty.
alter table public.settings
  add column if not exists esewa_id            text,
  add column if not exists khalti_id           text,
  add column if not exists bank_name           text,
  add column if not exists bank_account_name   text,
  add column if not exists bank_account_number text,
  add column if not exists bank_qr_url         text,
  add column if not exists payment_note        text;

-- What the customer tells us after paying.
alter table public.orders
  add column if not exists payment_reference text,
  add column if not exists paid_at           timestamptz,
  add column if not exists paid_by           text;

-- Helpful when reconciling a day's transfers against the bank statement.
create index if not exists orders_payment_reference_idx
  on public.orders (payment_reference)
  where payment_reference is not null;

-- Verify
select
  column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('settings', 'orders')
  and column_name in (
    'esewa_id', 'khalti_id', 'bank_name', 'bank_account_name',
    'bank_account_number', 'bank_qr_url', 'payment_note',
    'payment_reference', 'paid_at', 'paid_by'
  )
order by table_name, column_name;
