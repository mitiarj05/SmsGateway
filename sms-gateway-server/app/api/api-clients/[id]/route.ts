import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/** DELETE /api/api-clients/[id] — révoque une clé API */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('id', id)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
    }

    // Détacher les tâches liées (clé étrangère) en gardant l'historique.
    const { error: erreurDetachement } = await supabaseAdmin
      .from('messages')
      .update({ id_application: null })
      .eq('id_application', id)

    if (erreurDetachement) {
      return NextResponse.json({ error: erreurDetachement.message }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Clé révoquée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
