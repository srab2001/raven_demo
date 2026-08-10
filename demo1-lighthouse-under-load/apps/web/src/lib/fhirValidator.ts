export type FhirViolation = {
  path: string
  issue: string
}

export type FhirValidationResult = {
  valid: boolean
  violations: FhirViolation[]
}

const VALID_GENDERS = new Set(['male', 'female', 'other', 'unknown'])

/**
 * Minimal FHIR R4 Bundle/Patient shape check. Real integrations would validate
 * against the full StructureDefinition; this checks the fields the chaos
 * scenarios are designed to corrupt so evaluators can see the failure surface.
 */
export function validateFhirPatient(payload: Record<string, unknown>): FhirValidationResult {
  const violations: FhirViolation[] = []

  if (!payload || typeof payload !== 'object') {
    return { valid: false, violations: [{ path: '$', issue: 'Payload is not a JSON object' }] }
  }

  if (!payload.resourceType) {
    violations.push({ path: 'resourceType', issue: 'Missing required field "resourceType"' })
  }

  const identifier = payload.identifier as Array<{ value?: string }> | undefined
  if (!identifier || identifier.length === 0 || !identifier[0]?.value) {
    violations.push({ path: 'identifier[0].value', issue: 'Identifier value is empty or missing' })
  }

  const gender = payload.gender as string | undefined
  if (gender && !VALID_GENDERS.has(gender)) {
    violations.push({ path: 'gender', issue: `Value "${gender}" is not a valid FHIR administrative-gender code` })
  }

  return { valid: violations.length === 0, violations }
}

export function isEmptyBundle(payload: Record<string, unknown>): boolean {
  return payload?.resourceType === 'Bundle' && payload?.total === 0 && Array.isArray(payload?.entry) && (payload.entry as unknown[]).length === 0
}
