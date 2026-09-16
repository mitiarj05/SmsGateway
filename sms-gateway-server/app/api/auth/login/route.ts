import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminSessionValue,
  isAdminConfigured,
  SESSION_COOKIE,
  SESSION_SHORT_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  verifyCredentials,
} from '@/lib/admin-session'

/**
 * POST /api/auth/login — { user, pass, remember? } -> pose le cookie de session admin.
 * remember=true  : session 7 jours (cookie persistant).
 * remember=false : session 12 h (cookie de session navigateur).
 */
export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Serveur non configuré (ADMIN_USER/ADMIN_PASSWORD manquants)' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => null)
  const user = body?.user
  const pass = body?.pass
  const remember = body?.remember !== false

  if (typeof user !== 'string' || typeof pass !== 'string' || !verifyCredentials(user, pass)) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
  }

  const ttl = remember ? SESSION_TTL_SECONDS : SESSION_SHORT_TTL_SECONDS
  const value = await createAdminSessionValue(ttl)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Sans "Rester connecté" : cookie de session (effacé à la fermeture du navigateur),
    // avec expiration serveur de 12 h dans tous les cas.
    ...(remember ? { maxAge: ttl } : {}),
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
