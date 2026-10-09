import { NextRequest, NextResponse } from 'next/server'
import { creerSupabaseRoute } from '@/lib/supabase-route'
import { obtenirOuCreerApplication } from '@/lib/compte-client'
import { poserCookieSessionClient } from '@/lib/session-client'

/**
 * GET /api/auth/google/retour — callback OAuth Google (Supabase Auth).
 * Publique (hors matcher du proxy).
 *
 * Modèle standard : l'OAuth prouve la propriété de l'e-mail, on retrouve ou
 * provisionne l'application via obtenirOuCreerApplication (anti-doublon avec
 * les anciennes demandes), on pose la session client et on ouvre /espace.
 * La session Supabase est révoquée (l'app garde ses propres cookies).
 */
export async function GET(request: NextRequest) {
  const urlRequete = new URL(request.url)
  const base = `${urlRequete.protocol}//${urlRequete.host}`
  const finalite = urlRequete.searchParams.get('finalite')
  const versEchec =
    finalite === 'connexion' ? `${base}/login?google=erreur` : `${base}/demande-acces?google=erreur`

  const code = urlRequete.searchParams.get('code')
  if (!code) return NextResponse.redirect(versEchec)

  try {
    const supabase = await creerSupabaseRoute()
    const { error: erreurEchange } = await supabase.auth.exchangeCodeForSession(code)
    if (erreurEchange) return NextResponse.redirect(versEchec)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const courriel = user?.email?.trim().toLowerCase()
    const identifiant = user?.id
    await supabase.auth.signOut()
    if (!courriel || !identifiant) return NextResponse.redirect(versEchec)

    const nomBrut =
      user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? courriel.split('@')[0]
    const nom = String(nomBrut).slice(0, 80)

    const compte = await obtenirOuCreerApplication(identifiant, courriel, nom)
    const reponse = NextResponse.redirect(`${base}/espace`)
    poserCookieSessionClient(reponse, compte.applicationId)
    return reponse
  } catch {
    return NextResponse.redirect(versEchec)
  }
}
