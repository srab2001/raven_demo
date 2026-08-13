# Claude Code Build Brief — RAVEN/SQUARES Demonstration Prototypes

**Audience:** Claude Code (or any coding agent) building the interactive proposal demonstrations described below.
**Output expected:** Four deployable web applications, source in GitHub, live URLs, README per repo. (Demos 1–3 are built; Demo 4 is spec'd below and in [docs/XAAS_STRATEGY.md](docs/XAAS_STRATEGY.md), pending a build pass.)
**Reference wireframes:** See `wireframes/` folder in this package — one SVG + PNG per scene/flow.

---

## Master Context Prompt (paste at start of any Claude Code session)

> You are building three interactive proposal demonstrations for the VA RAVEN/SQUARES and Patient Portal capture. All demos must run publicly (no VA network, no credentials required from the evaluator), use only synthetic Veteran data, and expose their inner workings visually so evaluators can verify claims live.
>
> **Constraints — apply to all demos:**
> - Frontend: React 18 + TypeScript + Vite. Deploy target: Vercel (public URL).
> - Component library: `@department-of-veterans-affairs/component-library` v56+ where a VA Design System component exists; fall back to plain HTML only when no VA component fits.
> - Accessibility floor: WCAG 2.1 AA, Section 508, axe-core CI green, Lighthouse a11y score = 100. Every keystroke keyboard-reachable, focus visible, `prefers-reduced-motion` respected.
> - PII: use only synthetic test patients from the public `department-of-veterans-affairs/lighthouse-fhir-apis-consumer-docs` repo. Never log unmasked PII; redact in UI as `[REDACTED]`.
> - Repo hygiene: conventional commits, GitHub Actions CI (lint + typecheck + a11y + unit), Dependabot, LICENSE (MIT), README with 90-second quickstart, ARCHITECTURE.md, demo walk-through video (recorded via Playwright).
> - Do not invent VA API behavior. Everything against Lighthouse must be a real call against `sandbox-api.va.gov`, or a documented mock proxy that mirrors real response shapes.
> - When you finish a scene, mark it against its acceptance criteria (below) and produce a short evaluator-facing note in `docs/scenes/<id>.md`.

---

# DEMO 1 — "Lighthouse Under Load"

Live sandbox eligibility lookup with chaos-injection failure modes.

## Architecture (build this first)

```
demo1-lighthouse-under-load/
├── apps/
│   ├── web/                    # React 18 + Vite + TS, VA Design System
│   │   └── src/
│   │       ├── components/
│   │       │   ├── EligibilityLookup.tsx   # ICN input + result card
│   │       │   ├── LatencyWaterfall.tsx    # per-API timing bars
│   │       │   ├── ChaosToggle.tsx         # evaluator control panel
│   │       │   ├── EventLog.tsx            # scrollable structured log
│   │       │   └── EndpointHealth.tsx      # per-API health tiles
│   │       ├── lib/
│   │       │   ├── lighthouse.ts           # OAuth + FHIR client
│   │       │   ├── circuitBreaker.ts       # 3s trip, exponential recovery
│   │       │   ├── retryQueue.ts           # backoff for 429s
│   │       │   └── fhirValidator.ts        # R4 schema validation
│   │       └── App.tsx
│   └── proxy/                  # Node/Express, holds client secret
│       └── src/
│           ├── oauth.ts                    # sandbox-api.va.gov/oauth2/token
│           ├── forward.ts                  # transparent FHIR proxy
│           ├── chaos.ts                    # rewriter middleware (per-scenario)
│           └── server.ts
├── docs/
│   ├── FAILURE_MODE_CATALOG.md
│   └── scenes/                             # one .md per scene
├── .github/workflows/
│   ├── ci.yml                              # lint, test, axe, playwright
│   └── deploy.yml                          # Vercel + Fly.io
└── README.md
```

## Scene-by-scene build prompts

### Prompt 1.1 — Scaffold + Scene 1 (Happy path)

> Scaffold the demo1 monorepo per the architecture above. Wire the OAuth 2.0 client-credentials flow to `sandbox-api.va.gov/oauth2/veteran-verification/system/v1/token` in the proxy. In the web app, build `EligibilityLookup.tsx` with a `va-text-input` for ICN, `va-button` for submit, and a result card showing name (masked), DOB (masked), enrollment priority group, and coverage plans. Below the card, render `LatencyWaterfall.tsx` — one horizontal bar per API call (Patient/v0, Clinical/v0, Coverage/v0) with millisecond labels.
>
> **Acceptance:** Enter ICN `1013925208V123456`, three API calls succeed, latency bars render, no PII visible in DOM or console, page passes axe-core with 0 violations. See `wireframes/d1_scene1_happy.png` for layout.

### Prompt 1.2 — Scene 2 (Kill the token)

> Add a "Revoke token" button to the chaos panel. When clicked, the proxy invalidates the cached bearer server-side so the next FHIR call returns 401. Client must detect the 401, silently re-run the OAuth flow, and retry the original request. All of this must be visible in `EventLog.tsx` with color-coded lines (red for 401, gold for re-auth trigger, teal for recovery). User-visible latency budget: ≤ 1.5s end-to-end.
>
> **Acceptance:** Toggle "Revoke", search again, single visible latency spike ≤ 1.5s, log shows 401 → re-auth → 200 sequence, Veteran-facing UI never shows an error. See `wireframes/d1_scene2_token.png`.

### Prompt 1.3 — Scene 3 (Malformed FHIR)

> Implement the `chaos.ts` "malformed" rewriter that removes `resourceType`, empties `identifier[0].value`, and injects an invalid `gender` enum. On the client, validate every FHIR payload against R4 schemas. On validation failure, render a Veteran-safe error card ("We couldn't confirm eligibility right now — reference #<id>") with a unique reference ID that also appears in the event log. Provide an expandable "raw payload" panel that shows the offending JSON with the violations highlighted.
>
> **Acceptance:** Toggle "Malformed" chaos, submit search, error card renders with reference ID, raw JSON panel highlights ≥3 violations, no crash, no data fabrication. See `wireframes/d1_scene3_malformed.png`.

### Prompt 1.4 — Scene 4 (Missing resource)

> Add "Empty bundle" chaos toggle that makes the Coverage/v0 endpoint return `{"resourceType":"Bundle","type":"searchset","total":0,"entry":[]}` while Patient/v0 still succeeds. Client must render the Patient card as normal, a distinct warning card explaining the empty coverage bundle in plain language, and two fallback action buttons: "Query Verification API" and "Query VADIR". Never assert absence of coverage as ineligibility.
>
> **Acceptance:** See `wireframes/d1_scene4_missing.png`.

### Prompt 1.5 — Scene 5 (Circuit breaker)

> Implement `circuitBreaker.ts` with a 3-second trip threshold and half-open retry at 1s → 3s → 7s → 15s intervals. Add "Slow" chaos toggle that makes Coverage/v0 sleep 12 seconds. On trip, serve the last successful Coverage payload from an in-memory LRU cache (keyed by ICN, TTL 10 minutes), and render a staleness banner. `EndpointHealth.tsx` shows per-API tiles: green/gold/red with p50, p99, and current circuit state.
>
> **Acceptance:** See `wireframes/d1_scene5_latency.png`.

### Prompt 1.6 — Scene 6 (Rate limit / 429)

> Add "429" chaos toggle that returns `429 Too Many Requests` with a `Retry-After` header on the third and fifth API call in any 10-second window. Build a bulk lookup input (comma-separated ICNs, up to 5). Implement `retryQueue.ts` with exponential backoff that honors `Retry-After` when present. Render each ICN as a row with status pill: queued / retrying / complete / failed.
>
> **Acceptance:** See `wireframes/d1_scene6_ratelimit.png`.

### Prompt 1.7 — Docs + hand-off

> Generate `FAILURE_MODE_CATALOG.md` — one row per scene. Record a 90-second Playwright walkthrough of all six scenes and export as MP4. Update the README with the public demo URL and a "for evaluators" section.

---

# DEMO 2 — "508-First Eligibility Wizard"

Three-step VA Design System wizard with keyboard, screen-reader, and rules-vs-AI proof surfaces.

## Architecture

```
demo2-508-eligibility-wizard/
├── src/
│   ├── steps/ (Step1_Discharge, Step2_Housing, Step3_Separation, Result)
│   ├── engine/ (rulesEngine, llmClient, policyIndex)
│   ├── a11y/ (AxePanel, NvdaSimulator, ContrastMeter, ReadingLevelMeter)
│   └── state/wizardStore.ts
├── tests/ (a11y.spec.ts, keyboard.spec.ts, rules.spec.ts)
├── docs/ (VPAT_TEMPLATE.md, DECISION_TABLES.md)
└── README.md
```

## Flow-by-flow build prompts

### Prompt 2.1 — Scaffold + Flow A (Keyboard-only)

> Scaffold demo2 as a Vite React+TS app with the VA Design System web components loader. Build the three-step wizard using `va-progress-bar`, `va-radio`, `va-date`, `va-button`, `va-alert`. Persist wizard state to `sessionStorage`. Enforce single-question-per-screen. Every interactive element must be reachable via Tab in visual order, focus ring visible, `Enter` advances when the primary button has focus.
>
> Add `AxePanel.tsx` — a fixed right rail that runs axe-core on every render and shows a live checklist.
>
> **Acceptance:** Complete the wizard with no mouse, focus visible at every stop, axe = 0, Lighthouse a11y = 100. See `wireframes/d2_flowA_keyboard.png`.

### Prompt 2.2 — Flow B (Screen reader + cognitive load)

> Build `NvdaSimulator.tsx` — announces focused elements via `window.speechSynthesis` in NVDA-style phrasing. Add a "Save and come back" banner with signed resume token. Build `ReadingLevelMeter.tsx` for live Flesch-Kincaid.
>
> **Acceptance:** See `wireframes/d2_flowB_reader.png`.

### Prompt 2.3 — Flow C (Rules vs. AI toggle)

> Build `rulesEngine.ts` as a decision table for six programs, each citing 38 CFR / VHA Directive. Build `llmClient.ts` with a strict system prompt requiring citations and confidence; reject responses without citations or outside the allowlist.
>
> On the Result page, render two side-by-side panels: rules-mode and AI-mode. Flag divergence with a yellow banner.
>
> **Acceptance:** See `wireframes/d2_flowC_ai_rules.png`.

### Prompt 2.4 — VPAT export + hand-off

> Generate a live VPAT-style PDF via `@react-pdf/renderer`. Record a Playwright walkthrough (keyboard-only, then screen-reader-on) and export MP4.

---

# DEMO 3 — "Vendor Rigor Console" (NEW)

**Origin — the problem this demo answers:** Reduced government-side staffing during the August/September Oracle cutover created rigor gaps on the patient portal. The government contact issued four requirements: (1) cross-check PRs across teams before merge, (2) daily product dashboard attestations, (3) a ship checklist including staging, product-guide update with screen-reader call-out, OCC notification, and post-release validation, (4) mandatory PDS Health inclusion on any government email outside PDS Health: Patient & Clinical Experience.

This demo shows the offeror's operating console for those four controls — running live, auditable, and hard to bypass — so the evaluator sees rigor is enforced by tooling, not memory.

## Architecture

```
demo3-vendor-rigor-console/
├── apps/
│   ├── web/                        # React 18 + TS + Vite console UI
│   │   └── src/
│   │       ├── panels/
│   │       │   ├── PRBoard.tsx             # cross-team review queue
│   │       │   ├── DashboardAttest.tsx     # daily health tiles + Slack proof
│   │       │   ├── ShipChecklist.tsx       # 4-gate release gate
│   │       │   └── EmailGuardrail.tsx      # composer overlay + policy
│   │       ├── lib/
│   │       │   ├── github.ts               # PR events via webhook + REST
│   │       │   ├── datadog.ts              # dashboard health metrics
│   │       │   ├── slack.ts                # attestation post + verify
│   │       │   └── policy.ts               # rules for who must be CC'd
│   │       └── App.tsx
│   ├── bot/                        # GitHub App: blocks merge until cross-team review
│   ├── slackbot/                   # Posts daily nag at 09:45 ET, verifies attestation
│   └── mailguard/                  # Chrome/Gmail add-on manifest + backend
├── docs/
│   ├── POLICY.md                   # the four rules, codified
│   ├── AUDIT_TRAIL.md              # what gets logged, where, how long
│   └── scenes/
└── README.md
```

## Scene-by-scene build prompts

### Prompt 3.1 — Cross-Check PR Board

> Build `PRBoard.tsx`. Data source: GitHub App webhook that watches all patient-portal contract repos. For each open PR, compute: author, author's team, an assigned cross-team reviewer (from a rotation config in `apps/bot/rotations.yml`), description quality score, and merge state.
>
> Enforce the following via the GitHub App: a PR cannot merge unless (a) an approved review is present from an engineer on a *different* product team, and (b) the PR description contains both an "Intended Effect" and a "Verification Steps" section (regex-checked). If either is missing, the merge check stays red and the PR row shows a "BLOCKED" chip with the specific reason. Tertiary review by named senior engineers (Adrian, Steve) may be requested via a `/tertiary` PR comment, but only after a same-team + cross-team approval already exists.
>
> Include a "This Week's Reviewer Rotation" section that reads from `rotations.yml` and shows primary + backup reviewer per product team and their review count for the week.
>
> **Acceptance:** Open a PR without cross-team review — board shows BLOCKED, merge check red. Add cross-team approval — board flips to MERGED-ready. Description missing "Verification Steps" — description quality dot is red and merge is blocked. Rotation section pulls live from config. See `wireframes/d3_scene1_cross_check_prs.png`.

### Prompt 3.2 — Daily Product Dashboard Attestation

> Build `DashboardAttest.tsx`. Wire it to a Datadog mock (fixture-backed, deterministic; switchable to real via env var). Show one tile per product team: Secure Messaging, Medications, Medical Records, Health Tools, Platform & Infrastructure, Program Management. Each tile shows current-day metric vs 7-day baseline, P95 latency, error rate, assigned attester, and attestation state.
>
> Slackbot (`apps/slackbot`) posts to `#pds-daily-check` at 09:45 ET reminding any team without an attestation. Attestation is a Slack message matching the phrase "everything looks ok" (case-insensitive) from the assigned attester. Bot verifies the message and updates the tile to green with a timestamp + quoted attestation.
>
> If a metric breaches thresholds (e.g., >20% deviation from baseline for 2 consecutive check windows), the tile turns red, an incident is opened via a mock PagerDuty endpoint, and the OCC notification queue is auto-primed with a draft message referencing the recent 90% med-refill drop pattern as an explicit reference case.
>
> **Acceptance:** Fixture data reproduces the med-refill 90% drop scenario — Medications tile is red, incident opened, OCC draft primed. Toggle Platform attester "out today" — Platform tile is gold, 09:45 nag fires, escalates at 10:15 ET. All attestations render the actual Slack message text. See `wireframes/d3_scene2_daily_dashboards.png`.

### Prompt 3.3 — Ship Checklist Gate

> Build `ShipChecklist.tsx`. Ship is blocked unless all four gates pass:
>
> 1. **Staging validation** — full regression pass ID from CI (link to run), plus manual QA sign-off name + timestamp.
> 2. **Product guide updated** — diff URL to the product guide with a required "Screen-reader impact" section (regex-checked); if the diff lacks that heading, gate fails.
> 3. **OCC notification** — email sent to the configured OCC address AND a help-desk ticket ID present, both with acknowledgement timestamps.
> 4. **Post-release validation plan** — dashboards subscribed, analytics events registered, ≥3 trusted-user contacts armed with T+30/60/120-minute check-ins.
>
> The "Ship" button is disabled until all four are green. Every state transition writes an audit event to `docs/AUDIT_TRAIL.md` (append-only JSONL). Post-ship, gate 4 auto-runs and posts results back to `#pds-releases` at T+30/60/120.
>
> **Acceptance:** Try to ship with product guide missing screen-reader section — Ship stays disabled and the gate row explains why. All four green → Ship enables → audit event appended → T+30 verification runs. See `wireframes/d3_scene3_ship_checklist.png`.

### Prompt 3.4 — Government Email Guardrail

> Build `EmailGuardrail.tsx` as a Gmail add-on (Chrome extension shell + Google Workspace add-on manifest). On compose-time, the extension inspects recipients (To/Cc/Bcc). If any recipient is a `*.va.gov` address AND is not on the PDS-Health-scope allowlist (config in `apps/mailguard/scope.yml`), the extension:
>
> - Shows a Guardrail panel offering to add `pds-health-office@va.gov` (or a configured alternate) to Cc.
> - Disables the Send button until either (a) a PDS Health contact is added, or (b) the sender clicks "Override" and supplies a written justification (min 30 chars).
> - Every override is logged to a weekly PDS Health digest and surfaces on the console home.
>
> Provide a demo "compose window" mock inside the console so evaluators without Gmail can experience the full flow.
>
> **Acceptance:** Add `jane.doe@va.gov` as recipient — guardrail fires, Send disabled, "Add pds-health-office@va.gov" CTA visible. Click it — Send enables, message logs as compliant. Try override — justification input required, event lands in weekly digest. See `wireframes/d3_scene4_email_guardrail.png`.

### Prompt 3.5 — Audit trail + evaluator hand-off

> Every action in every panel writes to a single append-only `AUDIT_TRAIL.md` (or `.jsonl` if the evaluator prefers) with actor, timestamp, event type, and payload. Build an audit viewer at `/audit` that supports filter-by-team and filter-by-event-type. Record a 3-minute Playwright walkthrough that shows a full day: 09:45 nag → dashboard attestation → PR blocked and unblocked → ship checklist → outbound email guardrail. Export as MP4.

## Why this demo differentiates

Most vendors *claim* rigor in prose. This demo shows rigor as tooling that the vendor cannot silently bypass — a bot blocks unreviewed merges, Slack verifies real attestations, ship is gated on four green checks, and outbound government email is inspected before send. The audit trail is the evidence. The evaluator can click through the whole day in three minutes and see exactly where a rigor lapse would surface.

---

# DEMO 4 — "Explainability-as-a-Service (XaaS) Fabric" (NEW)

**Origin — the problem this demo answers:** Demos 1–3 each prove one piece of
trustworthy delivery — resilient data pulls, cited rules-vs-AI transparency,
and tooling-enforced rigor — but each proves it inside its own feature. This
demo shows those aren't three separate improvisations: they're one reusable
microservice contract that every current and future RAVEN feature calls
before it shows a Veteran or caseworker a recommendation. See
[docs/XAAS_STRATEGY.md](docs/XAAS_STRATEGY.md) for the full strategy,
compliance framing, and phased roadmap this build brief implements Phase 0
of.

For every recommendation, the XaaS fabric returns: (a) the eligibility rules
matched, (b) the source records that triggered them, (c) a conformal
confidence interval, (d) subgroup performance metrics (age, race, discharge
status, geography) from a live model-card database, and (e) an "I disagree"
button that opens a structured feedback path back to the model owner and the
Veteran's caseworker.

## Architecture

```
demo4-xaas-explainability-fabric/
├── apps/
│   ├── web/                        # React 18 + TS + Vite — the demo harness
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ExplanationCard.tsx      # the embeddable widget — all 5 items in one panel
│   │       │   ├── RulesMatchedPanel.tsx    # cited predicates, same style as demo2's rulesEngine output
│   │       │   ├── SourceRecordTrail.tsx    # provenance back to Patient/Clinical/Coverage resources
│   │       │   ├── ConfidenceBand.tsx       # conformal interval, shaded band not a bare percentage
│   │       │   ├── SubgroupFairnessPanel.tsx # age/race/discharge/geography table, timestamped
│   │       │   ├── DisagreeModal.tsx        # structured "I disagree" intake form
│   │       │   └── IntegrationSimulator.tsx # evaluator picks: call from Demo 1 / Demo 2 / Demo 3
│   │       └── App.tsx
│   ├── xaas-service/                # Node/Express (or Vercel functions) — the actual microservice
│   │   └── src/
│   │       ├── explain.ts                   # POST /v1/explain
│   │       ├── conformal.ts                 # split-conformal interval from a seeded calibration set
│   │       ├── modelCardRegistry.ts         # reads model-card DB for provenance + subgroup metrics
│   │       ├── feedback.ts                  # POST /v1/feedback — "I disagree" intake + routing
│   │       └── server.ts
│   └── model-card-db/               # seed schema + data standing in for the "live" model-card DB
│       ├── schema.sql
│       └── seed/*.json              # one model card per RAVEN recommendation type, timestamped
├── docs/
│   ├── XAAS_CONTRACT.md            # the /v1/explain and /v1/feedback contract every feature codes to
│   ├── MODEL_CARD_SCHEMA.md
│   ├── FEEDBACK_ROUTING.md         # how an "I disagree" ticket reaches model owner + caseworker
│   └── scenes/
└── README.md
```

## Scene-by-scene build prompts

### Prompt 4.1 — Scaffold + the Explanation Card

> Scaffold the demo4 monorepo per the architecture above. Build `explain.ts`
> to accept the `/v1/explain` request shape in `docs/XAAS_STRATEGY.md` and
> return a deterministic, seeded response. Build `ExplanationCard.tsx` to
> render `RulesMatchedPanel.tsx` (rule id, predicate, citation, matched)
> and `SourceRecordTrail.tsx` (system, resource type/id, retrieval
> timestamp) from that response.
>
> **Acceptance:** Given a seeded `recommendationId`, the card renders at
> least two matched rules with citations and at least one source record
> with a retrieval timestamp, with no network round-trip failures.

### Prompt 4.2 — Conformal confidence band

> Implement `conformal.ts` as a real split-conformal calculation over a
> seeded calibration set (documented in `docs/scenes/4.2.md` — size, method,
> "as of" date). Build `ConfidenceBand.tsx` to render the point estimate as
> a shaded band between `lower` and `upper`, labeled with the stated
> coverage target (e.g. "90% target coverage"), never a bare percentage.
>
> **Acceptance:** Band renders with visible lower/upper bounds and a stated
> coverage target; changing the seeded calibration set changes the band
> width, proving the math is live, not hardcoded.

### Prompt 4.3 — Subgroup fairness panel from the live model-card DB

> Build `model-card-db/schema.sql` (`model_card`, `subgroup_metric`) and
> seed it with synthetic-but-labeled figures across age, race, discharge
> status, and geography. Build `modelCardRegistry.ts` to query it and
> `SubgroupFairnessPanel.tsx` to render one row per dimension/group with
> `n`, accuracy, FPR, and a `lastUpdated` timestamp.
>
> **Acceptance:** Panel shows all four dimensions, every row carries a
> freshness timestamp, and a `KNOWN_SIMPLIFICATIONS` note in
> `docs/MODEL_CARD_SCHEMA.md` states the data is synthetic and how a real
> deployment would populate it.

### Prompt 4.4 — "I disagree" structured feedback loop

> Build `DisagreeModal.tsx` (disagree reason, free text, caseworker id) and
> `feedback.ts` implementing `POST /v1/feedback` — create a ticket, route it
> to the model owner and the caseworker, and append an audit event using
> the same append-only pattern as Demo 3's `AUDIT_TRAIL.md`. Document the
> routing rule in `docs/FEEDBACK_ROUTING.md`.
>
> **Acceptance:** Submitting the modal returns a `ticketId` and `routedTo`
> list, the ticket is visible in an audit view, and an SLA clock (e.g. 24h)
> is shown.

### Prompt 4.5 — Cross-demo integration simulator

> Build `IntegrationSimulator.tsx`: a control that lets the evaluator pick
> "Demo 1 eligibility lookup," "Demo 2 wizard result," or "Demo 3 risk
> score," and calls `/v1/explain` with that caller's payload shape, then
> renders the same `ExplanationCard.tsx` against the result. This is the
> load-bearing proof of reuse — one contract, three callers, not three
> copy-pasted widgets.
>
> **Acceptance:** All three caller options render successfully through the
> same `ExplanationCard.tsx` instance with visibly different rule sets and
> source records per caller.

### Prompt 4.6 — Docs + hand-off

> Generate `XAAS_CONTRACT.md` documenting the request/response shape for
> `/v1/explain` and `/v1/feedback`. Update the root README with the new
> demo and its public URL. Record a short walkthrough showing all three
> integration-simulator callers and one "I disagree" submission end-to-end.

## Why this demo differentiates

Demos 1–3 each prove trustworthy delivery inside one feature. This demo
proves the trust is infrastructure: the same contract, called from three
different features, always returns rules, provenance, a calibrated
confidence interval, live fairness metrics, and a working recourse path.
Federal AI risk-management guidance for rights-impacting AI use cases (see
`docs/XAAS_STRATEGY.md`) asks for almost exactly these five things —
explanation, tested and monitored performance, quantified uncertainty, and
a route to human review. This demo shows that operationalized as a service
any team can call, not asserted in a policy slide.

## Requirements traceability — Demo 4

| XaaS deliverable | Codified in | Enforced/shown by | Wireframe |
| --- | --- | --- | --- |
| (a) Eligibility rules matched | `RulesMatchedPanel.tsx` | Explanation Card, cited predicates | `d4_scene1_explanation_card` |
| (b) Source records that triggered them | `SourceRecordTrail.tsx` | Explanation Card, resource-level provenance | `d4_scene1_explanation_card` |
| (c) Conformal confidence interval | `ConfidenceBand.tsx`, `conformal.ts` | Shaded interval with stated coverage target | `d4_scene2_confidence_band` |
| (d) Subgroup performance metrics (live model-card DB) | `SubgroupFairnessPanel.tsx`, `model-card-db/` | Timestamped per-dimension table | `d4_scene3_subgroup_fairness` |
| (e) "I disagree" → model owner + caseworker | `DisagreeModal.tsx`, `feedback.ts` | Structured ticket, audit trail, SLA clock | `d4_scene4_disagree_feedback` |
| Reuse across features (the actual thesis) | `IntegrationSimulator.tsx` | Same contract, three caller payload shapes, one widget | `d4_scene5_integration_simulator` |

---

## Global acceptance gate — do not ship any demo without

1. Public URL live on Vercel, no auth required.
2. GitHub repo public, README + ARCHITECTURE + LICENSE + a walkthrough MP4.
3. CI green: lint + typecheck + unit + axe + Playwright.
4. Every scene has a matching entry in `docs/scenes/` with wireframe link, acceptance criteria, and evaluator narration script (≤ 60 words).
5. Catalog docs present: `FAILURE_MODE_CATALOG.md` (demo 1), `VPAT.pdf` (demo 2), `AUDIT_TRAIL.md` + `POLICY.md` (demo 3), `XAAS_CONTRACT.md` + `MODEL_CARD_SCHEMA.md` + `FEEDBACK_ROUTING.md` (demo 4).
6. No real PII anywhere — CI check greps for common PII patterns.

---

## Wireframes reference

The `wireframes/` folder contains one SVG and one PNG per scene. Layout labels are authoritative for component placement; colors are indicative and should defer to the VA Design System tokens where they differ.

**Demo 1 — Lighthouse Under Load**

- `d1_scene1_happy` — Happy path lookup + latency waterfall
- `d1_scene2_token` — Token revocation, silent re-auth, event log
- `d1_scene3_malformed` — FHIR schema failure, Veteran-safe error card, raw payload panel
- `d1_scene4_missing` — Empty bundle, graceful degradation, fallback actions
- `d1_scene5_latency` — Circuit breaker trip, endpoint health tiles, retry timeline
- `d1_scene6_ratelimit` — Bulk queue, 429 handling, backoff progress

**Demo 2 — 508-First Eligibility Wizard**

- `d2_flowA_keyboard` — Keyboard-only radio step + live a11y panel
- `d2_flowB_reader` — Screen-reader simulator, reading-level meter, save-and-resume
- `d2_flowC_ai_rules` — Rules vs AI panels with citations and confidence

**Demo 3 — Vendor Rigor Console**

- `d3_scene1_cross_check_prs` — Cross-team PR review board + rotation
- `d3_scene2_daily_dashboards` — Daily product health tiles + Slack attestation trail
- `d3_scene3_ship_checklist` — Four-gate ship checklist with all four requirements enforced
- `d3_scene4_email_guardrail` — Gmail composer guardrail requiring PDS Health CC

**Demo 4 — Explainability-as-a-Service (XaaS) Fabric**

- `d4_scene1_explanation_card` — Rules matched + source-record trail in one panel
- `d4_scene2_confidence_band` — Conformal confidence interval as a shaded band
- `d4_scene3_subgroup_fairness` — Timestamped subgroup performance table from the model-card DB
- `d4_scene4_disagree_feedback` — "I disagree" modal, routed ticket, audit trail, SLA clock
- `d4_scene5_integration_simulator` — Same contract called from three different RAVEN features

---

## Requirements traceability — Demo 3

| Government requirement | Codified in | Enforced by | Wireframe |
| --- | --- | --- | --- |
| 1. Cross-check PRs (cross-team, human-verified description, tertiary only after) | `apps/bot`, `rotations.yml` | GitHub App merge check | `d3_scene1_cross_check_prs` |
| 2. Daily product dashboard attestation, posted to Slack | `apps/slackbot`, `DashboardAttest.tsx` | 09:45 nag + Slack message verifier + 10:15 escalation | `d3_scene2_daily_dashboards` |
| 3. Ship checklist: staging → product guide (a11y call-out) → OCC → post-release validation | `ShipChecklist.tsx`, `AUDIT_TRAIL.md` | 4-gate release gate; Ship button locked until green | `d3_scene3_ship_checklist` |
| 4. Government email outside PDS Health must Cc a PDS Health contact | `apps/mailguard`, `scope.yml` | Compose-time guardrail; Send disabled until compliant | `d3_scene4_email_guardrail` |

---

## Suggested build order

**Week 1:** Prompts 1.1–1.2 (demo 1 baseline works against real Lighthouse).
**Week 2:** Prompts 1.3–1.6 (chaos layers).
**Week 3:** Prompts 2.1–2.2 (demo 2 baseline + a11y).
**Week 4:** Prompt 2.3 + 2.4 (rules + AI, VPAT).
**Week 5:** Prompts 3.1–3.2 (PR board + daily attestations — the two most visible controls).
**Week 6:** Prompts 3.3–3.5 (ship checklist, mail guardrail, audit + walkthrough).
**Week 7:** Prompts 4.1–4.3 (Explanation Card, confidence band, subgroup fairness panel — the XaaS contract and its live model-card DB).
**Week 8:** Prompts 4.4–4.6 (disagree/feedback loop, cross-demo integration simulator, docs + hand-off).

Ship all four demos with a shared landing page at `/` that links to each — one URL to hand the evaluator.
