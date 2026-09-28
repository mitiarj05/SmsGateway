import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { lireSessionClient } from '@/lib/session-client'

/**
 * GET /api/espace/automatismes — règles du client (+ globales visibles).
 * POST — crée une règle FORCÉMENT rattachée au client (pas de global côté client).
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin
      .from('automatismes')
      .select('id, mot_cle, reponse, actif, id_application, date_creation')
      .or(`id_application.eq.${idApplication},id_application.is.null`)
      .order('date_creation', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ regles: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => null)
    const motCle = typeof corps?.mot_cle === 'string' ? corps.mot_cle.trim().toUpperCase() : ''
    const reponse = typeof corps?.reponse === 'string' ? corps.reponse.trim() : ''
    if (!motCle || !reponse) {
      return NextResponse.json(
        { error: 'Les champs "mot_cle" et "reponse" sont obligatoires' },
        { status: 400 }
      )
    }
    const { data, error } = await supabaseAdmin
      .from('automatismes')
      .insert({ mot_cle: motCle, reponse, id_application: idApplication })
      .select('id, mot_cle, reponse, actif, id_application')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Erreur création' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Règle créée', regle: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
