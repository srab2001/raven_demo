import type { Caller } from './modelCards'

// (a) Eligibility rules matched — one small decision table per caller. The
// citations for 'demo1' and 'demo2' intentionally match
// demo2-508-eligibility-wizard/src/engine/rulesEngine.ts: the point of
// Demo 4 is that every RAVEN feature cites the same authority through the
// same contract, not a per-feature reimplementation.
export type RuleMatch = { id: string; citation: string; predicate: string; result: boolean }

export function rulesMatchedFor(caller: Caller): RuleMatch[] {
  switch (caller) {
    case 'demo1':
      return [
        {
          id: 'priority-group-2-3',
          citation: '38 CFR § 17.36',
          predicate: 'discharge IN (honorable, general) → Priority Group 2 or 3',
          result: true,
        },
      ]
    case 'demo2':
      return [
        {
          id: 'hud-vash-1',
          citation: '38 CFR § 63.4(a)(2)',
          predicate: 'discharge IN (honorable, general) AND housing IN (at-risk, homeless) AND years_since_separation < 5',
          result: true,
        },
      ]
    case 'future':
      return [
        {
          id: 'gpd-1',
          citation: '38 CFR § 61.80',
          predicate: 'housing == homeless AND discharge != other',
          result: true,
        },
      ]
  }
}

// (b) Source records that triggered the rule — deliberately three different
// provenance shapes (a FHIR resource, a wizard session, a caseworker case
// note) to prove the contract doesn't assume every caller's data looks the
// same.
export type SourceRecord = {
  system: string
  resourceType: string
  resourceId: string
  retrievedAt: string
  fields: Record<string, string>
}

export function sourceRecordsFor(caller: Caller): SourceRecord[] {
  const retrievedAt = new Date().toISOString()
  switch (caller) {
    case 'demo1':
      return [
        {
          system: 'Patient/v0',
          resourceType: 'Patient',
          resourceId: '1013925208V123456',
          retrievedAt,
          fields: { name: '[REDACTED]', dateOfBirth: '[REDACTED]', dischargeStatus: 'Honorable' },
        },
        {
          system: 'Coverage/v0',
          resourceType: 'Coverage',
          resourceId: '8823',
          retrievedAt,
          fields: { status: 'active' },
        },
      ]
    case 'demo2':
      return [
        {
          system: 'Demo 2 Wizard Session',
          resourceType: 'WizardResponse',
          resourceId: 'wiz_3391',
          retrievedAt,
          fields: { dischargeStatus: 'Honorable', housingStatus: 'At risk', separationDate: '2022-04-01' },
        },
      ]
    case 'future':
      return [
        {
          system: 'Caseworker Intake (planned)',
          resourceType: 'CaseNote',
          resourceId: 'note_5521',
          retrievedAt,
          fields: { housingStatus: 'Homeless', dischargeStatus: 'General' },
        },
      ]
  }
}
