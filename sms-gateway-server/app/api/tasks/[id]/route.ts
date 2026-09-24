import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { STATUT_TACHE } from '@/lib/statuts'

/** DELETE /api/tasks/[id] — annule une tâche EN_ATTENTE ou PROGRAMME */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: existant } = await supabaseAdmin
      .from('taches')
      .select('id, statut')
      .eq('id', id)
      .single()

    if (!existant) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    if (existant.statut !== STATUT_TACHE.EN_ATTENTE && existant.statut !== STATUT_TACHE.PROGRAMME) {
      return NextResponse.json(
        { error: `Impossible d'annuler une tâche ${existant.statut}` },
        { status: 409 }
      )
    }

    const { error } = await supabaseAdmin
      .from('taches')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tâche annulée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** PATCH /api/tasks/[id] — assignation manuelle (corps: { device_id: string | null }) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const corps = await request.json()
    const { device_id } = corps

    const donneesMaj: Record<string, unknown> = {
      date_modification: new Date().toISOString(),
    }

    if (device_id) {
      // Vérifier que l'appareil existe
      const { data: appareil } = await supabaseAdmin
        .from('appareils')
        .select('id')
        .eq('id', device_id)
        .single()
      if (!appareil) {
        return NextResponse.json({ error: 'Appareil introuvable' }, { status: 404 })
      }
      donneesMaj.id_appareil = device_id
      donneesMaj.statut = STATUT_TACHE.RECLAME
      donneesMaj.reclave_a = new Date().toISOString()
    } else {
      donneesMaj.id_appareil = null
      donneesMaj.statut = STATUT_TACHE.EN_ATTENTE
      donneesMaj.reclave_a = null
    }

    const { data, error } = await supabaseAdmin
      .from('taches')
      .update(donneesMaj)
      .eq('id', id)
      .select('id, numero_destinataire, contenu, statut, id_appareil')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Tâche assignée', task: data })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** POST /api/tasks/[id]/retry — recrée une tâche EN_ATTENTE depuis une ECHOUE */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('taches')
      .select('id, numero_destinataire, contenu, statut, id_application')
      .eq('id', id)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }
    if (existant.statut !== STATUT_TACHE.ECHOUE) {
      return NextResponse.json(
        { error: `Seules les tâches ECHOUE peuvent être relancées (${existant.statut})` },
        { status: 409 }
      )
    }

    const { data: cree, error } = await supabaseAdmin
      .from('taches')
      .insert({
        numero_destinataire: existant.numero_destinataire,
        contenu: existant.contenu,
        statut: STATUT_TACHE.EN_ATTENTE,
        id_application: existant.id_application,
      })
      .select('id, numero_destinataire, contenu, statut, date_creation')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tâche relancée', task: cree }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
