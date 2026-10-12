import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Codes de liaison QR (associer un téléphone à un espace).
 * Sans état : code = base64url(`${idApplication}.${expiration}`).${signature}
 * signé en HMAC-SHA256 avec ADMIN_PASSWORD (même secret que les sessions).
 * Durée de vie courte (10 min) — un code photographié expire vite.
 */

export const DUREE_CODE_LIAISON_SECONDES = 10 * 60

function secret(): string {
  const s = process.env.ADMIN_PASSWORD
  if (!s) throw new Error('ADMIN_PASSWORD manquant')
  return s
}

/** Crée un code pour l'application donnée. */
export function creerCodeLiaison(idApplication: string): { code: string; expireA: number } {
  const expiration = Math.floor(Date.now() / 1000) + DUREE_CODE_LIAISON_SECONDES
  const corps = Buffer.from(`${idApplication}.${expiration}`, 'utf-8').toString('base64url')
  const signature = createHmac('sha256', secret()).update(corps, 'utf-8').digest('base64url')
  return { code: `${corps}.${signature}`, expireA: expiration * 1000 }
}

/** Vérifie un code, retourne l'id_application ou null. */
export function verifierCodeLiaison(code: unknown): string | null {
  try {
    if (typeof code !== 'string') return null
    const parties = code.split('.')
    if (parties.length !== 2) return null
    const corps = parties[0] ?? ''
    const signature = parties[1] ?? ''
    const attendue = createHmac('sha256', secret()).update(corps, 'utf-8').digest('base64url')
    const recue = Buffer.from(signature, 'utf-8')
    const calculee = Buffer.from(attendue, 'utf-8')
    if (recue.length !== calculee.length || !timingSafeEqual(recue, calculee)) return null
    const clair = Buffer.from(corps, 'base64url').toString('utf-8')
    const separateur = clair.lastIndexOf('.')
    if (separateur < 0) return null
    const idApplication = clair.slice(0, separateur)
    const expiration = Number(clair.slice(separateur + 1))
    if (!idApplication || !Number.isFinite(expiration)) return null
    if (expiration <= Math.floor(Date.now() / 1000)) return null
    return idApplication
  } catch {
    return null
  }
}
