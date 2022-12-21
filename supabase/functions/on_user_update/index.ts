import { serve } from 'https://deno.land/std@0.167.0/http/server.ts'
import { checkPlan } from '../_utils/plans.ts'
import { updatePerson } from '../_utils/crisp.ts'
import type { Person } from '../_utils/crisp.ts'
import { sendRes } from '../_utils/utils.ts'
import { createCustomer } from '../_utils/stripe.ts'
import type { UpdatePayload } from '../_utils/supabase.ts'
import { supabaseAdmin } from '../_utils/supabase.ts'
import type { Database } from '../_utils/supabase.types.ts'

// Generate a v4 UUID. For this we use the browser standard `crypto.randomUUID`
// function.
serve(async (event: Request) => {
  const API_SECRET = Deno.env.get('API_SECRET')
  const authorizationSecret = event.headers.get('apisecret')
  if (!authorizationSecret || !API_SECRET || authorizationSecret !== API_SECRET)
    return sendRes({ message: 'Fail Authorization' }, 400)

  try {
    const table: keyof Database['public']['Tables'] = 'users'
    const body = (await event.json()) as UpdatePayload<typeof table>
    if (body.table !== table) {
      console.log(`Not ${table}`)
      return sendRes({ message: `Not ${table}` }, 200)
    }
    if (body.type !== 'UPDATE') {
      console.log('Not UPDATE')
      return sendRes({ message: 'Not UPDATE' }, 200)
    }
    const record = body.record
    console.log('record', record)
    if (!record.email) {
      console.log('No email')
      return sendRes()
    }
    if (!record.id) {
      console.log('No id')
      return sendRes()
    }

    console.log('updatePerson crisp')
    const person: Person = {
      nickname: `${record.first_name} ${record.last_name}`,
      avatar: record.image_url ? record.image_url : undefined,
      country: record.country ? record.country : undefined,
    }
    await updatePerson(record.email, person).catch((e) => {
      console.log('updatePerson error', e)
    })
    if (!record.customer_id) {
      const customer = await createCustomer(record.email)
      await supabaseAdmin()
        .from('stripe_info')
        .insert({
          customer_id: customer.id,
        })
      await supabaseAdmin()
        .from('users')
        .update({
          customer_id: customer.id,
        })
        .eq('email', record.email)
      await updatePerson(record.email, {
        customer_id: customer.id,
        product_id: 'free',
      }).catch((e) => {
        console.log('updatePerson error', e)
      })
    }
    await checkPlan(record.id)
    return sendRes()
  }
  catch (e) {
    return sendRes({
      status: 'Error unknow',
      error: JSON.stringify(e),
    }, 500)
  }
})
