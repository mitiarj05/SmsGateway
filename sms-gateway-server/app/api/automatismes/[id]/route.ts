import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * PATCH /api/automatismes/[id] — active/désactive { actif: boolean }.
 * DELETE /api/automatismes/[id] — supprime la règle.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const corps = await request.json().catch(() => null)
    if (typeof corps?.actif !== 'boolean') {
      return NextResponse.json({ error: 'Le champ "actif" doit être un booléen' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('automatismes')
      .update({ actif: corps.actif })
      .eq('id', id)
      .select('id, mot_cle, reponse, actif, id_application')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Règle introuvable' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Règle mise à jour', regle: data })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabaseAdmin
      .from('automatismes')
      .delete()
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: 'Règle supprimée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
