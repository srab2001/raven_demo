import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readCookie, verifySession, SESSION_COOKIE_NAME } from '../../lib/session'
import { withErrorHandling } from '../../lib/apiErrors'
import { ensureSchema, sql } from '../../lib/db'
import { ensureXaasSeed, MODEL_CARDS, type Caller } from '../../lib/xaas/modelCards'
import { rulesMatchedFor, sourceRecordsFor } from '../../lib/xaas/rulesEngine'
import { conformalInterval } from '../../lib/xaas/conformal'

const CALLERS: Caller[] = ['demo1', 'demo2', 'future']

type ModelCardRow = {
  id: string
  program: string
  model_version: string
  owner_email: string
  last_validated: string
  coverage_target: number
  point_estimate: number
  notes: string | null
}

type SubgroupRow = {
  dimension: string
  group_label: string
  n: number
  accuracy: number
  fpr: number
  fnr: number
  as_of: string
}

type ResidualRow = { residual: number }

// The one contract every RAVEN feature calls before showing a Veteran or
// caseworker a recommendation. See docs/XAAS_CONTRACT.md for the full
// request/response shape this implements.
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' })
    return
  }

  const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
  const session = token ? await verifySession(token) : null
  if (!session) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  const caller = req.body?.caller as Caller | undefined
  if (!caller || !CALLERS.includes(caller)) {
    res.status(400).json({ error: `caller must be one of ${CALLERS.join(', ')}` })
    return
  }

  await ensureSchema()
  await ensureXaasSeed()

  const seed = MODEL_CARDS.find((card) => card.caller === caller)
  if (!seed) {
    res.status(500).json({ error: 'No model card configured for this caller' })
    return
  }

  const cardRows = (await sql`
    SELECT id, program, model_version, owner_email, last_validated, coverage_target, point_estimate, notes
    FROM model_cards WHERE id = ${seed.id}
  `) as ModelCardRow[]
  const card = cardRows[0]
  if (!card) {
    res.status(500).json({ error: 'Model card not seeded' })
    return
  }

  const subgroupRows = (await sql`
    SELECT dimension, group_label, n, accuracy, fpr, fnr, as_of
    FROM subgroup_metrics WHERE model_card_id = ${seed.id}
    ORDER BY dimension, group_label
  `) as SubgroupRow[]

  const residualRows = (await sql`
    SELECT residual FROM conformal_residuals WHERE model_card_id = ${seed.id}
  `) as ResidualRow[]
  const residuals = residualRows.map((row) => Number(row.residual))

  const { lower, upper, calibrationSetSize } = conformalInterval(Number(card.point_estimate), residuals, Number(card.coverage_target))

  const recommendationId = `rec_${caller}_${Math.random().toString(36).slice(2, 8)}`

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    recommendationId,
    caller,
    program: card.program,
    rulesMatched: rulesMatchedFor(caller),
    sourceRecords: sourceRecordsFor(caller),
    confidence: {
      point: Number(card.point_estimate),
      lower,
      upper,
      method: 'split-conformal',
      coverageTarget: Number(card.coverage_target),
      calibrationSetSize,
      calibrationAsOf: card.last_validated,
    },
    subgroupMetrics: subgroupRows.map((row) => ({
      dimension: row.dimension,
      group: row.group_label,
      n: row.n,
      accuracy: Number(row.accuracy),
      fpr: Number(row.fpr),
      fnr: Number(row.fnr),
      lastUpdated: row.as_of,
    })),
    modelCard: {
      id: card.id,
      version: card.model_version,
      owner: card.owner_email,
      lastValidated: card.last_validated,
      notes: card.notes,
    },
    disagreeEndpoint: '/api/xaas/feedback',
  })
})
