import { NextRequest, NextResponse } from 'next/server'
import {
  creerValeurSessionAdmin,
  estAdminConfigure,
  COOKIE_SESSION,
  DUREE_SESSION_COURTE_SECONDES,
  DUREE_SESSION_SECONDES,
  verifierIdentifiants,
} from '@/lib/admin-session'

/**
 * POST /api/auth/login — { utilisateur, mot_de_passe, se_souvenir? } -> pose le cookie de session admin.
 * se_souvenir=true  : session 7 jours (cookie persistant).
 * se_souvenir=false : session 12 h (cookie de session navigateur).
 */
export async function POST(request: NextRequest) {
  if (!estAdminConfigure()) {
    return NextResponse.json(
      { error: 'Serveur non configuré (ADMIN_USER/ADMIN_PASSWORD manquants)' },
      { status: 503 }
    )
  }

  const corps = await request.json().catch(() => null)
  const utilisateur = corps?.utilisateur
  const motDePasse = corps?.mot_de_passe
  const seSouvenir = corps?.se_souvenir !== false

  if (typeof utilisateur !== 'string' || typeof motDePasse !== 'string' || !verifierIdentifiants(utilisateur, motDePasse)) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
  }

  const duree = seSouvenir ? DUREE_SESSION_SECONDES : DUREE_SESSION_COURTE_SECONDES
  const valeur = await creerValeurSessionAdmin(duree)
  const reponse = NextResponse.json({ ok: true })
  reponse.cookies.set(COOKIE_SESSION, valeur, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Sans "Rester connecté" : cookie de session (effacé à la fermeture du navigateur),
    // avec expiration serveur de 12 h dans tous les cas.
    ...(seSouvenir ? { maxAge: duree } : {}),
    secure: process.env.NODE_ENV === 'production',
  })
  return reponse
}
