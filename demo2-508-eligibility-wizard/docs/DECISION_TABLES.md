# Decision tables — 508-First Eligibility Wizard

`src/engine/rulesEngine.ts` is a pure decision table: every rule is a plain
predicate over the wizard state, with a cited authority. No network calls, no
randomness — the same input always produces the same output.

| Program | Predicate | Citation |
| --- | --- | --- |
| HUD-VASH | discharge IN (honorable, general) AND housing IN (at-risk, homeless) AND years since separation < 5 | 38 CFR § 63.4(a)(2) |
| GPD | housing == homeless AND discharge != other | 38 CFR § 61.80 |
| SSVF | housing == at-risk | 38 CFR § 62.30 |
| VR&E (Chapter 31) | discharge == honorable AND years since separation < 12 | 38 CFR § 21.40 |
| VA Health Care Priority Group | discharge IN (honorable, general) → Priority Group 2 (stable) or 3 (at-risk/homeless) | 38 CFR § 17.36 |

The build brief lists "VR&E" and "Chapter 31" as separate programs; they are
the same statutory authority (Chapter 31 of Title 38 is VR&E's basic
eligibility period), so they are consolidated into one rule here rather than
fabricating a sixth, artificially distinct output.

## AI mode

`src/engine/llmClient.ts` is a documented stand-in for the constrained-LLM
call in the build brief — no LLM API key is provisioned for this static
deployment. Per the brief's own trust boundary ("AI never decides
eligibility — it explains the decision. All routing goes through the rules
engine"), `explainWithAi` intentionally re-explains the same rules-engine
output with citations rather than deriving an independent recommendation. It
enforces the two hard constraints from the brief: reject any recommendation
outside the five-program allowlist, reject any response with zero citations.
`forceDivergenceDemo` exists purely to exercise the divergence banner and
"Send to human review" path for evaluators.

## Known simplifications

- No VA Design System component library (`@department-of-veterans-affairs/component-library`)
  — plain semantic HTML/CSS is used instead. Layout follows the wireframes;
  colors approximate VA Design System tokens.
- "Download VPAT" produces a live axe-core snapshot as a Markdown file, not a
  PDF via `@react-pdf/renderer`.
- Wizard state is persisted under a namespaced storage key, not a
  cryptographically signed one — there's no server-side secret to sign with
  in a static deployment.
- CI (lint/typecheck/axe/Playwright) and a walkthrough MP4 from the original
  build brief are not implemented in this pass.
