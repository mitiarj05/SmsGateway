import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/admin-session'

/** POST /api/auth/logout — supprime le cookie de session admin */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
