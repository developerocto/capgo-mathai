import { handle } from 'https://deno.land/x/hono@v4.0.0/adapter/netlify/mod.ts'
import { app } from '../../supabase/functions/_backend/private/webapps/stats.ts'
// TODO: deprecated remove when everyone use the new CLI

export default handle(app as any)
