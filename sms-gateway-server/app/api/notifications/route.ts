import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * GET /api/notifications — journal des envois (admin).
 * Query : application=<uuid> (optionnel), limit (défaut 20, max 100).
 */
export async function GET(request: NextRequest) {
  try {
    const parametres = request.nextUrl.searchParams
    const application = parametres.get('application')
    const limite = Math.min(100, Math.max(1, Number(parametres.get('limit')) || 20))

    let requete = supabaseAdmin
      .from('rappels')
      .select(
        'id, id_application, type_evenement, statut, tentatives, ' +
        'dernier_code_http, prochaine_tentative, date_creation, applications(nom)'
      )
      .order('date_creation', { ascending: false })
      .limit(limite)
    if (application) {
      requete = requete.eq('id_application', application)
    }

    const { data, error } = await requete
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ envois: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
