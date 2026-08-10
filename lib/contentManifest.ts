// Canonical list of every editable callout/tooltip across the three demos.
// The admin panel (`/admin`) reads this (via /api/admin/content) to render
// an editable row per item. Each demo's own JSX still carries the default
// text as a fallback — this manifest's `default` field is a copy used only
// for the admin UI's "current effective text" display and must be kept in
// sync by hand if a demo's default copy changes.
export type ContentItem = {
  key: string
  demo: 'Demo 1' | 'Demo 2' | 'Demo 3'
  label: string
  default: string
}

export const CONTENT_MANIFEST: ContentItem[] = [
  { key: 'demo1.callout.lookup', demo: 'Demo 1', label: 'Eligibility lookup callout', default: 'Enter any ICN and click Run lookup to simulate a real call to Patient/v0, Clinical/v0, and Coverage/v0 — the same three Lighthouse APIs a live integration would hit.' },
  { key: 'demo1.callout.latency', demo: 'Demo 1', label: 'Latency waterfall callout', default: 'Real per-API timing, redrawn after every lookup. Watch this bar for Coverage/v0 when you switch to the "Slow / circuit breaker" scenario below.' },
  { key: 'demo1.callout.health', demo: 'Demo 1', label: 'Endpoint health callout', default: 'Each tile is a live circuit-breaker state — CLOSED (green) is healthy, OPEN (red) means that endpoint tripped and is being served from cache instead of waiting.' },
  { key: 'demo1.callout.bulkqueue', demo: 'Demo 1', label: 'Bulk queue callout', default: '429 responses are retried automatically with exponential backoff (1s → 2s → 4s…) — watch the status pill on each row change from "Retrying" to "Complete."' },
  { key: 'demo1.callout.chaos', demo: 'Demo 1', label: 'Chaos panel callout', default: 'Switching scenarios here changes what the lookup actually returns — a real 401, a malformed FHIR payload, an empty bundle — not just the label on the result card.' },
  { key: 'demo1.callout.eventlog', demo: 'Demo 1', label: 'Event log callout', default: 'Every retry, cache decision, and re-auth is logged here as it happens — nothing about the failure handling is hidden from you.' },
  { key: 'demo1.tooltip.happy', demo: 'Demo 1', label: 'Tooltip: Happy path', default: 'All three APIs respond normally — a clean baseline lookup with no injected failure.' },
  { key: 'demo1.tooltip.token', demo: 'Demo 1', label: 'Tooltip: Revoke token', default: 'The next call gets a real 401. Watch the event log show 401 → re-auth → 200, with no error surfaced to the user.' },
  { key: 'demo1.tooltip.malformed', demo: 'Demo 1', label: 'Tooltip: Malformed FHIR', default: 'Patient/v0 returns a payload missing required fields. A real FHIR R4 validator catches it and shows the violations.' },
  { key: 'demo1.tooltip.missing', demo: 'Demo 1', label: 'Tooltip: Empty bundle', default: 'Coverage/v0 returns zero results while Patient/v0 still succeeds — an empty result, not proof of ineligibility.' },
  { key: 'demo1.tooltip.slow', demo: 'Demo 1', label: 'Tooltip: Slow / circuit breaker', default: 'Coverage/v0 hangs for 12s. The breaker trips at the 3s mark and serves cached data instead of making you wait.' },
  { key: 'demo1.tooltip.ratelimit', demo: 'Demo 1', label: 'Tooltip: 429 rate limit', default: 'Simulates a real 429 on the 3rd and 5th call in a 10s window — routes lookups through the retry queue below.' },
  { key: 'demo1.tooltip.verificationapi', demo: 'Demo 1', label: 'Tooltip: Query Verification API button', default: "VA's Verification API — confirms identity and service history independently of the Coverage/v0 FHIR endpoint." },
  { key: 'demo1.tooltip.vadir', demo: 'Demo 1', label: 'Tooltip: Query VADIR button', default: "VADIR (Veterans Data Integration and Reuse) — VA's cross-system identity and eligibility source of record, used here as a fallback when Coverage/v0 has no data." },

  { key: 'demo2.callout.intro', demo: 'Demo 2', label: 'Wizard intro callout', default: 'Each step asks exactly one question — this wizard is designed to be usable with a keyboard alone or a screen reader, not just visually.' },
  { key: 'demo2.callout.axepanel', demo: 'Demo 2', label: 'Axe panel callout', default: "This runs a real axe-core scan against the current page on every step — it's a live result, not a canned checklist." },
  { key: 'demo2.callout.readinglevel', demo: 'Demo 2', label: 'Reading level callout', default: 'A real Flesch-Kincaid score computed on the visible text of this step — this demo enforces an 8th-grade reading level, not just claims one.' },
  { key: 'demo2.callout.nvda', demo: 'Demo 2', label: 'NVDA simulator callout', default: 'Turn this on, then press Tab through the form above — it announces each control using NVDA\'s actual phrasing conventions ("Edit, Month, 03", "Alert: Saved automatically").' },
  { key: 'demo2.callout.enginetoggle', demo: 'Demo 2', label: 'Rules/AI toggle callout', default: 'Rules mode runs a deterministic decision table over your answers. AI mode explains the same result with citations — click "Show divergence example" below to see what happens when they disagree.' },
  { key: 'demo2.callout.vpat', demo: 'Demo 2', label: 'VPAT download callout', default: 'Downloads a real accessibility conformance snapshot generated from an axe-core scan of this page right now — not a static template.' },

  { key: 'demo3.callout.intro', demo: 'Demo 3', label: 'Console intro callout', default: 'Four governance surfaces for the Patient Portal contract — every control on these tabs is interactive, not a static mockup.' },
  { key: 'demo3.callout.prboard', demo: 'Demo 3', label: 'PR board callout', default: '#4823 is BLOCKED because no cross-team reviewer is assigned. Click "Assign cross-reviewer" to see the enforcement bot act, not just describe the rule.' },
  { key: 'demo3.callout.dashboard', demo: 'Demo 3', label: 'Dashboard attestation callout', default: 'Medications is red — a real incident state (refill volume down 87%, already paged). Platform & Infrastructure is gold — an attestation that\'s overdue and auto-nagged, not yet an incident. Click "Flag for review" on a green tile to see the state change live.' },
  { key: 'demo3.callout.shipgate', demo: 'Demo 3', label: 'Ship checklist callout', default: 'Click that button to fail gate 1 — watch the Ship button below actually disable itself, not just show a warning. Gate 4 stays "ARMED (post-ship)" on purpose: it doesn\'t block shipping, it activates after.' },
  { key: 'demo3.callout.emailguardrail', demo: 'Demo 3', label: 'Email guardrail callout', default: "Send stays disabled until the guardrail on the right is resolved — this demo enforces the CC policy, it doesn't just describe it." },
]
