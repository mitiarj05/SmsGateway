import { NextResponse } from 'next/server'
import { COOKIE_CLIENT } from '@/lib/session-client'

/** POST /api/espace/auth/logout — supprime la session client. */
export async function POST() {
  const reponse = NextResponse.json({ ok: true })
  reponse.cookies.set(COOKIE_CLIENT, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return reponse
}
