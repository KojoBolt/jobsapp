# Job application worker

Applies to jobs on behalf of users. Runs on **Railway**, not as a Supabase edge
function — Playwright needs a real browser binary and a process that lives
longer than a request.

Today it claims work, classifies it, and routes anything it can't handle to a
human. No browser code yet; that arrives with the first adapter.

---

## Deploying

**1. Push this branch.** Railway reads `railway.toml` from the repo root.

**2. Railway dashboard → New Project → Deploy from GitHub repo**, select this
repository.

**3. Leave the Root Directory at the repo root.** This is the one setting worth
getting right. `railway.toml` points the build at `worker/Dockerfile` while the
context stays at the root, because the Dockerfile copies the shared ATS routing
table out of `supabase/functions/_shared/`. Moving the root to `worker/` puts
that folder outside the context and the build fails on a missing `COPY` source.

**4. Add two variables** under the service's Variables tab:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` |

The service role key bypasses RLS. It belongs in Railway and in your gitignored
`worker/.env`, nowhere else — never in the frontend, never committed.

`DRY_RUN` is not set here on purpose: anything other than the exact string
`"false"` means dry run, so leaving it unset is the safe default. You'll add it
explicitly when you're ready for real applications to go out.

**5. Set a usage limit.** Railway bills what you actually consume, which is why
it's cheap for this workload — but it also means a memory leak or a runaway
loop shows up on the bill instead of as a crash. Set a spending cap on day one;
it takes a minute and it's the whole mitigation.

**6. Watch the logs.** A healthy start looks like:

```
worker starting  { workerId: "...", dryRun: true, adapters: 0, pollIntervalMs: 15000 }
no adapters registered — every application will be routed to a human
```

That second line is expected until the Greenhouse adapter lands.

First build takes several minutes — the Playwright base image is over a
gigabyte because it ships the browsers preinstalled. Later builds are much
faster, and dependency-only layers are cached.

---

## Things that are the way they are on purpose

**No port is bound.** This process polls a queue and serves nothing. Railway is
fine with that; it only waits for a port on services you've given a domain.

**`watchPatterns` limits what triggers a deploy.** Without it, every frontend
commit would rebuild and restart the worker, interrupting whatever it was
applying to for no reason.

**`restartPolicyType = "ON_FAILURE"`.** The process exits 0 only after a
shutdown signal, which Railway sends when it's deliberately stopping or
redeploying it. Restarting on a clean exit would fight that.

**Deploys interrupt work in flight, and that's safe.** SIGTERM finishes the
current item; anything not finished in time has its claim go stale and gets
picked up by `releaseStaleClaims()` on a later cycle.

**`DRY_RUN` only turns off for the exact string `"false"`.** A typo leaves you
safe rather than submitting real applications.

---

## The Greenhouse adapter

`src/adapters/greenhouse.ts` fills the form, attaches the CV, answers what it
can from the Identity Vault, screenshots the result, and — in dry run — stops
short of submitting.

**The rule it is built around:** a required question with no answer in the
vault parks the application for a human. It never gets a guess. "Are you
legally authorised to work in the United States?" is a legal declaration made
in the candidate's name; a wrong answer is not a worse application, it is a
false statement on a real one.

Two consequences worth knowing:

**Past the submit click, nothing returns `failed`.** A failure hands the row
back for a retry, and a retry after a successful submit applies twice. Anything
ambiguous after that point — clicked submit, saw no confirmation — goes to a
human instead.

**Selectors are best-effort.** Greenhouse has shipped two form generations and
both are live, plus an embedded iframe variant, so each field is a list of
candidate selectors tried in order. They have not been validated against real
postings yet. That is exactly what the dry run is for: read the screenshots.

Chromium launches with `--disable-dev-shm-usage`. Containers get a very small
`/dev/shm`, which Chromium uses for shared memory, and tabs crash under load
without it — surfacing as a generic Playwright timeout rather than anything
mentioning memory.

You *don't* need to size the instance up first, which a fixed-size host would
have required. Railway meters actual memory rather than enforcing a ceiling, so
a browser that briefly wants 800MB gets it and shows up on the bill rather than
being killed. Watch the usage graph after the first browser deploy — that's
your real memory profile.

**The `playwright` version in package.json must match the Dockerfile's base
image tag.** The image contains browser builds for exactly that version, and a
mismatch fails at launch with "Executable doesn't exist", not at build time.

One thing to know before real traffic: outbound requests leave from Railway's
shared address space. Be gentle with request pacing — if job boards start
blocking, the fix is a host with a dedicated IP (a $12 DigitalOcean Droplet is
the obvious next step) or a proxy layer. That's a deployment change, not a code
change, because everything lives in the Dockerfile.

---

## Running locally

```bash
cd worker
cp .env.example .env      # then fill in the two Supabase values
npm install
npm start                 # poll loop, same as production
npm run backfill          # classify existing applications, no writes
npm run typecheck
```

`.env` is gitignored. `.env.example` is committed and must never hold a real
value.

---

## Layout

| File | Purpose |
|---|---|
| `src/index.ts` | Poll loop, batching, graceful shutdown |
| `src/queue.ts` | Atomic claiming, parking, retry, submission |
| `src/process.ts` | What happens to one application |
| `src/config.ts` | Environment, validated at boot |
| `src/adapters/` | Per-ATS browser automation — **empty for now** |
| `src/backfill.ts` | One-off: how much existing work is automatable |

`railway.toml` and `.dockerignore` live at the **repo root**, not here, because
that's where the build context is.
