# Microsoft's Playwright image: it ships Chromium plus the system libraries
# Chrome needs, which a plain node image does not.
#
# KEEP THIS TAG AND THE `playwright` VERSION IN worker/package.json IDENTICAL.
# The image contains browser builds for exactly this version, and the npm
# package looks for a build directory named after its own version — so a
# mismatch fails at launch with "Executable doesn't exist", not at build time.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

WORKDIR /app

# IMPORTANT: build context is the REPO ROOT, not worker/.
# The worker imports the ATS routing table from supabase/functions/_shared so
# there is only one copy of it. railway.toml handles this: it sets
# dockerfilePath = "worker/Dockerfile" while the service's Root Directory stays
# at the repo root. Moving that Root Directory to worker/ puts the shared
# folder outside the context and the build fails on a missing COPY source —
# which is the usual way this goes wrong.

# Manifest and lockfile first, and nothing else: this layer is then cached
# across every deploy that does not change dependencies, which is most of them.
COPY worker/package.json worker/package-lock.json ./worker/
WORKDIR /app/worker
# `ci`, not `install` — it installs exactly the lockfile and fails loudly if
# the two have drifted, rather than resolving something new inside a container
# nobody is watching.
RUN npm ci --omit=dev

WORKDIR /app
# Dependencies install as root and stay root-owned, which is fine — they are
# world-readable and nothing at runtime writes to them. Source is handed to
# pwuser so the running process owns what it reads.
COPY --chown=pwuser:pwuser worker/ ./worker/
COPY --chown=pwuser:pwuser supabase/functions/_shared/ ./supabase/functions/_shared/

WORKDIR /app/worker

# HOME is set explicitly: the base image leaves it pointing at /root, and a
# non-root process that tries to write a cache there fails at startup in a way
# the error message does not explain.
ENV NODE_ENV=production \
    HOME=/home/pwuser

# The Playwright image ships a `pwuser`. Running as root is not needed, and
# Chromium is the process here most likely to meet hostile input.
USER pwuser

# Run TypeScript directly. The worker is not latency-sensitive and skipping a
# build step keeps the shared-file import working without bundler config.
# The binary directly rather than `npx`: npx can decide to consult the registry
# and write to a cache, neither of which a non-root process in a container
# should be relying on at startup.
CMD ["./node_modules/.bin/tsx", "src/index.ts"]
