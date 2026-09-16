/**
 * Session admin du dashboard : cookie HttpOnly signé en HMAC-SHA256.
 * Sans dépendance, compatible Node.js et Edge (Web Crypto uniquement).
 * Le secret = ADMIN_PASSWORD (doit donc être long et aléatoire).
 */

export const SESSION_COOKIE = 'sms_admin'
export const SESSION_TTL_SECONDS = 7 * 24 * 3600
export const SESSION_SHORT_TTL_SECONDS = 12 * 3600

export function isAdminConfigured(): boolean {
  return !!process.env.ADMIN_USER && !!process.env.ADMIN_PASSWORD
}

/** Comparaison en temps constant (anti timing-attack). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function verifyCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USER
  const expectedPass = process.env.ADMIN_PASSWORD
  if (!expectedUser || !expectedPass) return false
  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Crée une valeur de cookie `v1.<exp>.<sig>`. */
export async function createAdminSessionValue(ttlSeconds: number = SESSION_TTL_SECONDS): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD manquant')
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const body = `v1.${exp}`
  const sig = await hmacHex(secret, body)
  return `${body}.${sig}`
}

/** Vérifie une valeur de cookie (signature + expiration). */
export async function verifyAdminSessionValue(value: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || !value) return false
  const parts = value.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return false
  const exp = Number(parts[1])
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false
  const expectedSig = await hmacHex(secret, `${parts[0]}.${parts[1]}`)
  return safeEqual(parts[2], expectedSig)
}
