-- ─────────────────────────────────────────────────────────────────────
--  06_support_chat.sql
--
--  Backing store for the storefront support widget and its admin inbox.
--
--  Flow: a visitor opens the widget, gives a name, and a thread is created.
--  The assistant answers from lib/support/knowledge.ts while
--  `ai_enabled` is true. The moment the visitor asks for a person,
--  `ai_enabled` flips to false and the assistant stops writing into that
--  thread for good — staff take over from /admin/support and their replies
--  arrive in the same widget as "Staff".
--
--  Both tables are server-only. The visitor never touches Postgres: the
--  public routes go through the service role and prove themselves with the
--  per-thread `token`, which is generated on the server and never listed.
--  RLS therefore has admin policies only, and anon has no access at all.
--
--  Run this in the Supabase SQL editor. Until you do, the widget still
--  answers questions and still shows the "waiting for staff" card — it just
--  cannot save a transcript or receive a reply.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.support_threads (
  id               uuid primary key default gen_random_uuid(),
  -- Secret handed to exactly one browser. Proves ownership of the thread.
  token            text not null,
  visitor_name     text not null,
  email            text,
  phone            text,
  status           text not null default 'bot',
  -- The switch the whole handoff hangs on.
  ai_enabled       boolean not null default true,
  unread_for_staff integer not null default 0,
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.support_threads drop constraint if exists support_threads_status_chk;
alter table public.support_threads add constraint support_threads_status_chk
  check (status in ('bot', 'awaiting_staff', 'staff_chat', 'closed'));

create index if not exists support_threads_recent_idx
  on public.support_threads (last_message_at desc);

create table if not exists public.support_messages (
  id         bigint generated always as identity primary key,
  thread_id  uuid not null references public.support_threads(id) on delete cascade,
  role       text not null,
  body       text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.support_messages drop constraint if exists support_messages_role_chk;
alter table public.support_messages add constraint support_messages_role_chk
  check (role in ('visitor', 'bot', 'staff'));

create index if not exists support_messages_thread_idx
  on public.support_messages (thread_id, id);

alter table public.support_threads  enable row level security;
alter table public.support_messages enable row level security;

-- Admin console reads and writes with the session client, so it needs the
-- policy. The storefront does not: it uses the service role via the API.
drop policy if exists support_threads_admin on public.support_threads;
create policy support_threads_admin on public.support_threads
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists support_messages_admin on public.support_messages;
create policy support_messages_admin on public.support_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- Private bucket for photos a visitor attaches. Keeping it private means the
-- only way to read an image is a signed URL minted by the server, so a
-- guessed path does not expose someone's photo.
insert into storage.buckets (id, name, public)
values ('support-uploads', 'support-uploads', false)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────
--  verify
-- ─────────────────────────────────────────────────────────────────────
-- select count(*) from public.support_threads;
-- select id, name, public from storage.buckets where id = 'support-uploads';
