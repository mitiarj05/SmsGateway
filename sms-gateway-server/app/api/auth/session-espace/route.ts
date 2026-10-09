import { NextRequest, NextResponse } from 'next/server'
import { creerSupabaseRoute } from '@/lib/supabase-route'
import { verifierCaptcha } from '@/lib/captcha'
import { obtenirOuCreerApplication } from '@/lib/compte-client'
import { poserCookieSessionClient } from '@/lib/session-client'

/**
 * POST /api/auth/session-espace — { captcha? } -> pose la session client.
 * Publique (hors matcher du proxy).
 *
 * Appelée juste après un signIn Supabase Auth côté navigateur : on relit
 * l'utilisateur depuis les cookies sb-*, on retrouve ou provisionne son
 * application (migration douce des anciens comptes par e-mail) et on pose
 * le cookie `sms_client` attendu par le proxy et les routes /api/espace/*.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const captcha = await verifierCaptcha(corps?.captcha, ip)
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.raison ?? 'Vérification anti-robot requise' }, { status: 403 })
  }
  try {
    const supabase = await creerSupabaseRoute()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const email = user?.email?.trim().toLowerCase()
    if (!user || !email) {
      return NextResponse.json({ error: 'Session invalide — reconnectez-vous' }, { status: 401 })
    }
    const nom =
      String(user.user_metadata?.nom_complet ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').slice(0, 80)
    const compte = await obtenirOuCreerApplication(user.id, email, nom)
    const reponse = NextResponse.json({ ok: true })
    poserCookieSessionClient(reponse, compte.applicationId)
    return reponse
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Compte suspendu')) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
