import { createHmac } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Session client (espace /espace) : cookie HttpOnly signé en HMAC-SHA256.
 * Contient l'id_application — TOUTES les routes /api/espace/* filtrent
 * par cet id : un client ne voit jamais les données d'un autre.
 * Secret = ADMIN_PASSWORD. Réservé au runtime Node (routes API).
 */

export const COOKIE_CLIENT = 'sms_client'
export const DUREE_SESSION_CLIENT_SECONDES = 7 * 24 * 3600

function signer(secret: string, donnees: string): string {
  return createHmac('sha256', secret).update(donnees, 'utf-8').digest('hex')
}

/** Crée une valeur `v1.<idApplication>.<exp>.<sig>`. */
export function creerValeurSessionClient(idApplication: string): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD manquant')
  const expiration = Math.floor(Date.now() / 1000) + DUREE_SESSION_CLIENT_SECONDES
  const corps = `v1.${idApplication}.${expiration}`
  return `${corps}.${signer(secret, corps)}`
}

/** Vérifie le cookie et retourne l'id_application, ou null. */
export function lireSessionClient(request: NextRequest): string | null {
  try {
    const secret = process.env.ADMIN_PASSWORD
    const valeur = request.cookies.get(COOKIE_CLIENT)?.value
    if (!secret || !valeur) return null
    const parties = valeur.split('.')
    if (parties.length !== 4 || parties[0] !== 'v1') return null
    const expiration = Number(parties[2])
    if (!Number.isFinite(expiration) || expiration <= Math.floor(Date.now() / 1000)) return null
    const signatureAttendue = signer(secret, `${parties[0]}.${parties[1]}.${parties[2]}`)
    const recue = parties[3]
    if (recue.length !== signatureAttendue.length) return null
    let diff = 0
    for (let i = 0; i < recue.length; i++) {
      diff |= recue.charCodeAt(i) ^ signatureAttendue.charCodeAt(i)
    }
    if (diff !== 0) return null
    return parties[1]
  } catch {
    return null
  }
}
