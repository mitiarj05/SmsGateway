import { NextRequest, NextResponse } from 'next/server'
import { creerSupabaseRoute } from '@/lib/supabase-route'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import {
  creerValeurSessionClient,
  COOKIE_CLIENT,
  DUREE_SESSION_CLIENT_SECONDES,
} from '@/lib/session-client'

/**
 * GET /api/auth/google/retour — callback OAuth Google (Supabase Auth).
 * Publique (hors matcher du proxy).
 *
 * 1. Échange le `code` contre une session, lit l'e-mail vérifié Google.
 * 2. Respecte le circuit de validation existant :
 *    - demande VALIDEE pour cet e-mail → l'utilisateur a déjà sa clé,
 *      on le renvoie vers la connexion client ;
 *    - demande EN_ATTENTE → on l'en informe, sans doublon ;
 *    - sinon → on crée la demande (e-mail vérifié par Google).
 * 3. Révoque la session Supabase (l'app garde ses propres cookies) puis
 *    redirige vers /demande-acces?google=<etat> pour affichage.
 */
export async function GET(request: NextRequest) {
  const urlRequete = new URL(request.url)
  const base = `${urlRequete.protocol}//${urlRequete.host}`
  const finalite = urlRequete.searchParams.get('finalite')
  const redirection = (etat: string) =>
    NextResponse.redirect(`${base}/demande-acces?google=${etat}`)
  const redirectionLogin = (etat: string) =>
    NextResponse.redirect(`${base}/login?google=${etat}`)

  const code = urlRequete.searchParams.get('code')
  if (!code) return finalite === 'connexion' ? redirectionLogin('erreur') : redirection('erreur')

  try {
    const supabase = await creerSupabaseRoute()
    const { error: erreurEchange } = await supabase.auth.exchangeCodeForSession(code)
    if (erreurEchange) return finalite === 'connexion' ? redirectionLogin('erreur') : redirection('erreur')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const courriel = user?.email?.trim().toLowerCase()
    await supabase.auth.signOut()
    if (!courriel) return finalite === 'connexion' ? redirectionLogin('erreur') : redirection('erreur')

    // Connexion d'un client existant : session directe vers /espace.
    // L'OAuth prouve la propriété de l'e-mail ; on le relie à son
    // application via sa demande VALIDEE (même nom, la plus récente).
    if (finalite === 'connexion') {
      const { data: demandes } = await supabaseAdmin
        .from('demandes')
        .select('id, nom')
        .ilike('contact', courriel)
        .eq('statut', 'VALIDEE')
        .order('date_creation', { ascending: false })
        .limit(1)
      const demandeValidee = demandes?.[0]
      if (!demandeValidee) return redirectionLogin('compte-introuvable')
      const { data: applications } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('nom', demandeValidee.nom)
        .order('date_creation', { ascending: false })
        .limit(1)
      const application = applications?.[0]
      if (!application) return redirectionLogin('application-introuvable')
      let valeur: string
      try {
        valeur = creerValeurSessionClient(application.id)
      } catch {
        return redirectionLogin('erreur')
      }
      const reponse = NextResponse.redirect(`${base}/espace`)
      reponse.cookies.set(COOKIE_CLIENT, valeur, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: DUREE_SESSION_CLIENT_SECONDES,
        secure: process.env.NODE_ENV === 'production',
      })
      return reponse
    }

    const nomBrut =
      user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? courriel.split('@')[0]
    const nom = String(nomBrut).slice(0, 80)

    const { data: existantes } = await supabaseAdmin
      .from('demandes')
      .select('id, statut')
      .ilike('contact', courriel)
      .order('date_creation', { ascending: false })
      .limit(1)
    const statutExistant = existantes?.[0]?.statut as string | undefined

    if (statutExistant === 'VALIDEE') return redirection('compte-existant')
    if (statutExistant === 'EN_ATTENTE') return redirection('demande-encours')

    const { error: erreurInsert } = await supabaseAdmin.from('demandes').insert({
      nom,
      contact: courriel,
      usage_prevu: 'Inscription via Google — usage à préciser avec l\u2019administrateur.',
    })
    if (erreurInsert) return redirection('erreur')
    return redirection('ok')
  } catch {
    return redirection('erreur')
  }
}
