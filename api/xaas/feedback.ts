import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readCookie, verifySession, SESSION_COOKIE_NAME } from '../../lib/session'
import { withErrorHandling } from '../../lib/apiErrors'
import { ensureSchema, sql } from '../../lib/db'
import { MODEL_CARDS } from '../../lib/xaas/modelCards'
import { CASEWORKER_DIRECTORY, DEFAULT_CASEWORKER_ID } from '../../lib/xaas/caseworkers'

type TicketRow = {
  id: number
  recommendation_id: string
  model_card_id: string
  veteran_case_id: string
  reason: string
  free_text: string | null
  caseworker_id: string
  routed_to: string
  status: string
  created_at: string
}

// (e) "I disagree" — structured feedback routed to the model owner and the
// Veteran's caseworker. See docs/FEEDBACK_ROUTING.md.
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  await ensureSchema()

  const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
  const session = token ? await verifySession(token) : null
  if (!session) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  if (req.method === 'GET') {
    const rows = (await sql`
      SELECT id, recommendation_id, model_card_id, veteran_case_id, reason, free_text, caseworker_id, routed_to, status, created_at
      FROM disagree_tickets ORDER BY created_at DESC LIMIT 20
    `) as TicketRow[]
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({
      tickets: rows.map((row) => ({
        ticketId: `fb_${row.id}`,
        recommendationId: row.recommendation_id,
        modelCardId: row.model_card_id,
        veteranCaseId: row.veteran_case_id,
        reason: row.reason,
        freeText: row.free_text,
        caseworkerId: row.caseworker_id,
        routedTo: row.routed_to.split(','),
        status: row.status,
        createdAt: row.created_at,
      })),
    })
    return
  }

  if (req.method === 'POST') {
    const recommendationId = typeof req.body?.recommendationId === 'string' ? req.body.recommendationId.trim() : ''
    const modelCardId = typeof req.body?.modelCardId === 'string' ? req.body.modelCardId.trim() : ''
    const veteranCaseId = typeof req.body?.veteranCaseId === 'string' && req.body.veteranCaseId.trim() ? req.body.veteranCaseId.trim() : 'case_unspecified'
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    const freeText = typeof req.body?.freeText === 'string' ? req.body.freeText.trim() : ''
    const caseworkerId = typeof req.body?.caseworkerId === 'string' && CASEWORKER_DIRECTORY[req.body.caseworkerId.trim()] ? req.body.caseworkerId.trim() : DEFAULT_CASEWORKER_ID

    if (!recommendationId || !modelCardId || !reason) {
      res.status(400).json({ error: 'recommendationId, modelCardId, and reason are required' })
      return
    }
    const modelCard = MODEL_CARDS.find((card) => card.id === modelCardId)
    if (!modelCard) {
      res.status(400).json({ error: 'Unknown modelCardId' })
      return
    }
    const caseworker = CASEWORKER_DIRECTORY[caseworkerId]
    const routedTo = [modelCard.ownerEmail, caseworker.email]

    const rows = (await sql`
      INSERT INTO disagree_tickets (recommendation_id, model_card_id, veteran_case_id, reason, free_text, caseworker_id, routed_to, created_by)
      VALUES (${recommendationId}, ${modelCardId}, ${veteranCaseId}, ${reason}, ${freeText}, ${caseworkerId}, ${routedTo.join(',')}, ${session.email})
      RETURNING id, created_at
    `) as Array<{ id: number; created_at: string }>
    const row = rows[0]

    res.status(201).json({
      ticketId: `fb_${row.id}`,
      routedTo,
      routedToNames: [modelCard.ownerEmail, `${caseworker.name} (caseworker)`],
      slaHours: 24,
      createdAt: row.created_at,
    })
    return
  }

  res.status(405).json({ error: 'GET or POST required' })
})
