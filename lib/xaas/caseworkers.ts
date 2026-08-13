// A tiny caseworker directory standing in for a real case-management system
// integration (Phase 1 in docs/XAAS_STRATEGY.md). "I disagree" tickets
// route to whichever caseworker the submitter picks here.
export const CASEWORKER_DIRECTORY: Record<string, { name: string; email: string }> = {
  cw_204: { name: 'A. Whitfield', email: 'a.whitfield@va.gov' },
  cw_115: { name: 'D. Cho', email: 'd.cho@va.gov' },
  cw_309: { name: 'M. Reyes', email: 'm.reyes@va.gov' },
}

export const DEFAULT_CASEWORKER_ID = 'cw_204'
