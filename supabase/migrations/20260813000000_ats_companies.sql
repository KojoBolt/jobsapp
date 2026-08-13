-- =====================================================================
--  ats_companies — the company registry for board-type job sources.
--
--  Search sources (Adzuna, JSearch, Reed…) take a keyword and search the
--  world. Board sources (Greenhouse, and later Lever/Ashby) only answer
--  "what is open at THIS company?" and are addressed by a board token.
--  That company list is data, not code, so it lives here where it can be
--  grown, tagged and retired without a function redeploy.
--
--  Read exclusively by supabase/functions/_shared/greenhouse.ts using the
--  service role.
-- =====================================================================

create table if not exists public.ats_companies (
  id              uuid primary key default gen_random_uuid(),
  provider        text        not null default 'greenhouse',
  -- The board slug, e.g. 'stripe' in boards-api.greenhouse.io/v1/boards/stripe
  board_token     text        not null,
  company_name    text        not null,
  -- Matched against identity_vault_data.targeting.industries, so these MUST
  -- use the same vocabulary as `industries` in src/pages/IdentityVault.tsx.
  industries      text[]      not null default '{}',
  -- Set false to stop crawling a board. The adapter flips this itself when a
  -- token 404s, so a wrong slug costs one request, not one per run forever.
  is_active       boolean     not null default true,
  last_error      text,
  last_fetched_at timestamptz,
  created_at      timestamptz not null default now(),

  constraint ats_companies_provider_token_key unique (provider, board_token)
);

-- The adapter's only query shape: active boards for one provider.
create index if not exists ats_companies_active_idx
  on public.ats_companies (provider, is_active);

-- Industry narrowing uses the && (overlaps) operator, which needs GIN.
create index if not exists ats_companies_industries_idx
  on public.ats_companies using gin (industries);

-- Locked down: no policies means no client can read or write it. Only the
-- service role (which bypasses RLS) touches this table, and it holds our
-- sourcing strategy — not something to expose to the browser.
alter table public.ats_companies enable row level security;

-- =====================================================================
--  Seed
--
--  ⚠️ These board tokens are a STARTING LIST and are not individually
--  verified. That is by design rather than an oversight: a wrong token
--  returns 404, the adapter logs it and sets is_active = false, and it is
--  never requested again. Check the Greenhouse counters in the function
--  logs after the first few runs and top the list back up.
--
--  To confirm a token by hand:
--    curl https://boards-api.greenhouse.io/v1/boards/<token>/jobs
--
--  Industry tags follow src/pages/IdentityVault.tsx exactly. They are
--  deliberately broad — a company tagged only 'Engineering' becomes
--  invisible to every designer and salesperson on the platform.
-- =====================================================================

insert into public.ats_companies (provider, board_token, company_name, industries) values
  ('greenhouse', 'stripe',        'Stripe',        array['Engineering','Product','Design','Data Science','Finance','Sales','Operations']),
  ('greenhouse', 'databricks',    'Databricks',    array['Engineering','Product','Data Science','Sales','Marketing']),
  ('greenhouse', 'gitlab',        'GitLab',        array['Engineering','Product','Design','Marketing','Sales','Operations']),
  ('greenhouse', 'cloudflare',    'Cloudflare',    array['Engineering','Product','Design','Sales','Marketing','Operations']),
  ('greenhouse', 'doordash',      'DoorDash',      array['Engineering','Product','Design','Data Science','Operations','Marketing']),
  ('greenhouse', 'instacart',     'Instacart',     array['Engineering','Product','Design','Data Science','Operations','Marketing']),
  ('greenhouse', 'coinbase',      'Coinbase',      array['Engineering','Product','Design','Finance','Legal','Data Science']),
  ('greenhouse', 'robinhood',     'Robinhood',     array['Engineering','Product','Design','Finance','Legal','Data Science']),
  ('greenhouse', 'plaid',         'Plaid',         array['Engineering','Product','Design','Finance','Sales']),
  ('greenhouse', 'brex',          'Brex',          array['Engineering','Product','Design','Finance','Sales','Operations']),
  ('greenhouse', 'ramp',          'Ramp',          array['Engineering','Product','Design','Finance','Sales','Marketing']),
  ('greenhouse', 'affirm',        'Affirm',        array['Engineering','Product','Design','Finance','Data Science','Legal']),
  ('greenhouse', 'wealthfront',   'Wealthfront',   array['Engineering','Product','Design','Finance']),
  ('greenhouse', 'chime',         'Chime',         array['Engineering','Product','Design','Finance','Operations']),
  ('greenhouse', 'gusto',         'Gusto',         array['Engineering','Product','Design','Finance','Operations','Sales']),
  ('greenhouse', 'figma',         'Figma',         array['Engineering','Product','Design','Marketing','Sales']),
  ('greenhouse', 'dropbox',       'Dropbox',       array['Engineering','Product','Design','Marketing','Sales','Operations']),
  ('greenhouse', 'reddit',        'Reddit',        array['Engineering','Product','Design','Data Science','Marketing','Sales']),
  ('greenhouse', 'discord',       'Discord',       array['Engineering','Product','Design','Marketing','Operations']),
  ('greenhouse', 'pinterest',     'Pinterest',     array['Engineering','Product','Design','Data Science','Marketing','Sales']),
  ('greenhouse', 'lyft',          'Lyft',          array['Engineering','Product','Design','Data Science','Operations','Marketing']),
  ('greenhouse', 'twilio',        'Twilio',        array['Engineering','Product','Design','Sales','Marketing','Operations']),
  ('greenhouse', 'hashicorp',     'HashiCorp',     array['Engineering','Product','Design','Sales','Marketing']),
  ('greenhouse', 'sourcegraph',   'Sourcegraph',   array['Engineering','Product','Design','Marketing','Sales']),
  ('greenhouse', 'samsara',       'Samsara',       array['Engineering','Product','Design','Sales','Operations','Data Science']),
  ('greenhouse', 'asana',         'Asana',         array['Engineering','Product','Design','Marketing','Sales','Operations']),
  ('greenhouse', 'benchling',     'Benchling',     array['Engineering','Product','Design','Healthcare','Data Science','Sales']),
  ('greenhouse', 'scaleai',       'Scale AI',      array['Engineering','Product','Design','Data Science','Operations','Sales']),
  ('greenhouse', 'anthropic',     'Anthropic',     array['Engineering','Product','Design','Data Science','Legal','Operations']),
  ('greenhouse', 'webflow',       'Webflow',       array['Engineering','Product','Design','Marketing','Sales']),
  ('greenhouse', 'retool',        'Retool',        array['Engineering','Product','Design','Sales','Marketing']),
  ('greenhouse', 'vercel',        'Vercel',        array['Engineering','Product','Design','Marketing','Sales']),
  ('greenhouse', 'mercury',       'Mercury',       array['Engineering','Product','Design','Finance','Operations']),
  ('greenhouse', 'oscarhealth',   'Oscar Health',  array['Engineering','Product','Design','Healthcare','Data Science','Operations']),
  ('greenhouse', 'included',      'Included Health', array['Engineering','Product','Design','Healthcare','Operations','Data Science']),
  ('greenhouse', 'flatironhealth','Flatiron Health', array['Engineering','Product','Design','Healthcare','Data Science']),
  ('greenhouse', 'zocdoc',        'Zocdoc',        array['Engineering','Product','Design','Healthcare','Sales','Marketing']),
  ('greenhouse', 'komodohealth',  'Komodo Health', array['Engineering','Product','Healthcare','Data Science','Sales']),
  ('greenhouse', 'clio',          'Clio',          array['Engineering','Product','Design','Legal','Sales','Marketing']),
  ('greenhouse', 'ironcladhq',    'Ironclad',      array['Engineering','Product','Design','Legal','Sales','Marketing'])
on conflict (provider, board_token) do nothing;
