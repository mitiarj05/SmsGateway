import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'

/**
 * GET /api/espace/liens — liens intelligents du client + leurs clics.
 * Query : limit (défaut 100, max 200).
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const limite = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 100))
    const { data, error } = await supabaseAdmin
      .from('liens')
      .select('id, numero_destinataire, statut, date_creation, date_clic')
      .eq('id_application', idApplication)
      .order('date_creation', { ascending: false })
      .limit(limite)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ liens: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
