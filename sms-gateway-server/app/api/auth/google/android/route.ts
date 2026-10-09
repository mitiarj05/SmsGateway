import { NextRequest, NextResponse } from 'next/server'
import { verifierCompteFirebase } from '@/lib/authentification'
import { obtenirOuCreerParFirebase } from '@/lib/compte-client'

/**
 * POST /api/auth/google/android — { id_token } -> { ok, application }.
 * Publique (hors matcher du proxy).
 *
 * Connexion Google NATIVE de l'application Android. SANS contrôle reCAPTCHA :
 * l'app native n'affiche pas de case ; la preuve anti-abus est le jeton ID
 * Firebase lui-même (compte Google réel vérifié par Google, quota Firebase).
 * Le jeton est vérifié via Identity Toolkit avant toute liaison.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const jeton = typeof corps?.id_token === 'string' ? corps.id_token : ''
  if (!jeton) {
    return NextResponse.json({ error: 'Jeton Google manquant' }, { status: 400 })
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
