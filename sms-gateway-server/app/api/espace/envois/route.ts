import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'

/**
 * GET /api/espace/envois — historique des envois du client connecté.
 * Query : statut (optionnel), limit (défaut 50, max 200).
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const parametres = request.nextUrl.searchParams
    const statut = parametres.get('statut')
    const limite = Math.min(200, Math.max(1, Number(parametres.get('limit')) || 50))
    let requete = supabaseAdmin
      .from('tache')
      // select('*') : tolère l'absence de la colonne `livraison` (migration non
      // encore exécutée) au lieu de casser tout l'historique du client.
      .select('*')
      .eq('id_application', idApplication)
      .order('date_creation', { ascending: false })
      .limit(limite)
    if (statut) {
      requete = requete.eq('statut', statut)
    }
    const { data, error } = await requete
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ taches: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
