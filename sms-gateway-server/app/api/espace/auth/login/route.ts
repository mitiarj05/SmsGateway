import { NextRequest, NextResponse } from 'next/server'
import { authentifierClientApi } from '@/lib/authentification'
import { creerValeurSessionClient, COOKIE_CLIENT, DUREE_SESSION_CLIENT_SECONDES } from '@/lib/session-client'

/**
 * POST /api/espace/auth/login — { cle_api } -> pose le cookie de session client.
 * Public (le proxy laisse passer). Erreur générique anti-énumération.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const cleApi = typeof corps?.cle_api === 'string' ? corps.cle_api.trim() : ''
  if (!cleApi) {
    return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  }
  const client = await authentifierClientApi(cleApi)
  if (!client) {
    return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  }
  let valeur: string
  try {
    valeur = creerValeurSessionClient(client.id)
  } catch {
    return NextResponse.json({ error: 'Serveur non configuré' }, { status: 503 })
  }
  const reponse = NextResponse.json({ ok: true, nom: client.nom })
  reponse.cookies.set(COOKIE_CLIENT, valeur, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DUREE_SESSION_CLIENT_SECONDES,
    secure: process.env.NODE_ENV === 'production',
  })
  return reponse
}
