export type Program = 'HUD-VASH' | 'GPD' | 'SSVF' | 'VR&E (Chapter 31)' | 'VA Health Care Priority Group'

export type RuleFire = {
  program: Program
  citation: string
  predicate: string
}

export type RulesInput = {
  dischargeStatus: 'Honorable' | 'General' | 'Other'
  housingStatus: 'Stable' | 'At risk' | 'Homeless'
  separationDate: string
}

export const PROGRAM_ALLOWLIST: Program[] = ['HUD-VASH', 'GPD', 'SSVF', 'VR&E (Chapter 31)', 'VA Health Care Priority Group']

function yearsSinceSeparation(dateStr: string): number {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return 99
  return (Date.now() - then) / (365.25 * 24 * 60 * 60 * 1000)
}

/**
 * Pure decision-table evaluation — every rule is a plain predicate over the
 * wizard state with a cited authority. No network calls, no randomness, so
 * the same input always produces the same output (deterministic + auditable).
 */
export function evaluateRules(input: RulesInput): RuleFire[] {
  const fires: RuleFire[] = []
  const years = yearsSinceSeparation(input.separationDate)
  const eligibleDischarge = input.dischargeStatus === 'Honorable' || input.dischargeStatus === 'General'

  if (eligibleDischarge && input.housingStatus !== 'Stable' && years < 5) {
    fires.push({
      program: 'HUD-VASH',
      citation: '38 CFR § 63.4(a)(2)',
      predicate: `discharge IN (honorable, general) AND housing IN (at-risk, homeless) AND years_since_separation(${years.toFixed(1)}) < 5`,
    })
  }

  if (input.housingStatus === 'Homeless' && input.dischargeStatus !== 'Other') {
    fires.push({ program: 'GPD', citation: '38 CFR § 61.80', predicate: 'housing == homeless AND discharge != other' })
  }

  if (input.housingStatus === 'At risk') {
    fires.push({ program: 'SSVF', citation: '38 CFR § 62.30', predicate: 'housing == at-risk' })
  }

  if (input.dischargeStatus === 'Honorable' && years < 12) {
    fires.push({
      program: 'VR&E (Chapter 31)',
      citation: '38 CFR § 21.40',
      predicate: `discharge == honorable AND years_since_separation(${years.toFixed(1)}) < 12`,
    })
  }

  if (eligibleDischarge) {
    const group = input.housingStatus === 'Stable' ? 2 : 3
    fires.push({
      program: 'VA Health Care Priority Group',
      citation: '38 CFR § 17.36',
      predicate: `discharge IN (honorable, general) → Priority Group ${group}`,
    })
  }

  return fires
}

export function primaryRecommendation(fires: RuleFire[]): Program {
  return fires[0]?.program ?? 'VA Health Care Priority Group'
}
