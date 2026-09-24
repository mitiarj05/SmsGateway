import { obtenirSupabaseAdmin } from './supabase-serveur'

/**
 * Vérifie qu'un appareil existe avec ce jeton.
 * Retourne l'appareil si OK, null sinon.
 */
export async function authentifierAppareil(appareilId: string, jeton: string) {
  if (!appareilId || !jeton) {
    console.error('[auth] appareilId ou jeton vide', { appareilIdPresent: !!appareilId, jetonPresent: !!jeton })
    return null
  }

  const supabaseAdmin = obtenirSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('appareils')
    .select('id, nom, jeton, statut')
    .eq('id', appareilId)
    .eq('jeton', jeton)
    .single()

  if (error || !data) {
    console.error('[auth] appareil non authentifié', { appareilId, code: error?.code, message: error?.message })
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
export async function verifierJetonFirebase(jetonId: string): Promise<string | null> {
  if (!jetonId) return null
  const cleApiWeb = process.env.FIREBASE_WEB_API_KEY
  if (!cleApiWeb) {
    console.warn('[auth] FIREBASE_WEB_API_KEY manquante — vérification Firebase impossible')
    return null
  }
  try {
    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${cleApiWeb}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: jetonId }),
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
export async function authentifierClientApi(cleApi: string) {
  if (!cleApi) return null
  const cle = cleApi.trim()
  if (!cle) return null

  const supabaseAdmin = obtenirSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('id, nom, cle_api')
    .eq('cle_api', cle)
    .single()

  if (error || !data) return null
  return data
}
