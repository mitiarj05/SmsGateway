import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'

/** GET /api/espace/entrees — SMS reçus du client connecté uniquement. */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const limite = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 100))
    const { data, error } = await supabaseAdmin
      .from('reponses')
      .select('id, expediteur, contenu, date_reception, statut_notification, date_creation, appareils(nom)')
      .eq('id_application', idApplication)
      .order('date_reception', { ascending: false })
      .limit(limite)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ entrants: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
