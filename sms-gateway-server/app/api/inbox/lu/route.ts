import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * POST /api/inbox/lu — « marquer comme lu » côté console d'administration
 * (toutes applications). Corps : { ids: [...] } pour des messages précis,
 * { tout: true } pour toute la boîte.
 */
export async function POST(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => ({})) as { ids?: string[]; tout?: boolean }
    let requete = supabaseAdmin.from('reponses').update({ lu: true })
    if (!corps.tout) {
      const ids = Array.isArray(corps.ids) ? corps.ids.filter((i) => typeof i === 'string') : []
      if (ids.length === 0) {
        return NextResponse.json({ error: 'Ni ids, ni tout' }, { status: 400 })
      }
      requete = requete.in('id', ids)
    }
    const { data, error } = await requete.select('id')
    if (error) {
      console.error('[api/inbox/lu] Supabase:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ lus: data?.length ?? 0 })
  } catch (erreur) {
    console.error('[api/inbox/lu] inattendue:', erreur)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
