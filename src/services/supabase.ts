import ky from 'ky'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

// import { Http } from '@capacitor-community/http'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { Database } from '~/types/supabase.types'

let supaClient: SupabaseClient<Database> = null as any

// export const defaultApiHost = import.meta.env.VITE_API_HOST as string
export const defaultApiHost = 'https://api-preprod.capgo.app'
export const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

interface CapgoConfig {
  supaHost: string
  supaKey: string
  supbaseId: string
  host: string
  hostWeb: string
}

function getLocalConfig() {
  return {
    supaHost: import.meta.env.VITE_SUPABASE_URL as string,
    supaKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    supbaseId: import.meta.env.VITE_SUPABASE_URL?.split('//')[1].split('.')[0].split(':')[0] as string,
    host: import.meta.env.VITE_APP_URL as string,
    hostWeb: import.meta.env.LANDING_URL as string,
  } as CapgoConfig
}

let config: CapgoConfig = getLocalConfig()

export async function getRemoteConfig() {
  // call host + /api/private/config and parse the result as json using ky
  const localConfig = await getLocalConfig()
  const data = await ky
    .get(`${defaultApiHost}/private/config`)
    .then(res => res.json<CapgoConfig>())
    .then(data => ({ ...data, ...localConfig } as CapgoConfig))
    .catch(() => {
      console.log('Local config', localConfig)
      return localConfig as CapgoConfig
    })
  config = data
}

export function useSupabase() {
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    // fetch: (requestInfo, requestInit) => {
    //   const url = requestInfo.toString()
    //   if (requestInit?.method === 'POST' && (url.includes('/storage/') || url.includes('.functions.supabase.co')))
    //     return fetch(requestInfo, requestInit)
    //   return Http.request({
    //     url,
    //     method: requestInit?.method,
    //     headers: requestInit?.headers as any || {},
    //     data: requestInit?.body,
    //   })
    //     .then((data) => {
    //       const res = typeof data.data === 'string' ? data.data : JSON.stringify(data.data)
    //       const resp = new Response(res, {
    //         status: data.status,
    //         headers: data.headers,
    //       })
    //       return resp
    //     })
    // },
  }
  // return createClient<Database>(supabaseUrl, supabaseAnonKey, options)
  if (supaClient)
    return supaClient

  supaClient = createClient<Database>(config.supaHost, config.supaKey, options)
  return supaClient
}

export function isSpoofed() {
  return !!localStorage.getItem(`supabase-${config.supbaseId}.spoof_admin_jwt`)
}
export function saveSpoof(jwt: string, refreshToken: string) {
  return localStorage.setItem(`supabase-${config.supbaseId}.spoof_admin_jwt`, JSON.stringify({ jwt, refreshToken }))
}

export async function hashEmail(email: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(email)

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function deleteUser() {
  const { error } = await useSupabase()
    .rpc('delete_user')
    .single()
  if (error)
    throw new Error(error.message)
}
export function deleteSupabaseToken() {
  return localStorage.removeItem(`sb-${config.supbaseId}-auth-token`)
}
export function getSupabaseToken() {
  return localStorage.getItem(`sb-${config.supbaseId}-auth-token`)
}
export function unspoofUser() {
  const textData: string | null = localStorage.getItem(`supabase-${config.supbaseId}.spoof_admin_jwt`)
  if (!textData || !isSpoofed())
    return false

  const { jwt, refreshToken } = JSON.parse(textData)
  if (!jwt || !refreshToken)
    return false

  const supabase = useSupabase()
  supabase.auth.setSession({ access_token: jwt, refresh_token: refreshToken })
  localStorage.removeItem(`supabase-${config.supbaseId}.spoof_admin_jwt`)
  return true
}

export async function downloadUrl(provider: string, userId: string, appId: string, id: number): Promise<string> {
  const data = {
    user_id: userId,
    app_id: appId,
    storage_provider: provider,
    id,
  }
  const res = await useSupabase().functions.invoke('private/download_link', { body: JSON.stringify(data) })
  return res.data.url
}

export async function existUser(email: string): Promise<string> {
  const { data, error } = await useSupabase()
    .rpc('exist_user', { e_mail: email })
    .single()
  if (error)
    throw new Error(error.message)

  return data
}

export async function autoAuth(route: RouteLocationNormalizedLoaded) {
  const supabase = useSupabase()
  const { data: session } = await supabase.auth.getSession()!
  if (session.session || !route.hash)
    return null
  const queryString = route.hash.replace('#', '')
  const urlParams = new URLSearchParams(queryString)
  const refresh_token = urlParams.get('refresh_token')
  if (!refresh_token)
    return null
  const { data: logSession } = await supabase.auth.refreshSession({
    refresh_token,
  })
  return logSession
}

export interface appUsage {
  app_id: string
  bandwidth: number
  date: string
  fail: number
  get: number
  install: number
  mau: number
  storage_added: number
  storage_deleted: number
  uninstall: number
}
export interface appUsageV2 {
  app_id: string
  bandwidth: number
  date: string
  fail: number
  get: number
  install: number
  mau: number
  storage: number
  uninstall: number
}

export interface appUsageGlobal {
  date: string
  bandwidth: number
  mau: number
  storage: number
}
export async function getAllDashboard(orgId: string, startDate?: string, endDate?: string): Promise<appUsageGlobal[]> {
  const resAppIds = await useSupabase()
    .from('apps')
    .select('app_id')
    .eq('owner_org', orgId)
    .then(res => res.data?.map(app => app.app_id) || [])
  // read from supabase daily_storage and replace the storage_added and storage_deleted by storage
  const { data: storageData } = await useSupabase()
    .from('daily_storage')
    .select('*')
    .in('app_id', resAppIds)
    .gte('date', startDate)
    .lte('date', endDate)
  const storage = storageData || []
  // get bandwidth same as daily_storage
  const { data: bandwidthData } = await useSupabase()
    .from('daily_bandwidth')
    .select('*')
    .in('app_id', resAppIds)
    .gte('date', startDate)
    .lte('date', endDate)
  const bandwidth = bandwidthData || []
  // get mau same as daily_storage
  const { data: mauData } = await useSupabase()
    .from('daily_mau')
    .select('*')
    .in('app_id', resAppIds)
    .gte('date', startDate)
    .lte('date', endDate)
  const mau = mauData || []
  // generate all dates between startDate and endDate
  const dates: string[] = []
  let currentDate = new Date(startDate)
  const end = new Date(endDate)
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0])
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
  }
  const data = resAppIds.flatMap((appId) => {
    // create only one entry for each day by appId
    const appDays = dates.map((date) => {
      const storageApp = storage.find(s => s.app_id === appId && s.date === date)
      const bandwidthApp = bandwidth.find(s => s.app_id === appId && s.date === date)
      const mauApp = mau.find(s => s.app_id === appId && s.date === date)
      return {
        app_id: appId,
        date,
        mau: mauApp?.mau || 0,
        storage: storageApp?.storage || 0,
        bandwidth: bandwidthApp?.bandwidth || 0,
      }
    })
    return appDays
  })
  // reduce the list to have only one entry by day with the sum of all apps
  const reducedData = data.reduce((acc: appUsageGlobal[], current) => {
    const existing = acc.find(s => s.date === current.date)
    if (existing) {
      existing.mau += current.mau
      existing.storage += current.storage
      existing.bandwidth += current.bandwidth
    }
    else {
      acc.push({
        date: current.date,
        mau: current.mau,
        storage: current.storage,
        bandwidth: current.bandwidth,
      })
    }
    return acc
  }, [])
  // sort by date
  return reducedData.sort((a, b) => a.date.localeCompare(b.date))
}

export async function getTotalAppStorage(orgId?: string, appid?: string): Promise<number> {
  if (!orgId)
    return 0
  if (!appid)
    return getTotalStorage(orgId)

  const { data, error } = await useSupabase()
    .rpc('get_total_app_storage_size_orgs', { org_id: orgId, app_id: appid })
    .single()
  if (error)
    throw new Error(error.message)

  return data || 0
}

export async function getTotalStorage(orgId?: string): Promise<number> {
  if (!orgId)
    return 0
  const { data, error } = await useSupabase()
    .rpc('get_total_storage_size_org', { org_id: orgId })
    .single()
  if (error)
    throw new Error(error.message)

  return data || 0
}

export async function isGoodPlanOrg(orgId?: string): Promise<boolean> {
  if (!orgId)
    return false
  const { data, error } = await useSupabase()
    .rpc('is_good_plan_v5_org', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)

  return data || false
}

export async function getOrgs(): Promise<Database['public']['Tables']['orgs']['Row'][]> {
  const { data, error } = await useSupabase()
    .from('orgs')
    .select('*')

  if (error) {
    console.error('getOrgs error', error.message)
    throw error
  }

  return data || []
}

export async function isTrialOrg(orgId: string): Promise<number> {
  const { data, error } = await useSupabase()
    .rpc('is_trial_org', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)

  return data || 0
}
export async function isAdmin(userid?: string): Promise<boolean> {
  if (!userid)
    return false
  const { data, error } = await useSupabase()
    .rpc('is_admin', { userid })
    .single()
  if (error)
    throw new Error(error.message)

  return data || false
}

export async function isCanceled(userid?: string): Promise<boolean> {
  if (!userid)
    return false
  const { data, error } = await useSupabase()
    .rpc('is_canceled', { userid })
    .single()
  if (error)
    throw new Error(error.message)

  return data || false
}

export async function isPayingOrg(orgId: string): Promise<boolean> {
  const { data, error } = await useSupabase()
    .rpc('is_paying_org', { orgid: orgId })
    .single()
  if (error)
    console.error('isPayingOrg error', orgId, error)

  return data || false
}

export async function getPlans(): Promise<Database['public']['Tables']['plans']['Row'][]> {
  const { data: plans } = await useSupabase()
    .from('plans')
    .select()
    .order('price_m')
    // .neq('stripe_id', 'free')
  return plans || []
}

export async function isAllowedAction(userid?: string): Promise<boolean> {
  if (!userid)
    return false
  const { data, error } = await useSupabase()
    .rpc('is_allowed_action_user', { userid })
    .single()
  if (error)
    throw new Error(error.message)

  return data
}

export async function getPlanUsagePercent(orgId?: string): Promise<number> {
  if (!orgId)
    return 0
  const { data, error } = await useSupabase()
    .rpc('get_plan_usage_percent_org', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)
  return data || 0
}

export async function getTotalStats(orgId?: string): Promise<Database['public']['Functions']['get_total_stats_v5']['Returns'][0]> {
  if (!orgId) {
    return {
      mau: 0,
      bandwidth: 0,
      storage: 0,
    }
  }
  const { data, error } = await useSupabase()
    .rpc('get_total_stats_v5_org', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)
  // console.log('getTotalStats', data, error)

  return data as any as Database['public']['Functions']['get_total_stats_v5_org']['Returns'][0] || {
    mau: 0,
    bandwidth: 0,
    storage: 0,
  }
}

export async function getCurrentPlanName(userid?: string): Promise<string> {
  if (!userid)
    return 'Free'
  const { data, error } = await useSupabase()
    .rpc('get_current_plan_name', { userid })
    .single()
  if (error)
    throw new Error(error.message)

  return data || 'Free'
}

export async function getCurrentPlanNameOrg(orgId?: string): Promise<string> {
  if (!orgId)
    return 'Free'
  const { data, error } = await useSupabase()
    .rpc('get_current_plan_name_org', { orgid: orgId })
    .single()
  if (error)
    throw new Error(error.message)

  return data || 'Free'
}

export async function findBestPlan(stats: Database['public']['Functions']['find_best_plan_v3']['Args']): Promise<string> {
  // console.log('findBestPlan', stats)
  // const storage = bytesToGb(stats.storage)
  // const bandwidth = bytesToGb(stats.bandwidth)
  const { data, error } = await useSupabase()
    .rpc('find_best_plan_v3', {
      mau: stats.mau || 0,
      bandwidth: stats.bandwidth,
      storage: stats.storage,
    })
    .single()
  if (error)
    throw new Error(error.message)

  return data
}
