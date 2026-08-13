import type { Caller, ExplainResponse, FeedbackOutcome, FeedbackTicket } from './types'

async function parseErrorBody(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return typeof body?.error === 'string' ? body.error : `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function explain(caller: Caller): Promise<ExplainResponse> {
  const response = await fetch('/api/xaas/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caller }),
  })
  if (!response.ok) throw new Error(await parseErrorBody(response))
  return response.json()
}

export type DisagreementInput = {
  recommendationId: string
  modelCardId: string
  veteranCaseId: string
  reason: string
  freeText: string
  caseworkerId: string
}

export async function submitDisagreement(input: DisagreementInput): Promise<FeedbackOutcome> {
  const response = await fetch('/api/xaas/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(await parseErrorBody(response))
  return response.json()
}

export async function listTickets(): Promise<FeedbackTicket[]> {
  const response = await fetch('/api/xaas/feedback')
  if (!response.ok) return []
  const body = await response.json()
  return body.tickets ?? []
}
