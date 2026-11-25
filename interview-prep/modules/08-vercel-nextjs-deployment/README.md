# Module 08a: Vercel and Next.js deployment

**Why this module:** asked for by the micro1 Vercel Specialist role, and useful for any full-stack role that deploys Next.js (see `../../roles/`).

**How it was built (25 Nov 2026):** every Vercel docs and Knowledge Base page below was read in full (the `.md` versions on vercel.com), plus the Next.js docs (nextjs.org) and Stripe's webhook docs (docs.stripe.com). Each section names its source page and that page's last-updated date. Anything that is my own inference says so. Re-check a page before quoting it in an interview if more than a few weeks have passed.

**How to use it:** read a section, then close it and explain it out loud. The drills in section 14 are the exercise practice: answer in the order check first → why → fix → how you confirm.

**Corrections found while reading the docs (my first draft was from memory):**
- The Edge runtime is no longer the recommendation: Vercel says to migrate to Node.js, and Next.js 16.3 drops `runtime = 'edge'`.
- Cron Jobs are now legacy; Schedules replace them.
- Function limits changed: 300 s default on every plan; Hobby max 300 s, Pro max 800 s.
- The domain A record and CNAME values are per project, so read them from Settings → Domains instead of memorising one IP.

## Contents
1. Deployments, environments and Git · 2. Environment variables · 3. Promote, rollback, release states · 4. Custom domains and DNS · 5. Build settings and failures · 6. Functions, Fluid compute, runtimes · 7. Logs and observability · 8. Caching and ISR · 9. Cron Jobs vs Schedules · 10. Redirects and vercel.json · 11. Protection and skew · 12. Stripe webhooks on Vercel · 13. CLI · 14. Exercise drills

## 1. Deployments, environments and Git

Source: `/docs/git` (2026-09-18) and `/docs/deployments/environments` (2026-09-17).

**Environments**
- Three defaults: **Local, Preview, Production**. Pro/Enterprise can add **Custom Environments** (e.g. staging).

**Which deployments get created**
- Every push to a non-production branch, every PR, and `vercel` without `--prod` → a **Preview** deployment.
- Pushing or merging to the production branch (usually `main`), or `vercel --prod` → **Production**.
- Each preview gets two URLs: a branch URL (latest on that branch) and a commit URL (that exact commit).

**Gotcha: the first deployment**
- A new project's **first deployment is always production**, even from another branch.
- It builds with the **Production** env vars.

**Production branch**
- Vercel picks `main`, then `master`, then the repo's default branch.
- Change it in Settings → Environments → Production → Branch Tracking.

**New-project setup screen:** project name, Framework Preset, Root Directory, build/output settings, env vars → Deploy.

**Private repos**
- The commit author must have access to the Vercel project.
- On **Hobby**, only the account owner can trigger deployments.

**Preview protection and indexing**
- New projects start with Standard Protection + Vercel Authentication. Preview visitors must log in with an account that has access; production stays public.
- Share a preview with outsiders through a Shareable Link.
- Previews get `X-Robots-Tag: noindex`.

## 2. Environment variables

Sources:
- `/docs/environment-variables` (2026-09-17)
- `nextjs.org/docs/app/guides/environment-variables` (Aug 25, 2026)
- `/docs/environment-variables/rotating-secrets`

**Basics**
- Values are encrypted at rest.
- Each variable is **Config** (readable by members with access) or **Secret** (write-only after saving).
- Scope each variable to **Production / Preview / Development**, or to custom environments.
- A Preview variable can be scoped to **one branch**. A branch value overrides the general Preview value.

**Changes only apply to new deployments, so you must redeploy.**
- Vercel's reasoning: each deployment is immutable, which is what makes rollback safe.

**`NEXT_PUBLIC_` variables**
- Inlined into the browser bundle **at build time**, then frozen.
- Dynamic lookups like `process.env[name]` aren't inlined.
- Never put secrets in them.
- Variables without the prefix are server-only.

**Local development**
- `vercel link` → `vercel env pull` writes the Development variables into `.env.local`.
- Next.js load order (first match wins): `process.env` → `.env.$(NODE_ENV).local` → `.env.local` → `.env.$(NODE_ENV)` → `.env`.

**System variables**
- Examples: `VERCEL_ENV`, `VERCEL_URL`.
- They exist only in Vercel builds, so they're empty locally.

**Rotating a key**
1. Update the value.
2. Redeploy.
3. Verify the new deployment works.
4. *Then* revoke the old key.

**Limit:** 64 KB total per deployment.

## 3. Promote, rollback and release states

Sources:
- `/docs/deployments/promoting-a-deployment` (2026-06-26)
- `/docs/instant-rollback` (2026-07-07)
- `/docs/deployments/rollback-production-deployment` (2026-09-11)

**Instant Rollback**
- Points your production domains at an older deployment that has already served production. No rebuild; takes seconds.
- Env var changes are **not** applied: you get that build as it was.
- **Hobby:** only the immediately previous deployment. **Pro/Enterprise:** any eligible deployment.
- **Gotcha:** after a rollback, Vercel **turns off auto-assignment of production domains**, so new pushes to `main` don't go live.
- To restore normal behaviour, promote a deployment: the "Manage" button on the production tile, or `vercel promote <url>`.

**Promote a preview to production**
- Does a **full rebuild with Production env vars**; preview variables are never used in production.

**Staged production**
- Turn off "Auto-assign Custom Production Domains" → check the build on its generated URL → **Promote**.
- No rebuild; uses production env vars and data.

**Production deployment states:** Staged / Promoted / Current.

**CLI incident flow (from the docs)**
1. `vercel logs requests --environment production --query 'httpStatus >= 500 AND httpStatus < 600' --since 30m`
2. `vercel rollback <good-url>`, then `vercel rollback status`
3. `vercel inspect <bad-url> --logs`
4. Compare error logs between the good and bad deployments
5. `vercel bisect --good <url> --bad <url>`
6. Fix → `vercel deploy` (preview) → `vercel deploy --prod`

## 4. Custom domains and DNS

Sources: `/docs/domains/working-with-domains/add-a-domain` (2026-09-16) and `/docs/domains/troubleshooting` (2026-09-18).

**Adding a domain**
- Settings → Domains → Add Existing, or `vercel domains add example.com <project>`.
- Adding the apex prompts you to add `www` too. Add both and redirect one to the other.

**Records**
- **Apex** (`example.com`) → **A record**. Use the exact value shown in *your* project's Domains settings; it's per project. Many show 76.76.21.21; newer projects can show e.g. 216.198.79.1.
- Copying another project's value causes "DNS Change Recommended", "DNS Change Required" or "Invalid Configuration".
- **Subdomain / `www`** → **CNAME** to the project's own target, e.g. `d1d4fc829fe7bc7c.vercel-dns-017.com`, *including the trailing dot*.
- Why no CNAME at the apex: a CNAME can't sit alongside the NS/MX records an apex needs (RFC 1034).
- Remove other A/AAAA records on the apex. Vercel has **no IPv6** support for custom domains.
- In the DNS "Name" field, enter only `www`, not the full hostname.

**Ownership and verification**
- A domain used by another Vercel account needs a TXT record at `_vercel.<apex>`.
- A domain can belong to only one account or team at a time.

**Checking and switching**
- `dig A example.com +short`, `dig CNAME www.example.com +short`, `curl -IL https://example.com`, `vercel domains inspect example.com`.
- Before switching, lower the TTL (e.g. 60 s) and wait out the old TTL.
- Nameserver changes can take 24–48 h to propagate.

**SSL**
- Automatic via Let's Encrypt HTTP-01 once DNS points to Vercel.
- `/.well-known/acme-challenge/` must be reachable. A proxy, WAF rule or stale `_acme-challenge` record can block it.
- Wildcard domains need Vercel nameservers (DNS-01).
- Cloudflare in front with "Flexible" SSL is a common cause of `ERR_TOO_MANY_REDIRECTS`.

**Email:** Vercel doesn't host email. If you move to Vercel nameservers, re-add the MX records.

## 5. Build settings and build failures

Sources: `/docs/builds/configure-a-build` (2026-08-28) and `/docs/deployments/troubleshoot-a-build` (2026-09-21).

**Settings** (Build and Deployment): Framework Preset, Build Command, Output Directory, Install Command, Root Directory, Node.js version.
- Next.js uses the `build` script, else `next build`.
- Changes apply on the **next** deployment.
- Builds use a shallow clone (`git clone --depth=10`).

**Monorepo**
- One Vercel project per app, each with its **Root Directory**.
- Unaffected projects are skipped automatically.

**Reading a failed build**
- Deployment → **Building** logs.
- Find the red "Error" lines. The last line (e.g. "exited with 1") is rarely the cause; look above it.
- Build locally first (`npm run build`).

**No build logs at all** means a precondition failed:
- invalid `vercel.json`;
- an Ignored Build Step skipped it;
- the commit author isn't a team member;
- an integration failed to provision.

**Classic: "trying to use TypeScript but do not have the required package(s)"**
- Cause: the project sets `NODE_ENV=production`, so npm skips devDependencies.
- Fix: remove that variable (Next.js sets it itself), or install with `npm install --include=dev`.

**Limits**
- Build max **45 min** on every plan.
- Memory, CPU and disk depend on the build machine type.
- `VERCEL_BUILD_SYSTEM_REPORT=1` gives a resource report.

**Build cache**
- Kept for 1 month.
- Its key includes: team, project, framework preset, root directory, Node version, package manager, branch.
- Skip it: **Redeploy** with "Use existing Build Cache" unticked, `vercel --force`, or `VERCEL_FORCE_NO_BUILD_CACHE=1`.

## 6. Functions, Fluid compute, runtimes

Sources:
- `/docs/fluid-compute` (2026-08-24)
- `/docs/functions/limitations` (2026-08-24)
- `/docs/functions/runtimes/edge` (2026-08-03)

**Fluid compute**
- On by default for new projects since 23 Apr 2025.
- Several requests can share one instance, which means fewer cold starts. *My inference: don't keep per-request state in module globals.*
- `waitUntil` runs background work after the response.
- Bytecode caching is production only.
- An unhandled error doesn't crash other requests on the same instance.

**Max duration**

| Plan | Default | Max | Beta max |
|---|---|---|---|
| Hobby | 300 s | 300 s | — |
| Pro / Enterprise | 300 s | 800 s | 1,800 s |

- Set per route with `export const maxDuration = …`.
- A timeout returns **504 `FUNCTION_INVOCATION_TIMEOUT`**.
- Settings precedence: function code > `vercel.json` > dashboard > defaults.

**Other limits**
- Memory: Hobby 2 GB; Pro up to 4 GB.
- Request and response body: 4.5 MB (except streamed responses).
- Bundle: 250 MB uncompressed.
- Region: one by default (`iad1`), changeable.

**Edge runtime (correction to my first draft)**
- Vercel *recommends migrating from edge to Node.js*.
- From **Next.js 16.3, `runtime = 'edge'` is no longer supported**; routes run on Node.js.

## 7. Logs and observability

Sources: `/docs/logs/runtime` (2026-08-28) and `/docs/caching/cache-status` (2026-09-15).

**Where logs live**
- **Runtime logs:** the project's **Logs** tab. Function and middleware output (`console.log`), grouped per request, with Live mode.
- **Build logs:** on each deployment.
- Times are shown in UTC.

**Filters:** status, route, path, host, environment, branch, cache status, level. 4xx shows as a warning, 5xx as an error.

**CLI:** `vercel logs --environment production --query 'level:error' --since 1h`. Shows the latest 100 entries by default; doesn't stream.

**Retention**

| Plan | Retention |
|---|---|
| Hobby | 1 hour |
| Pro | 1 day |
| Enterprise | 3 days |
| Pro or Enterprise + Observability Plus | 30 days |

For longer, use **Log Drains**.

**`x-vercel-cache` header**

| Value | Meaning |
|---|---|
| HIT | Served from cache |
| MISS | Generated fresh |
| BYPASS | Cache skipped on purpose (e.g. Draft Mode) |
| STALE | Old copy served, refreshed in the background |
| PRERENDER | Served from build-time static output |
| REVALIDATED | Entry was deleted, regenerated before responding |

- The cache is scoped per deployment, so expect a cold MISS right after a new deploy.
- A `Vary: Cookie` response isn't cached.

**Analytics and Speed Insights**
- Web Analytics: enable it in the Analytics tab and add `<Analytics />` from `@vercel/analytics/next` to the root layout.
- Speed Insights shows Core Web Vitals.

## 8. Caching and ISR in Next.js on Vercel

Sources:
- `nextjs.org/docs/app/guides/incremental-static-regeneration` (Oct 15, 2026)
- `.../how-revalidation-works` (Jun 1, 2026)
- `/docs/frameworks/full-stack/nextjs` (2026-11-14)

**Time-based ISR**
- `export const revalidate = 3600`, or `fetch(url, { next: { revalidate: 10 } })`.
- After the window, the next visitor still gets the stale page while it regenerates in the background.
- The docs recommend a high value (1 h, not 1 s).

**On-demand**
- `revalidatePath('/posts')`, or `revalidateTag('posts', 'max')` with `fetch(url, { next: { tags: ['posts'] } })`.
- The page regenerates on the next request.
- Proxy/middleware doesn't run for on-demand ISR, so revalidate the exact path.

**Other rules**
- `fetch` isn't cached by default.
- Any fetch with `revalidate: 0` or `no-store` makes the route dynamic.
- If regeneration throws, the last good page keeps being served.

**On Vercel**
- ISR pages are stored durably and served from the global CDN.
- The docs cite global updates in about 300 ms.
- Self-hosted ISR is single-region and not durable by default.

**Next.js 16:** Partial Prerendering is built into `cacheComponents: true` together with `'use cache'`.

## 9. Scheduled jobs: Cron Jobs vs Schedules (correction)

Sources:
- `/docs/schedules` (2026-10-26)
- `/docs/schedules/cron-jobs/manage-cron-jobs` (2026-08-11)

**Status:** Cron Jobs are now **legacy**, and **Schedules (beta, all plans) replace them**. Know both.

**Cron Jobs**
- Defined in `vercel.json` `crons`; Vercel sends an HTTP GET.
- **Production only**; UTC only.
- Hobby: once per day, at any time within the scheduled hour.
- Security: set `CRON_SECRET`. Vercel sends `Authorization: Bearer <secret>`; reject anything else with 401.
- A deployment captures the secret at build time, so rotating it needs a redeploy.
- **No retries.** Runs can be missed or doubled, so make jobs **idempotent**: "set status active" is safe, "add 10 credits" is not.
- Use a lock if one run can overlap the next.
- Cron requests **don't follow redirects** (watch Next.js `trailingSlash`).
- A cached or redirected response doesn't show in the logs. Add `export const dynamic = 'force-dynamic'`.

**Schedules**
- Timezones, private function targets, preview environments too, one-off runs, run history, pause or run without redeploying.

## 10. Redirects, rewrites, vercel.json

Sources: `/docs/routing/redirects` (2026-09-18) and `/docs/project-configuration/vercel-json`.

**Syntax**
- `"redirects": [{ "source": "/old", "destination": "/new", "permanent": true }]` → 308; `permanent: false` → 307.
- A **rewrite** keeps the URL in the browser; a redirect changes it.
- 307/308 keep the HTTP method, which is why they're recommended for APIs.

**Next.js on Vercel**
- Put redirects/rewrites in `next.config.js`, **not** `vercel.json`. Using both causes conflicts (404 guide).
- Single-page apps (Vite/CRA) need a catch-all rewrite to `/index.html`.

**Other ways to redirect**
- Domain redirects (www ↔ apex) in the dashboard.
- Emergency redirects as a Firewall rule: no deploy needed, they run first.

**URL handling**
- The CDN turns `//` into `/` with a 308.
- Paths are **case-sensitive**: `/About` and `/about` are different.

## 11. Protection and skew

Sources: `/docs/deployment-protection` (2026-09-15) and `/docs/skew-protection` (2026-09-16).

**Deployment Protection**
- **Standard Protection** (recommended, all plans) protects everything except production domains.
- Methods: Vercel Authentication (all plans); Password (Pro add-on); Trusted IPs and Passport (Enterprise).
- **Gotcha:** with Standard Protection, the production *generated* URL is protected. Code that calls `${VERCEL_URL}/api/...` breaks.
- Fix: relative `fetch('/api/...')` on the client; on the server, use the request's origin and forward the cookie.

**Skew Protection** (Pro/Enterprise)
- Keeps an open page talking to the deployment that served it, so old clients don't break after a new deploy.
- On by default for projects created after 19 Nov 2024 with supported frameworks.
- Full page loads always get the latest deployment.

## 12. Stripe webhooks on Vercel (your real story)

Sources: `docs.stripe.com/webhooks` (read 25 Nov) and `/webhooks/signature`.

**Verifying the event**
- Read the **raw** body in the route handler: `const body = await request.text()`.
- Then `stripe.webhooks.constructEvent(body, request.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET)`.
- Parsing or changing the body breaks verification. Invalid → 400.

**Handling it safely**
- **Return 2xx quickly**, before slow work.
- Stripe retries for up to **3 days** in live mode.
- **Events can arrive twice and out of order.** Store processed event IDs and skip repeats. Don't use `created` for ordering.
- Subscribe only to the event types you need.

**On Vercel**
- Use a separate signing secret per environment (test endpoint for Preview, live endpoint for Production), as scoped env vars.
- Changing a secret needs a redeploy.

## 13. CLI you should be able to say out loud

Source: `/docs/cli` (2026-11-14).

- **Setup:** `npm i -g vercel` · `vercel login` · `vercel link` · `vercel pull`
- **Env vars:** `vercel env pull` / `add` / `list`
- **Deploy:** `vercel` (preview) · `vercel --prod` · `vercel --force` · `vercel build` + `vercel deploy --prebuilt`
- **Inspect:** `vercel list` · `vercel inspect <url> --logs` · `vercel logs`
- **Release:** `vercel promote` · `vercel rollback` · `vercel redeploy <url>`
- **Domains:** `vercel domains add|inspect` · `vercel dns list|add`
- **Testing a protected preview:** `vercel curl /path --deployment <url>`
- **CI:** authenticate with the `VERCEL_TOKEN` environment variable. It's safer than `--token` on the command line.

## 14. Exercise drills (practise saying these out loud)

These are built from Vercel's own troubleshooting guides. Answer in this order: **what you check first → why → the fix → how you confirm it**.

1. **"The custom domain shows 404, but the `.vercel.app` URL works."**
   - The deployment is healthy, so it's DNS.
   - Compare `dig A`/`dig CNAME` with the values in Settings → Domains or `vercel domains inspect`.
   - Remove old records; add both apex and `www`; wait for propagation (lower the TTL next time).
   - Then check SSL issuance isn't blocked.
   - *Source: KB "why-is-my-deployed-project-giving-404" (2026-07-28).*
2. **"The build says Ready, but every page is 404."**
   - Check the Framework Preset; "Other" means no routing manifest. Set Next.js and redeploy.
   - Then check the Output Directory.
   - Local `next start` working proves nothing, because it routes from the filesystem.
   - *Same source.*
3. **"I changed `STRIPE_SECRET_KEY` in the dashboard, but production still uses the old key."**
   - Env var changes apply only to new deployments. Redeploy and confirm the new deployment is Current.
   - If the site was rolled back earlier, auto-assign is off: promote the new deployment.
   - *Sources: `/docs/environment-variables`, `/docs/instant-rollback`.*
4. **"`NEXT_PUBLIC_API_URL` is undefined in the browser" or "the preview talks to the production database."**
   - `NEXT_PUBLIC_` values are inlined at build time. Is it set for the environment you *built*? Is it referenced by its full name? Redeploy.
   - For previews: is the variable scoped to Preview (or that branch)?
   - *Source: env var troubleshooting table.*
5. **"Production broke after a deploy."**
   - Confirm in the logs (5xx filter).
   - **Instant Rollback** (seconds, no rebuild).
   - Investigate with `vercel inspect --logs` and compare error logs.
   - Fix on a preview, then promote or deploy to production.
   - Remember: after a rollback, pushes don't go live until you promote.
6. **"My pushes to GitHub don't create deployments."**
   - In order:
     1. The Git login connection (Account Settings → Authentication).
     2. The commit author's access (Hobby = owner only).
     3. `git config user.email` matches the GitHub email.
     4. The production branch name.
     5. The webhook and the GitHub App's repo access.
     6. An Ignored Build Step (exit 0 = **skip**).
     7. The daily deployment limit.
   - *Source: KB "why-aren't-commits-triggering-deployments" (2026-10-16).*
7. **"An API route returns 504."**
   - It's `FUNCTION_INVOCATION_TIMEOUT`: check the duration in runtime logs.
   - Raise `maxDuration` within plan limits (Hobby max 300 s).
   - Better: speed it up, stream, or move work to `waitUntil` or a queue.
8. **"The nightly cron didn't run" or "it returns 401."**
   - Cron runs only on production deployments.
   - 401 means the `CRON_SECRET` doesn't match or isn't set for Production; redeploy after editing.
   - A redirect (`trailingSlash`) means it never reaches your handler.
   - Make the job idempotent.
