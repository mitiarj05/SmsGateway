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
      .select('id, expediteur, contenu, date_reception, statut_notification, date_creation, lu, appareils(nom)')
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

/**
 * PATCH /api/espace/entrees — « marquer comme lu ».
 * Corps : { ids: [...] } pour des messages précis, { tout: true } pour la boîte entière.
 * Toujours scopé à l'application du client connecté.
 */
export async function PATCH(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => ({})) as { ids?: string[]; tout?: boolean }
    let requete = supabaseAdmin.from('reponses').update({ lu: true }).eq('id_application', idApplication)
    if (!corps.tout) {
      const ids = Array.isArray(corps.ids) ? corps.ids.filter((i) => typeof i === 'string') : []
      if (ids.length === 0) {
        return NextResponse.json({ error: 'Ni ids, ni tout' }, { status: 400 })
      }
      requete = requete.in('id', ids)
    }
    const { data, error } = await requete.select('id')
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ lus: data?.length ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
