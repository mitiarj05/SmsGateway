import { NextRequest, NextResponse } from 'next/server'
import { verifierCompteFirebase } from '@/lib/authentification'
import { verifierCaptcha } from '@/lib/captcha'
import { obtenirOuCreerParFirebase } from '@/lib/compte-client'

/**
 * POST /api/auth/google/android — { id_token, captcha? } -> { ok, application }.
 * Publique (hors matcher du proxy).
 *
 * Connexion Google NATIVE de l'application Android : le téléphone obtient un
 * ID token Firebase (Credential Manager + Firebase Auth) et l'envoie ici.
 * On le vérifie via Identity Toolkit, on retrouve ou provisionne
 * l'application (anti-doublon par UID Firebase puis e-mail validé) et on
 * renvoie sa fiche — l'app garde sa session locale comme aujourd'hui.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const jeton = typeof corps?.id_token === 'string' ? corps.id_token : ''
  if (!jeton) {
    return NextResponse.json({ error: 'Jeton Google manquant' }, { status: 400 })
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const captcha = await verifierCaptcha(corps?.captcha, ip)
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.raison ?? 'Vérification anti-robot requise' }, { status: 403 })
  }
  try {
    const compte = await verifierCompteFirebase(jeton)
    if (!compte) {
      return NextResponse.json({ error: 'Jeton Google invalide' }, { status: 401 })
    }
    const nom = compte.email ? compte.email.split('@')[0] : 'Client Android'
    const resultat = await obtenirOuCreerParFirebase(compte.uid, compte.email, nom)
    return NextResponse.json({
      ok: true,
      cree: resultat.cree,
      application: { id: resultat.applicationId },
    })
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Compte suspendu')) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
