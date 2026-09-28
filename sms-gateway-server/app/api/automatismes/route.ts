import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * GET /api/automatismes — règles mot-clé (admin).
 * POST /api/automatismes — crée une règle { mot_cle, reponse, id_application? }.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('automatismes')
      .select('id, mot_cle, reponse, actif, id_application, date_creation, applications(nom)')
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
    const corps = await request.json().catch(() => null)
    const motCle = typeof corps?.mot_cle === 'string' ? corps.mot_cle.trim().toUpperCase() : ''
    const reponse = typeof corps?.reponse === 'string' ? corps.reponse.trim() : ''
    const idApplication = corps?.id_application ?? null
    if (!motCle || !reponse) {
      return NextResponse.json(
        { error: 'Les champs "mot_cle" et "reponse" sont obligatoires' },
        { status: 400 }
      )
    }
    if (idApplication) {
      const { data: app } = await supabaseAdmin
        .from('applications').select('id').eq('id', idApplication).single()
      if (!app) {
        return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
      }
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
