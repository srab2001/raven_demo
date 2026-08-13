export type Caller = 'demo1' | 'demo2' | 'future'

export type RuleMatch = { id: string; citation: string; predicate: string; result: boolean }

export type SourceRecord = {
  system: string
  resourceType: string
  resourceId: string
  retrievedAt: string
  fields: Record<string, string>
}

export type Confidence = {
  point: number
  lower: number
  upper: number
  method: string
  coverageTarget: number
  calibrationSetSize: number
  calibrationAsOf: string
}

export type SubgroupMetric = {
  dimension: string
  group: string
  n: number
  accuracy: number
  fpr: number
  fnr: number
  lastUpdated: string
}

export type ModelCardInfo = {
  id: string
  version: string
  owner: string
  lastValidated: string
  notes: string | null
}

export type ExplainResponse = {
  recommendationId: string
  caller: Caller
  program: string
  rulesMatched: RuleMatch[]
  sourceRecords: SourceRecord[]
  confidence: Confidence
  subgroupMetrics: SubgroupMetric[]
  modelCard: ModelCardInfo
  disagreeEndpoint: string
}

export type FeedbackTicket = {
  ticketId: string
  recommendationId: string
  modelCardId: string
  veteranCaseId: string
  reason: string
  freeText: string | null
  caseworkerId: string
  routedTo: string[]
  status: string
  createdAt: string
}

export type FeedbackOutcome = {
  ticketId: string
  routedTo: string[]
  routedToNames: string[]
  slaHours: number
  createdAt: string
}
