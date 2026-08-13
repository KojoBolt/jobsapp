-- =====================================================================
--  Real company logos, replacing a guess.
--
--  The dashboard previously derived a logo URL by guessing a domain from
--  the company name ("Corriculo Ltd" → corriculo.com). When the guess hit
--  a domain that exists but belongs to someone else — very often a parked
--  for-sale page — a valid favicon came back and a stranger's icon was
--  rendered beside a real employer's name. That is undetectable from the
--  image itself, so the guess had to go.
--
--  Several sources already hand us the employer's own logo or website and
--  the normalizers were discarding them. This column stores that, and the
--  UI now shows a logo ONLY when one is genuinely known — initials
--  otherwise. Never a stranger's mark.
-- =====================================================================

-- Directly renderable image URL, or null when the source gave us nothing.
alter table public.applications
  add column if not exists company_logo text;

-- Greenhouse postings carry no logo, but ats_companies is our own curated
-- table — a hand-checked domain here is knowledge, not a guess.
alter table public.ats_companies
  add column if not exists domain text;

-- Domains for the seeded boards. Same caveat as the board tokens: verify as
-- you go. A wrong domain here shows the wrong logo, so anything you are not
-- sure about is better left null — the row falls back to initials.
update public.ats_companies set domain = v.domain
from (values
  ('stripe',         'stripe.com'),
  ('databricks',     'databricks.com'),
  ('gitlab',         'gitlab.com'),
  ('cloudflare',     'cloudflare.com'),
  ('doordash',       'doordash.com'),
  ('instacart',      'instacart.com'),
  ('coinbase',       'coinbase.com'),
  ('robinhood',      'robinhood.com'),
  ('plaid',          'plaid.com'),
  ('brex',           'brex.com'),
  ('ramp',           'ramp.com'),
  ('affirm',         'affirm.com'),
  ('wealthfront',    'wealthfront.com'),
  ('chime',          'chime.com'),
  ('gusto',          'gusto.com'),
  ('figma',          'figma.com'),
  ('dropbox',        'dropbox.com'),
  ('reddit',         'reddit.com'),
  ('discord',        'discord.com'),
  ('pinterest',      'pinterest.com'),
  ('lyft',           'lyft.com'),
  ('twilio',         'twilio.com'),
  ('hashicorp',      'hashicorp.com'),
  ('sourcegraph',    'sourcegraph.com'),
  ('samsara',        'samsara.com'),
  ('asana',          'asana.com'),
  ('benchling',      'benchling.com'),
  ('scaleai',        'scale.com'),
  ('anthropic',      'anthropic.com'),
  ('webflow',        'webflow.com'),
  ('retool',         'retool.com'),
  ('vercel',         'vercel.com'),
  ('mercury',        'mercury.com'),
  ('oscarhealth',    'hioscar.com'),
  ('included',       'includedhealth.com'),
  ('flatironhealth', 'flatiron.com'),
  ('zocdoc',         'zocdoc.com'),
  ('komodohealth',   'komodohealth.com'),
  ('clio',           'clio.com'),
  ('ironcladhq',     'ironcladapp.com')
) as v(board_token, domain)
where public.ats_companies.provider = 'greenhouse'
  and public.ats_companies.board_token = v.board_token;
