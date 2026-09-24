import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * GET /api/inbox — boîte de réception des SMS entrants (admin).
 * Query : application=<uuid> (optionnel), limit (défaut 100, max 200).
 */
export async function GET(request: NextRequest) {
  try {
    const parametres = request.nextUrl.searchParams
    const application = parametres.get('application')
    const limite = Math.min(200, Math.max(1, Number(parametres.get('limit')) || 100))

    let requete = supabaseAdmin
      .from('reponses')
      .select(
        'id, expediteur, contenu, date_reception, statut_notification, ' +
        'tentatives_notification, date_creation, id_application, id_appareil, ' +
        'applications(nom), appareils(nom)'
      )
      .order('date_reception', { ascending: false })
      .limit(limite)
    if (application) {
      requete = requete.eq('id_application', application)
    }

    const { data, error } = await requete
    if (error) {
      console.error('[api/inbox] Supabase:', error.message, '| details:', error.details, '| hint:', error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ entrants: data ?? [] })
  } catch (erreur) {
    console.error('[api/inbox] inattendue:', erreur)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
