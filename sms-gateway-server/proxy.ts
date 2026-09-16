import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Protection du dashboard : session cookie (`sms_admin`, posée par /login)
 * avec repli Basic Auth pour les scripts (curl, etc.).
 *
 * Publiques (auth propre) : /login, /api/auth/*, /api/sms/send,
 * /api/devices/register, /api/devices/[id]/tasks|ping|fcm-token.
 * Tout le reste du matcher exige : cookie valide OU Basic valide.
 */

// --- Vérification HMAC du cookie, dupliquée ici plutôt qu'importée :
// le proxy s'exécute hors runtime applicatif (cf. docs Next "proxy"),
// on évite donc les modules partagés. Doit rester en sync avec
// lib/admin-session.ts (format `v1.<exp>.<sig_hex>`).
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

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function hasValidSession(request: NextRequest, secret: string): Promise<boolean> {
  const value = request.cookies.get('sms_admin')?.value
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1') return false
  const exp = Number(parts[1])
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false
  const expectedSig = await hmacHex(secret, `${parts[0]}.${parts[1]}`)
  return safeEqual(parts[2], expectedSig)
}

function hasValidBasic(request: NextRequest, user: string, pass: string): boolean {
  const header = request.headers.get('authorization')
  if (!header || !header.startsWith('Basic ')) return false
  let decoded = ''
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8')
  } catch {
    return false
  }
  const sep = decoded.indexOf(':')
  const u = sep >= 0 ? decoded.slice(0, sep) : decoded
  const p = sep >= 0 ? decoded.slice(sep + 1) : ''
  return safeEqual(u, user) && safeEqual(p, pass)
}

function isPublicApi(pathname: string): boolean {
  if (pathname === '/api/auth/login' || pathname.startsWith('/api/auth/login/')) return true
  if (pathname === '/api/auth/logout' || pathname.startsWith('/api/auth/logout/')) return true
  if (pathname === '/api/sms/send' || pathname.startsWith('/api/sms/send/')) return true
  if (pathname === '/api/devices/register' || pathname.startsWith('/api/devices/register/')) {
    return true
  }
  if (/\/api\/devices\/[^/]+\/(tasks|ping|fcm-token|quota|offline)/.test(pathname)) {
    return true
  }
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicApi(pathname)) {
    return NextResponse.next()
  }

  const user = process.env.ADMIN_USER
  const pass = process.env.ADMIN_PASSWORD

  // Garde-fou dev local : si non configuré, on laisse passer (avec warning).
  // En prod (Vercel), définir ADMIN_USER + ADMIN_PASSWORD.
  if (!user || !pass) {
    console.warn('[proxy] ADMIN_USER/ADMIN_PASSWORD non configurés — accès dashboard non protégé')
    return NextResponse.next()
  }

  if (await hasValidSession(request, pass)) {
    return NextResponse.next()
  }
  if (hasValidBasic(request, user, pass)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/devices',
    '/devices/:path*',
    '/queue',
    '/queue/:path*',
    '/history',
    '/history/:path*',
    '/settings',
    '/settings/:path*',
    '/api/devices',
    '/api/devices/:path*',
    '/api/tasks',
    '/api/tasks/:path*',
    '/api/stats',
    '/api/stats/:path*',
    '/api/api-clients',
    '/api/api-clients/:path*',
    '/api/settings',
    '/api/settings/:path*',
  ],
}
