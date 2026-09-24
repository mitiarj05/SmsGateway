/**
 * Session admin du dashboard : cookie HttpOnly signé en HMAC-SHA256.
 * Sans dépendance, compatible Node.js et Edge (Web Crypto uniquement).
 * Le secret = ADMIN_PASSWORD (doit donc être long et aléatoire).
 */

export const COOKIE_SESSION = 'sms_admin'
export const DUREE_SESSION_SECONDES = 7 * 24 * 3600
export const DUREE_SESSION_COURTE_SECONDES = 12 * 3600

export function estAdminConfigure(): boolean {
  return !!process.env.ADMIN_USER && !!process.env.ADMIN_PASSWORD
}

/** Comparaison en temps constant (anti timing-attack). */
export function comparaisonSure(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function verifierIdentifiants(utilisateur: string, motDePasse: string): boolean {
  const attenduUtilisateur = process.env.ADMIN_USER
  const attenduMotDePasse = process.env.ADMIN_PASSWORD
  if (!attenduUtilisateur || !attenduMotDePasse) return false
  return comparaisonSure(utilisateur, attenduUtilisateur) && comparaisonSure(motDePasse, attenduMotDePasse)
}

async function hmacHex(secret: string, donnees: string): Promise<string> {
  const cle = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(donnees))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Crée une valeur de cookie `v1.<exp>.<sig>`. */
export async function creerValeurSessionAdmin(dureeSecondes: number = DUREE_SESSION_SECONDES): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD manquant')
  const expiration = Math.floor(Date.now() / 1000) + dureeSecondes
  const corps = `v1.${expiration}`
  const signature = await hmacHex(secret, corps)
  return `${corps}.${signature}`
}

/** Vérifie une valeur de cookie (signature + expiration). */
export async function verifierValeurSessionAdmin(valeur: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || !valeur) return false
  const parties = valeur.split('.')
  if (parties.length !== 3 || parties[0] !== 'v1') return false
  const expiration = Number(parties[1])
  if (!Number.isFinite(expiration) || expiration <= Math.floor(Date.now() / 1000)) return false
  const signatureAttendue = await hmacHex(secret, `${parties[0]}.${parties[1]}`)
  return comparaisonSure(parties[2], signatureAttendue)
}
