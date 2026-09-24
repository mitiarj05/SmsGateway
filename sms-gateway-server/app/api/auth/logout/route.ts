import { NextResponse } from 'next/server'
import { COOKIE_SESSION } from '@/lib/admin-session'

/** POST /api/auth/logout — supprime le cookie de session admin */
export async function POST() {
  const reponse = NextResponse.json({ ok: true })
  reponse.cookies.set(COOKIE_SESSION, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return reponse
}
