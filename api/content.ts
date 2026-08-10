import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../lib/db'
import { withErrorHandling } from '../lib/apiErrors'
import { CONTENT_MANIFEST } from '../lib/contentManifest'

// Public and unauthenticated on purpose: it's just display copy for pages
// that are already gated by middleware, and every demo needs it to render.
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  await ensureSchema()
  const rows = await sql`SELECT key, text FROM content_overrides`
  const overrides: Record<string, string> = {}
  for (const row of rows as Array<{ key: string; text: string }>) {
    overrides[row.key] = row.text
  }
  res.setHeader('Cache-Control', 'no-store')

  // ?manifest=1 also returns the non-sensitive item list (key/demo/label/default)
  // so the "Under the Hood" walkthrough can build a live editor without needing
  // admin access just to see what's editable.
  if (req.query.manifest) {
    const items = CONTENT_MANIFEST.map((item) => ({
      key: item.key,
      demo: item.demo,
      label: item.label,
      default: item.default,
      currentText: overrides[item.key] ?? item.default,
      isOverridden: item.key in overrides,
    }))
    res.status(200).json({ overrides, items })
    return
  }

  res.status(200).json({ overrides })
})
