-- =====================================================================
--  ats_accounts — login credentials for ATS tenants that require one.
--
--  Greenhouse and Lever let anyone apply anonymously. Workday does not:
--  every employer runs its own tenant (nvidia.wd5.myworkdayjobs.com,
--  stripe.wd1.myworkdayjobs.com…) and each one wants an account before it
--  will show you an application form. Those accounts are unrelated to each
--  other, so applying to twelve Workday employers means twelve accounts.
--
--  The worker creates them in the candidate's name, with their email and a
--  generated password, and stores the password here so a later application to
--  the same employer signs in rather than colliding with an existing account.
--
--  ── This table is the most sensitive thing in the database. ──
--
--  A leaked CV is embarrassing. A leaked password is an account takeover on a
--  third-party system in someone else's name — and people reuse passwords, so
--  the blast radius is not limited to Workday. Three defences, and none of
--  them is sufficient alone:
--
--   1. The password is stored ENCRYPTED (AES-256-GCM), never as plaintext and
--      never as a hash — a hash cannot be replayed into a login form, so this
--      genuinely has to be reversible, which is exactly why the rest matters.
--   2. The key lives ONLY in worker env (Railway) and edge-function secrets.
--      It is never in this database, so a database compromise alone yields
--      ciphertext. Never commit it, and never expose it to the browser.
--   3. Column-level grants below mean `password_cipher` is not selectable by
--      `authenticated` AT ALL. Owners can list their accounts; nobody reading
--      through the client key can read the ciphertext, let alone the password.
--
--  Revealing a password to its owner goes through an edge function that holds
--  the key and checks ownership. That is a deliberate choke point: one place
--  to audit, one place to rate-limit, one place that can log the access.
-- =====================================================================

create table if not exists public.ats_accounts (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  -- Matches AtsProvider in supabase/functions/_shared/ats.ts.
  provider       text        not null,
  -- The tenant host, e.g. 'nvidia.wd5.myworkdayjobs.com'. Host rather than
  -- company name because the host is what decides which account applies, and
  -- two companies can share a name where they cannot share a host.
  tenant         text        not null,
  login_email    text        not null,
  -- base64(iv) . base64(authTag) . base64(ciphertext), dot-separated.
  -- GCM, so the tag is what makes tampering detectable rather than silently
  -- decrypting to rubbish that then gets typed into a login form.
  password_cipher text       not null,
  created_at     timestamptz not null default now(),
  last_used_at   timestamptz,
  -- Set when a sign-in fails, so the worker stops retrying a broken account
  -- every cycle instead of locking it out.
  last_error     text,

  -- One account per candidate per tenant. This is the constraint that stops
  -- the worker creating a second account when it should be signing in — which
  -- on most tenants fails anyway, because the email is already registered.
  constraint ats_accounts_user_tenant_key unique (user_id, provider, tenant)
);

-- The worker's only query shape: "do we already have an account here?"
create index if not exists ats_accounts_lookup_idx
  on public.ats_accounts (user_id, provider, tenant);

alter table public.ats_accounts enable row level security;

-- Owners may see WHICH accounts exist — useful in the dashboard, and it is
-- their own data. The password column is excluded by the grants below, so this
-- policy cannot leak it.
create policy "Users read their own ATS accounts"
  on public.ats_accounts for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies for `authenticated`, deliberately. Rows are
-- written by the worker under the service role, which bypasses RLS. A client
-- that could write here could point a stored credential at a tenant of its
-- choosing and have the worker type it in.

-- Column-level lockdown. RLS decides WHICH ROWS you may read; this decides
-- WHICH COLUMNS. Without it, a user's own SELECT would return their
-- ciphertext, which is a copy of the secret sitting in browser memory for no
-- reason. Revoke first, then re-grant everything except the cipher.
revoke all on public.ats_accounts from anon, authenticated;
grant select (id, user_id, provider, tenant, login_email, created_at, last_used_at, last_error)
  on public.ats_accounts to authenticated;
