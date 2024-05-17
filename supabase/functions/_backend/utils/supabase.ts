import type { Context } from 'hono'

import { createClient } from '@supabase/supabase-js'
import { createCustomer } from './stripe.ts'
import type { Database } from './supabase.types.ts'
import { getEnv } from './utils.ts'
import type { Person, Segments } from './plunk.ts'
import { addDataContact } from './plunk.ts'

export const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'
const DEFAULT_LIMIT = 1000
// Import Supabase client

export interface InsertPayload<T extends keyof Database['public']['Tables']> {
  type: 'INSERT'
  table: string
  schema: string
  record: Database['public']['Tables'][T]['Insert']
  old_record: null
}
export interface UpdatePayload<T extends keyof Database['public']['Tables']> {
  type: 'UPDATE'
  table: string
  schema: string
  record: Database['public']['Tables'][T]['Update']
  old_record: Database['public']['Tables'][T]['Row']
}
export interface DeletePayload<T extends keyof Database['public']['Tables']> {
  type: 'DELETE'
  table: string
  schema: string
  record: null
  old_record: Database['public']['Tables'][T]['Row']
}

export function supabaseClient(c: Context, auth: string) {
  const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: auth } },
  }
  return createClient<Database>(getEnv(c, 'SUPABASE_URL'), getEnv(c, 'SUPABASE_ANON_KEY'), options)
}

export function emptySupabase(c: Context) {
  const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
  return createClient<Database>(getEnv(c, 'SUPABASE_URL'), getEnv(c, 'SUPABASE_ANON_KEY'), options)
}

// WARNING: The service role key has admin priviliges and should only be used in secure server environments!
export function supabaseAdmin(c: Context) {
  const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
  return createClient<Database>(getEnv(c, 'SUPABASE_URL'), getEnv(c, 'SUPABASE_SERVICE_ROLE_KEY'), options)
}

export function updateOrCreateVersion(c: Context, update: Database['public']['Tables']['app_versions']['Insert']) {
  console.log('updateOrCreateVersion', update)
  return supabaseAdmin(c)
    .from('app_versions')
    .upsert(update)
    .eq('app_id', update.app_id)
    .eq('name', update.name)
}

export async function getAppsFromSupabase(c: Context): Promise<string[]> {
  const limit = 1000
  let page = 0
  let apps: string[] = []

  while (true) {
    const { data, error } = await supabaseAdmin(c)
      .from('apps')
      .select('app_id')
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      console.error('Error getting apps from Supabase', error)
      break
    }

    if (data.length === 0)
      break

    apps = [...apps, ...data.map(row => row.app_id)]
    page++
  }

  return apps
}

export function updateOrCreateChannel(c: Context, update: Database['public']['Tables']['channels']['Insert']) {
  console.log('updateOrCreateChannel', update)
  if (!update.app_id || !update.name || !update.created_by) {
    console.log('missing app_id, name, or created_by')
    return Promise.reject(new Error('missing app_id, name, or created_by'))
  }
  return supabaseAdmin(c)
    .from('channels')
    .upsert(update)
    .eq('app_id', update.app_id)
    .eq('name', update.name)
    .eq('created_by', update.created_by)
}

export async function checkAppOwner(c: Context, userId: string | undefined, appId: string | undefined): Promise<boolean> {
  if (!appId || !userId)
    return false
  try {
    const { data, error } = await supabaseAdmin(c)
      .from('apps')
      .select()
      .eq('user_id', userId)
      .eq('app_id', appId)
    if (!data || !data.length || error)
      return false
    return true
  }
  catch (error) {
    console.error(error)
    return false
  }
}

export async function hasAppRight(c: Context, appId: string | undefined, userid: string, right: Database['public']['Enums']['user_min_right']) {
  if (!appId)
    return false

  const { data, error } = await supabaseAdmin(c)
    .rpc('has_app_right_userid', { appid: appId, right, userid })

  if (error) {
    console.error('has_app_right_userid error', error)
    return false
  }

  return data
}

export async function hasOrgRight(c: Context, orgId: string, userId: string, right: Database['public']['Enums']['user_min_right']) {
  const userRight = await supabaseAdmin(c).rpc('check_min_rights', {
    min_right: right,
    org_id: orgId,
    user_id: userId,
    channel_id: null as any,
    app_id: null as any,
  })

  console.log(userRight)

  if (userRight.error || !userRight.data) {
    console.error('check_min_rights (hasOrgRight) error', userRight.error)
    return false
  }

  return userRight.data
}

interface PlanUsage {
  total_percent: number
  mau_percent: number
  bandwidth_percent: number
  storage_percent: number
}

export async function getPlanUsagePercent(c: Context, orgId?: string): Promise<PlanUsage> {
  if (!orgId) {
    return {
      total_percent: 0,
      mau_percent: 0,
      bandwidth_percent: 0,
      storage_percent: 0,
    }
  }
  const { data, error } = await supabaseAdmin(c)
    .rpc('get_plan_usage_percent_detailed', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)
  return data
}

export async function isGoodPlanOrg(c: Context, orgId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_good_plan_v5_org', { orgid: orgId })
      .single()
      .throwOnError()
    return data || false
  }
  catch (error) {
    console.error('isGoodPlan error', orgId, error)
  }
  return false
}

export async function isOnboardedOrg(c: Context, orgId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_onboarded_org', { orgid: orgId })
      .single()
      .throwOnError()
    return data || false
  }
  catch (error) {
    console.error('isOnboarded error', orgId, error)
  }
  return false
}

export async function isOnboardingNeeded(c: Context, userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_onboarding_needed_org', { orgid: userId })
      .single()
      .throwOnError()
    return data || false
  }
  catch (error) {
    console.error('isOnboardingNeeded error', userId, error)
  }
  return false
}

export async function isCanceledOrg(c: Context, orgId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_canceled_org', { orgid: orgId })
      .single()
      .throwOnError()
    return data || false
  }
  catch (error) {
    console.error('isCanceled error', orgId, error)
  }
  return false
}

export async function isPayingOrg(c: Context, orgId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_paying_org', { orgid: orgId })
      .single()
      .throwOnError()
    return data || false
  }
  catch (error) {
    console.error('isPayingOrg error', orgId, error)
  }
  return false
}

export async function isTrialOrg(c: Context, orgId: string): Promise<number> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_trial_org', { orgid: orgId })
      .single()
      .throwOnError()
    return data || 0
  }
  catch (error) {
    console.error('isTrialOrg error', orgId, error)
  }
  return 0
}

export async function isAdmin(c: Context, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin(c)
    .rpc('is_admin', { userid: userId })
    .single()
  if (error)
    throw new Error(error.message)

  return data || false
}

export async function isAllowedActionOrg(c: Context, orgId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin(c)
      .rpc('is_allowed_action_org', { orgid: orgId })
      .single()
      .throwOnError()
    return data || false
  }
  catch (error) {
    console.error('isAllowedActionOrg error', orgId, error)
  }
  return false
}

export async function getSDashboard(c: Context, auth: string, orgIdQuery: string, startDate: string, endDate: string, appId?: string) {
  console.log(`getSDashboard orgId ${orgIdQuery} appId ${appId} startDate ${startDate}, endDate ${endDate}`)

  let client = supabaseClient(c, auth)
  if (!auth)
    client = supabaseAdmin(c)

  if (appId) {
    const reqOwner = await client
      .rpc('has_app_right', { appid: appId, right: 'read' })
      .then(res => res.data || false)
    if (!reqOwner)
      return Promise.reject(new Error('not allowed'))
  }

  client = supabaseAdmin(c)

  // console.log('tableName', tableName)
  let req = client
    .from('clickhouse_app_usage_parm')
    .select()

  if (appId) {
    req = req.eq('_app_list', JSON.stringify([appId]))
  }
  else {
    const userId = (await supabaseClient(c, auth).auth.getUser()).data.user?.id
    if (!userId)
      return []
    // get all user apps id
    let appIdsReq = supabaseClient(c, auth)
      .from('apps')
      .select('app_id')
      // .eq('user_id', userId)

    if (orgIdQuery)
      appIdsReq = appIdsReq.eq('owner_org', orgIdQuery)

    const appIds = await appIdsReq.then(res => res.data?.map(app => app.app_id) || [])

    console.log('appIds', appIds)
    req = req.eq('_app_list', JSON.stringify(appIds))
  }

  if (startDate) {
    console.log('startDate', startDate)
    // convert date string startDate to YYYY-MM-DD
    const startDateStr = new Date(startDate).toISOString().split('T')[0]
    req = req.eq('_start_date', startDateStr)
  }
  if (endDate) {
    console.log('endDate', endDate)
    // convert date string endDate to YYYY-MM-DD
    const endDateStr = new Date(endDate).toISOString().split('T')[0]
    req = req.eq('_end_date', endDateStr)
  }

  const res = await req
  console.log('res', res)
  return res.data || []
}

export async function createApiKey(c: Context, userId: string) {
  // check if user has apikeys
  const total = await supabaseAdmin(c)
    .from('apikeys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .then(res => res.count || 0)

  if (total === 0) {
    // create apikeys
    return supabaseAdmin(c)
      .from('apikeys')
      .insert([
        {
          user_id: userId,
          key: crypto.randomUUID(),
          mode: 'all',
        },
        {
          user_id: userId,
          key: crypto.randomUUID(),
          mode: 'upload',
        },
        {
          user_id: userId,
          key: crypto.randomUUID(),
          mode: 'read',
        },
      ])
  }
  return Promise.resolve()
}

export async function createdefaultOrg(_c: Context, _userId: string, _name = 'Default') {
  /// We no longer do that in the backend, we have a postgres trigger
  return Promise.resolve()
}

export function userToPerson(user: Database['public']['Tables']['users']['Row'], customer: Database['public']['Tables']['stripe_info']['Row']): Person {
  const person: Person = {
    id: user.id,
    product_id: customer.product_id,
    customer_id: customer.customer_id,
    nickname: `${user.first_name ?? ''} ${user.last_name ?? ''}`,
    avatar: user.image_url ? user.image_url : undefined,
    country: user.country ? user.country : undefined,
  }
  return person
}

export async function customerToSegmentOrg(c: Context, orgId: string, price_id: string, plan?: Database['public']['Tables']['plans']['Row'] | null): Promise<Segments> {
  const segments: Segments = {
    capgo: true,
    onboarded: await isOnboardedOrg(c, orgId),
    trial: false,
    trial7: false,
    trial1: false,
    trial0: false,
    paying: false,
    payingMonthly: plan?.price_m_id === price_id,
    plan: plan?.name ?? '',
    overuse: false,
    canceled: await isCanceledOrg(c, orgId),
    issueSegment: false,
  }
  const trialDaysLeft = await isTrialOrg(c, orgId)
  const paying = await isPayingOrg(c, orgId)
  const canUseMore = await isGoodPlanOrg(c, orgId)

  if (!segments.onboarded)
    return segments

  if (!paying && trialDaysLeft > 1 && trialDaysLeft <= 7) {
    segments.trial = true
    segments.trial7 = true
  }
  else if (!paying && trialDaysLeft === 1) {
    segments.trial = true
    segments.trial1 = true
  }

  else if (!paying && !canUseMore) {
    segments.trial = true
    segments.trial0 = true
  }

  else if (paying && !canUseMore && plan) {
    segments.overuse = true
    segments.paying = true
  }

  else if (paying && canUseMore && plan) {
    segments.paying = true
  }
  else {
    segments.issueSegment = true
  }

  return segments
}

export async function getStripeCustomer(c: Context, customerId: string) {
  const { data: stripeInfo } = await supabaseAdmin(c)
    .from('stripe_info')
    .select('*')
    .eq('customer_id', customerId)
    .single()
  return stripeInfo
}

export async function getDefaultPlan(c: Context) {
  const { data: plan } = await supabaseAdmin(c)
    .from('plans')
    .select()
    .eq('name', 'Solo')
    .single()
  return plan
}

export async function createStripeCustomer(c: Context, org: Database['public']['Tables']['orgs']['Row']) {
  const customer = await createCustomer(c, org.management_email, org.created_by, org.name)
  // create date + 15 days
  const trial_at = new Date()
  trial_at.setDate(trial_at.getDate() + 15)
  const soloPlan = await getDefaultPlan(c)
  if (!soloPlan)
    throw new Error('no default plan')
  const { error: createInfoError } = await supabaseAdmin(c)
    .from('stripe_info')
    .insert({
      product_id: soloPlan.stripe_id,
      customer_id: customer.id,
      trial_at: trial_at.toISOString(),
    })
  if (createInfoError)
    console.log('createInfoError', createInfoError)

  const { error: updateUserError } = await supabaseAdmin(c)
    .from('orgs')
    .update({
      customer_id: customer.id,
    })
    .eq('id', org.id)
  if (updateUserError)
    console.log('updateUserError', updateUserError)
  const person: Person = {
    id: org.id,
    customer_id: customer.id,
    product_id: soloPlan.name,
    nickname: org.name,
    avatar: org.logo ? org.logo : undefined,
    // country: user.country ? user.country : undefined,
  }
  const { data: plan } = await supabaseAdmin(c)
    .from('plans')
    .select()
    .eq('stripe_id', customer.id)
    .single()
  const segment = await customerToSegmentOrg(c, org.id, soloPlan.name, plan)
  await addDataContact(c, org.management_email, { ...person, ...segment }).catch((e) => {
    console.log('updatePerson error', e)
  })
  console.log('stripe_info done')
}

export function trackBandwidthUsageSB(
  c: Context,
  deviceId: string,
  appId: string,
  fileSize: number,
) {
  return supabaseAdmin(c)
    .from('bandwidth_usage')
    .insert([
      {
        device_id: deviceId,
        app_id: appId,
        file_size: fileSize,
      },
    ])
}

export function trackVersionUsageSB(
  c: Context,
  versionId: number,
  appId: string,
  action: string,
) {
  return supabaseAdmin(c)
    .from('version_usage')
    .insert([
      {
        version_id: versionId,
        app_id: appId,
        action,
      },
    ])
}

export function trackDeviceUsageSB(
  c: Context,
  deviceId: string,
  appId: string,
) {
  return supabaseAdmin(c)
    .from('device_usage')
    .insert([
      {
        device_id: deviceId,
        app_id: appId,
      },
    ])
}

export function trackMetaSB(
  c: Context,
  app_id: string,
  version_id: number,
  size: number,
) {
  console.log('createStatsMeta', app_id, version_id, size)
  return supabaseAdmin(c)
    .from('version_meta')
    .insert([
      {
        app_id,
        version_id,
        size,
      },
    ])
}

export function trackDevicesSB(c: Context, app_id: string, device_id: string, version: number, platform: Database['public']['Enums']['platform_os'], plugin_version: string, os_version: string, version_build: string, custom_id: string, is_prod: boolean, is_emulator: boolean) {
  return supabaseAdmin(c)
    .from('devices')
    .upsert(
      {
        app_id,
        updated_at: new Date().toISOString(),
        device_id,
        platform,
        plugin_version,
        os_version,
        version_build,
        custom_id,
        version,
        is_prod,
        is_emulator,
      },
    )
    .eq('device_id', device_id)
}

export function trackLogsSB(c: Context, app_id: string, device_id: string, action: string, version_id: number) {
  return supabaseAdmin(c)
    .from('stats')
    .insert(
      {
        app_id,
        created_at: new Date().toISOString(),
        device_id,
        action,
        version: version_id,
      },
    )
}

export async function readDeviceUsageSB(c: Context, app_id: string, period_start: string, period_end: string) {
  const { data } = await supabaseAdmin(c)
    .rpc('read_device_usage', { p_app_id: app_id, p_period_start: period_start, p_period_end: period_end })
  return data || []
}

export async function readBandwidthUsageSB(c: Context, app_id: string, period_start: string, period_end: string) {
  const { data } = await supabaseAdmin(c)
    .rpc('read_bandwidth_usage', { p_app_id: app_id, p_period_start: period_start, p_period_end: period_end })
  return data || []
}

export async function readStatsStorageSB(c: Context, app_id: string, period_start: string, period_end: string) {
  const { data } = await supabaseAdmin(c)
    .rpc('read_storage_usage', { p_app_id: app_id, p_period_start: period_start, p_period_end: period_end })
  return data || []
}

export async function readStatsVersionSB(c: Context, app_id: string, period_start: string, period_end: string) {
  const { data } = await supabaseAdmin(c)
    .rpc('read_version_usage', { p_app_id: app_id, p_period_start: period_start, p_period_end: period_end })
  return data || []
}

export async function readStatsSB(c: Context, app_id: string, period_start: string, period_end: string, deviceIds?: string[], search?: string, limit = DEFAULT_LIMIT) {
  const supabase = supabaseAdmin(c)

  let query = supabase
    .from('stats')
    .select('*')
    .eq('app_id', app_id)
    .gte('created_at', new Date(period_start).toISOString())
    .lt('created_at', new Date(period_end).toISOString())
    .order('created_at', { ascending: true })
    .order('app_id', { ascending: true })
    .limit(limit)

  if (deviceIds && deviceIds.length) {
    console.log('deviceIds', deviceIds)
    if (deviceIds.length === 1)
      query = query.eq('device_id', deviceIds[0])
    else
      query = query.in('device_id', deviceIds)
  }

  if (search) {
    console.log('search', search)
    if (deviceIds && deviceIds.length)
      query = query.ilike('version_build', `${search}%`)
    else
      query = query.or(`device_id.ilike.${search}%,version_build.ilike.${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error reading stats list', error)
    return []
  }

  return data || []
}

export async function readDevicesSB(c: Context, app_id: string, period_start: string, period_end: string, version_id?: string, deviceIds?: string[], search?: string, limit = DEFAULT_LIMIT) {
  const supabase = supabaseAdmin(c)

  console.log('readDevicesSB', app_id, period_start, period_end, version_id, deviceIds, search)
  let query = supabase
    .from('devices')
    .select('*')
    .eq('app_id', app_id)
    .gte('updated_at', new Date(period_start).toISOString())
    .lt('updated_at', new Date(period_end).toISOString())
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (deviceIds && deviceIds.length) {
    console.log('deviceIds', deviceIds)
    if (deviceIds.length === 1)
      query = query.eq('device_id', deviceIds[0])
    else
      query = query.in('device_id', deviceIds)
  }

  if (search) {
    console.log('search', search)
    if (deviceIds && deviceIds.length)
      query = query.ilike('custom_id', `${search}%`)
    else
      query = query.or(`device_id.ilike.${search}%,custom_id.ilike.${search}%`)
  }
  if (version_id)
    query = query.eq('version_id', version_id)

  const { data, error } = await query

  if (error) {
    console.error('Error reading device list', error)
    return []
  }

  return data || []
}
const DEFAUL_PLAN_NAME = 'Solo'

export async function getCurrentPlanNameOrg(c: Context, orgId?: string): Promise<string> {
  if (!orgId)
    return DEFAUL_PLAN_NAME
  const { data, error } = await supabaseAdmin(c)
    .rpc('get_current_plan_name_org', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)

  return data || DEFAUL_PLAN_NAME
}
