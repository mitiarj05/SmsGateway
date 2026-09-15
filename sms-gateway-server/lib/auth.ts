import { getSupabaseAdmin } from './supabase-server'

/**
 * Vérifie qu'un device existe avec ce token.
 * Retourne le device si OK, null sinon.
 */
export async function authenticateDevice(deviceId: string, token: string) {
  if (!deviceId || !token) {
    console.error('[auth] deviceId ou token vide', { deviceIdPresent: !!deviceId, tokenPresent: !!token })
    return null
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('id, nom, token, statut')
    .eq('id', deviceId)
    .eq('token', token)
    .single()

  if (error || !data) {
    console.error('[auth] device non authentifié', { deviceId, code: error?.code, message: error?.message })
    return null
  }
  return data
}

/**
 * Vérifie qu'un api_client existe avec cette clé API.
 * Retourne le client si OK, null sinon.
 */
export async function authenticateApiClient(cleApi: string) {
  if (!cleApi) return null

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('api_clients')
    .select('id, nom, cle_api')
    .eq('cle_api', cleApi)
    .single()

  if (error || !data) return null
  return data
}