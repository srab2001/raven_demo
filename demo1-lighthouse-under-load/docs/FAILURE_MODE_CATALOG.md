# Failure Mode Catalog — Lighthouse Under Load

Six chaos scenarios, toggled from the "Chaos controls" panel. Every scenario is
implemented in `apps/web/src/lib/lighthouseClient.ts` as a simulated
Lighthouse client — this deploys as a static site with no backend proxy, so
there is nowhere to hold an OAuth secret or a live path to
`sandbox-api.va.gov`. The simulated client mirrors the real request/response
shapes and timing described in the build brief; swapping it for real calls
through `apps/proxy` is the only change needed to go live.

| Chaos toggle | HTTP evidence | Client behavior | Acceptance criterion |
| --- | --- | --- | --- |
| Happy path | `200 OK` from Patient/v0, Clinical/v0, Coverage/v0 | Renders confirmed eligibility, redacted PII, latency waterfall | Lookup completes, no PII in DOM |
| Revoke token | First call → `401`, then `200` after re-auth | Event log shows 401 → re-auth → 200; user never sees an error | End-to-end latency ≤ 1.5s, no Veteran-facing error |
| Malformed FHIR | `200 OK` with a payload missing `resourceType`, an empty `identifier[0].value`, and an invalid `gender` enum | `fhirValidator.ts` runs real R4 shape checks, renders a Veteran-safe error card with a reference ID and a raw-payload panel highlighting each violation | ≥3 violations shown, no data fabrication |
| Empty bundle | Coverage/v0 returns `{"total":0,"entry":[]}` | Patient card renders normally; separate warning card explains the empty coverage bundle without implying ineligibility; two fallback actions offered | Warning card present, fallback actions keyboard-focusable |
| Slow / circuit breaker | Coverage/v0 sleeps 12s | `circuitBreaker.ts` trips at the 3s threshold, serves the last cached result with a staleness banner, tile goes OPEN (red); recovery probes follow the 1s→3s→7s→15s schedule | Response ≤ 3.5s, tile returns to CLOSED once chaos is turned off |
| 429 rate limit | 3rd and 5th call in a rolling 10s window → `429` with `Retry-After` | Bulk queue (`retryQueue.ts`) retries with exponential backoff (1→2→4→8→16s, capped at 6 attempts), honoring `Retry-After` when present; queue persists to `sessionStorage` | All queued ICNs eventually complete or fail explicitly, no request silently dropped |

## Known simplifications

- No `apps/proxy` service exists — the "API" is a client-side module, not a
  live sandbox call. There is no OAuth client secret provisioned in this
  environment.
- CI (lint/typecheck/axe/Playwright), a walkthrough MP4, and a Fly.io
  deployment target from the original build brief are not implemented in this
  pass.
