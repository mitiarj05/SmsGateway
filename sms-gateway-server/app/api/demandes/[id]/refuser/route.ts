import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/** POST /api/demandes/[id]/refuser — refuse la demande (admin). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data } = await supabaseAdmin
      .from('demandes')
      .update({ statut: 'REFUSEE', date_traitement: new Date().toISOString() })
      .eq('id', id)
      .eq('statut', 'EN_ATTENTE')
      .select('id')
      .single()
    if (!data) {
      return NextResponse.json({ error: 'Demande introuvable ou déjà traitée' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Demande refusée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
