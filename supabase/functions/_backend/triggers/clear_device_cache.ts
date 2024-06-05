// DO nothing it's only for cache

import { Hono } from 'hono/tiny'
import type { Context } from '@hono/hono'
import { BRES, middlewareAPISecret } from '../utils/hono.ts'

export const app = new Hono()

app.get('/', middlewareAPISecret, (c: Context) => {
  try {
    return c.json(BRES)
  }
  catch (e) {
    return c.json({ status: 'Cannot invalidate cache', error: JSON.stringify(e) }, 500)
  }
})
