import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Turns an unexpected throw (e.g. a missing DATABASE_URL) into a clean JSON 500 instead of a platform-level function crash. */
export function withErrorHandling(handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('API handler error', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
}
