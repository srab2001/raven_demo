# Behind-the-hood demo script

A click-by-click script for presenting (or recording) all four demos in
this package, plus the platform's own `/how-its-built` walkthrough. Where
[docs/LESSONS-LEARNED.md](LESSONS-LEARNED.md) documents incidents after the
fact, this is the *script* — every step below points at something that
actually exists and actually runs today. Every demo also has a
**"Take the tour"** button (`GuidedTour.tsx`) that runs this same
walkthrough self-serve, for an evaluator exploring without a presenter —
mentioned at the end of each section rather than run live in the script
below.

**Repo:** `srab2001/raven_demo`, branch `main`.
**Live deployment:** see [README.md](../README.md) for current production
URLs — this package has moved across a couple of Vercel projects and
domains over its life, so check there rather than trusting an old link.

Open three things before you start: the live site, this repo in an
editor, and `/how-its-built` on the live site (see section 5) so you can
cross-check what any demo claims against the actual running instance.

---

## 1. Demo 1 — Lighthouse Under Load

**Show:** `/demo1`

A Veteran eligibility lookup against three simulated VA Lighthouse APIs
(Patient/v0, Clinical/v0, Coverage/v0), with six chaos scenarios that
inject real failures — not just different labels on the same result.

**Script:**
1. Enter the pre-filled ICN and click "Run lookup" on the default "Happy
   path" scenario — point at the latency waterfall and endpoint health
   tiles updating from the real (simulated) per-API timing.
2. Switch to "Revoke token," run the lookup again — narrate the event log
   showing 401 → re-auth → 200, with no error ever surfacing to the
   Veteran-facing result card.
3. Switch to "Malformed FHIR" — point at the raw-payload panel and the
   FHIR R4 validator's specific violations, and the reference ID that
   would let a real support ticket trace back to this exact failure.
4. Switch to "Empty bundle" — point at the two fallback buttons (Query
   Verification API, Query VADIR); hover each for a definition of the real
   VA system it stands in for.
5. Switch to "Slow / circuit breaker" — narrate the breaker tripping at
   the 3-second mark and serving cached data instead of a 12-second wait.
6. Switch to "429 rate limit" and submit the pre-filled bulk ICN list —
   point at the retry queue's exponential backoff and status pills moving
   from "Retrying" to "Complete."

**Line to land:** "Every one of those six scenarios changed what the
lookup actually returned, not just the text describing it."

**Self-serve:** "Take the tour" walks all six sections above in order,
switching on the rate-limit scenario for you when it reaches the bulk
queue.

---

## 2. Demo 2 — 508-First Eligibility Wizard

**Show:** `/demo2`

A keyboard- and screen-reader-first wizard with a live accessibility panel
proving compliance rather than claiming it, and a 38 CFR-cited rules
engine compared side-by-side against an AI explainer.

**Script:**
1. Tab through the first step with the mouse untouched — point at the
   visible focus ring and the live axe-core panel on the right staying
   green as you go.
2. Advance to the separation-date step. Turn on the NVDA simulator, then
   Tab through the date fields — narrate it announcing each control in
   NVDA's actual phrasing ("Edit, Month, 03").
3. Point at the reading-level meter on the same step — a real
   Flesch-Kincaid score computed on the step's own visible text, not a
   static claim.
4. Reach the Result step. Toggle between Rules and AI mode — point at the
   38 CFR citation on the rules-mode card, then click "Show divergence
   example" to see the human-review escalation banner when they disagree.
5. Click "Download VPAT" — point out it's generated from a live axe-core
   scan of the current page, not a static template.

**Line to land:** "Nothing here is a screenshot of an accessible design —
the scan, the score, and the screen-reader phrasing are all live."

**Self-serve:** "Take the tour" advances the wizard itself (discharge →
separation → result) as it goes, so it can highlight the reading-level
meter, NVDA simulator, and VPAT download even though they live on
different steps than where the tour starts.

---

## 3. Demo 3 — Vendor Rigor Console

**Show:** `/demo3`

Point at the "Why this console exists" panel first — this demo answers a
real, specific government ask (four rigor requirements issued after an
Aug–Sep Oracle-cutover staffing gap opened gaps on the Patient Portal), not
a generic governance mockup.

**Script:**
1. **PR Board** — point at `#4823`, BLOCKED with no cross-reviewer
   assigned. Click "Assign cross-reviewer" — the bot enforces it live, the
   row flips to IN REVIEW. Then use "Add a PR" — any approved viewer can
   add one; it starts BLOCKED with no reviewer, and persists to the
   database for every other viewer of this demo, not just your own tab.
2. **Dashboard Attestation** — point at Medications (red, a real incident
   state from a simulated 87% refill-volume drop) next to Platform &
   Infrastructure (gold, an overdue but not-yet-an-incident attestation).
   Click "Flag for review" on a green tile to watch the state change live.
3. **Ship Checklist** — click "Re-run staging validation" to fail gate 1 —
   point at the Ship button actually disabling itself, not just showing a
   warning. Note gate 4 stays "ARMED (post-ship)" on purpose: it activates
   after shipping, it doesn't block it.
4. **Email Guardrail** — point at Send disabled because the recipient is
   outside PDS Health. Click "Add pds-health-office@va.gov" — Send
   enables. Mention the Override path (logged with a justification) as the
   documented exception.

**Line to land:** "That's rigor enforced by tooling the vendor can't
silently bypass, not rigor described in a policy doc."

**Self-serve:** "Take the tour" switches tabs for you as it advances
through all four panels in the order above.

---

## 4. Demo 4 — Explainability-as-a-Service (XaaS) Fabric

**Show:** `/demo4`

One contract, `POST /api/xaas/explain`, that any RAVEN feature calls
before showing a Veteran or caseworker a recommendation — a real
Postgres-backed microservice, not a mockup with fixture data baked into
the frontend.

**Script:**
1. Point at the Integration Simulator — three callers (Demo 1's
   eligibility lookup, Demo 2's wizard result, and a feature that doesn't
   exist yet), each hitting the same one endpoint.
2. Switch callers and narrate the Explanation Card re-rendering a
   different real payload each time: rules matched, source records, a
   conformal confidence interval, live subgroup fairness metrics.
3. Click "I disagree with this recommendation" — submit it, then point at
   the Disagree audit trail below picking it up immediately, persisted to
   the same Postgres instance as the rest of the site.

**Line to land:** "That's the same contract generalizing across two real
features and one that doesn't exist yet — not three separate explanation
UIs that happen to look alike."

**Self-serve:** "Take the tour" covers all three beats above in order.

---

## 5. `/how-its-built` — the platform's own "under the hood" (self-serve only)

A fifth page, separate from all four demos: live environment/database
status, the exact request-lifecycle steps for the Google sign-in and
content-edit flows with "why it's built this way" callouts, a live
split-screen content editor, two buttons that call real write-gated
endpoints with no session or an invalid key and show the real rejection
response, and a narrated case study of a real production incident (see
[docs/LESSONS-LEARNED.md](LESSONS-LEARNED.md)). Worth pointing an
evaluator at directly if they want to self-serve "how was this built"
rather than watching a presenter narrate it — every check on the page is a
real fetch to the running deployment, not a screenshot. It does not have
its own "Take the tour" button; its content is already organized as a
single linear walkthrough.

---

## Suggested full run order (~12–15 minutes)

1. Demo 1 — all six chaos scenarios (section 1)
2. Demo 2 — keyboard/NVDA/reading-level, then rules-vs-AI and VPAT
   (section 2)
3. Demo 3 — all four tabs, in the order the "Why this console exists"
   panel lists them (section 3)
4. Demo 4 — switch callers, then the disagree → audit-trail proof
   (section 4)
5. `/how-its-built` — mention as a closing, self-serve note rather than
   narrating it live (section 5)

Mention "Take the tour" on each demo as a closing note for evaluators
exploring afterward, rather than running it live during a presenter
session — it's the self-serve version of the exact script above.

## Pre-flight checklist

- [ ] Confirm `/how-its-built`'s status tiles show the database reachable
      and all required env vars set before presenting — a red tile here
      undercuts every later section.
- [ ] Confirm Demo 3's PR board doesn't already have leftover test PRs
      from a prior rehearsal (`Remove` them from `/admin`-signed-in view,
      or via the "Remove" action next to each persisted row) — if the
      audience adds one live, a cluttered board is harder to narrate.
- [ ] Confirm no demo copy overrides are left from a prior rehearsal that
      would contradict this script's narration (`/admin` → "Edit demo
      copy" → Reset to default on anything unexpected).
