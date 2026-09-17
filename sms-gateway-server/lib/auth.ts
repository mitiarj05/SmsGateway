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
 * Vérifie un ID token Firebase Auth (connexion anonyme du téléphone).
 * Retourne le UID Firebase si valide, null sinon.
 *
 * Import dynamique : `firebase-admin/auth` ne doit pas être bundlé
 * statiquement (chaîne ESM jose/jwks-rsa incompatible avec le runtime
 * Next/Vercel) — il est chargé à la première vérification, en Node.js pur.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  if (!idToken) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const decoded = await getAuth().verifyIdToken(idToken)
    return decoded.uid
  } catch (err) {
    console.warn('[auth] ID token Firebase invalide:', (err as Error).message)
    return null
  }
}

/**
 * Vérifie qu'un api_client existe avec cette clé API.
 * Retourne le client si OK, null sinon.
 */
export async function authenticateApiClient(cleApi: string) {
  if (!cleApi) return null
  const cle = cleApi.trim()
  if (!cle) return null

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('api_clients')
    .select('id, nom, cle_api')
    .eq('cle_api', cle)
    .single()

  if (error || !data) return null
  return data
}