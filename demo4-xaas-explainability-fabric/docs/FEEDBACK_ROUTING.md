# "I disagree" — feedback routing

When a viewer submits the Disagree modal, `api/xaas/feedback.ts` inserts a
row into `disagree_tickets` and routes it to exactly two recipients:

1. **The model owner** — `owner_email` on the model card the recommendation
   came from (`lib/xaas/modelCards.ts`). All three seeded model cards route
   to `raven-benefits-ml@va.gov` in this demo; a real deployment would vary
   this per program/team.
2. **The Veteran's caseworker** — picked from the small fixture directory
   in `lib/xaas/caseworkers.ts` (`CASEWORKER_DIRECTORY`). The submitter
   picks which caseworker in the demo; a real deployment would resolve this
   automatically from the Veteran's actual case assignment instead of a
   dropdown.

The response returns both the raw `routedTo` emails and a human-readable
`routedToNames` list, plus a fixed 24-hour `slaHours` — there is no SLA
clock or escalation timer actually running in this pass; it's returned as a
stated commitment, same as the "10:15 ET escalation" language in Demo 3's
`DashboardAttestation.tsx` is a stated policy rather than a live timer.

## Known simplifications

- **No real email is sent.** `routedTo`/`routedToNames` describe who
  *would* be notified; there's no transactional email integration in this
  pass, matching the "Invite does not send email" limitation already
  documented for the admin panel in
  [docs/ADMIN_AUTH.md](../../docs/ADMIN_AUTH.md).
- **No real caseworker case-management integration.** The caseworker
  directory is a 3-entry fixture, not a query against VA case-management
  data. Phase 1 in [docs/XAAS_STRATEGY.md](../../docs/XAAS_STRATEGY.md)
  scopes the real integration.
- **Tickets never leave `open` status.** There's no reviewer workflow to
  acknowledge or resolve a ticket in this pass — the audit trail panel
  shows every ticket as filed, not tracked to resolution.
