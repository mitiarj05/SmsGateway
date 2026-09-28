import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * GET /api/blocages — numéros désinscrits (admin).
 * Query : application=<uuid> (optionnel), limit (défaut 100, max 500).
 * DELETE /api/blocages/[id] — réinscrit (supprime le blocage).
 */
export async function GET(request: NextRequest) {
  try {
    const parametres = request.nextUrl.searchParams
    const application = parametres.get('application')
    const limite = Math.min(500, Math.max(1, Number(parametres.get('limit')) || 100))
    let requete = supabaseAdmin
      .from('blocages')
      .select('id, numero_destinataire, motif, id_application, date_creation, applications(nom)')
      .order('date_creation', { ascending: false })
      .limit(limite)
    if (application) {
      requete = requete.eq('id_application', application)
    }
    const { data, error } = await requete
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ blocages: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
