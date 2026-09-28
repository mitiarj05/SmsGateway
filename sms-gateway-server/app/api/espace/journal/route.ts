import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { lireSessionClient } from '@/lib/session-client'

/** GET /api/espace/journal — 20 derniers envois du client connecté. */
export async function GET(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, type_evenement, statut, tentatives, dernier_code_http, date_creation')
      .eq('id_application', idApplication)
      .order('date_creation', { ascending: false })
      .limit(20)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ envois: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
