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
 * Via l'API REST Identity Toolkit en HTTPS pur : `firebase-admin/auth`
 * ne peut pas tourner sous le runtime Vercel (chaîne ESM jose/jwks-rsa
 * incompatible, même en import dynamique). Aucun module natif en jeu ici.
 * Requiert FIREBASE_WEB_API_KEY (clé Web publique du projet gateway).
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  if (!idToken) return null
  const apiKey = process.env.FIREBASE_WEB_API_KEY
  if (!apiKey) {
    console.warn('[auth] FIREBASE_WEB_API_KEY manquante — vérification Firebase impossible')
    return null
  }
  try {
    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (!res.ok) {
      console.warn(`[auth] Identity Toolkit rejette le token (${res.status})`)
      return null
    }
    const data = await res.json()
    const uid = data?.users?.[0]?.localId
    return typeof uid === 'string' && uid.length > 0 ? uid : null
  } catch (err) {
    console.warn('[auth] vérification Firebase impossible:', (err as Error).message)
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