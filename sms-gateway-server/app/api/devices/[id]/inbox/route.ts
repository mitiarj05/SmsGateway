import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'
import { normaliserNumero, resoudreClientEntrant } from '@/lib/entrant'
import { enfilerNotification, traiterNotificationsEnAttente } from '@/lib/notifications'

/**
 * POST /api/devices/[id]/inbox — le téléphone transfère un SMS reçu.
 * Auth : Bearer jeton de l'appareil (route publique, comme le polling).
 * Corps: { expediteur: string, contenu: string, date_reception?: string ISO }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idAppareil } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
        { status: 401 }
      )
    }
    const jeton = authHeader.substring(7)

    const appareil = await authentifierAppareil(idAppareil, jeton)
    if (!appareil) {
      return NextResponse.json(
        { error: 'Appareil inconnu ou token invalide' },
        { status: 401 }
      )
    }

    const corps = await request.json().catch(() => null)
    const expediteur = typeof corps?.expediteur === 'string'
      ? normaliserNumero(corps.expediteur)
      : ''
    const contenu = typeof corps?.contenu === 'string' ? corps.contenu : ''
    if (!expediteur || !contenu) {
      return NextResponse.json(
        { error: 'Les champs "expediteur" et "contenu" sont obligatoires' },
        { status: 400 }
      )
    }
    let dateReception = new Date().toISOString()
    if (typeof corps?.date_reception === 'string') {
      const d = new Date(corps.date_reception)
      if (!Number.isNaN(d.getTime())) dateReception = d.toISOString()
    }

    const { data: entrant, error } = await supabaseAdmin
      .from('reponses')
      .insert({
        id_appareil: idAppareil,
        expediteur,
        contenu,
        date_reception: dateReception,
      })
      .select('id')
      .single()
    if (error || !entrant) {
      console.error('inbox: insertion impossible', error?.message)
      return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
    }

    // Routage vers le client concerné (corrélation, SIM dédiée, sinon dashboard seul).
    const resolution = await resoudreClientEntrant(expediteur, idAppareil)
    if (resolution.idApplication) {
      await supabaseAdmin
        .from('reponses')
        .update({ id_application: resolution.idApplication })
        .eq('id', entrant.id)
    }

    // Notification (mise en file seulement si le client est éligible).
    const idCharge = await enfilerNotification(resolution.idApplication, 'sms.recu', {
      id_reponse: entrant.id,
      expediteur,
      contenu,
      date_reception: dateReception,
      id_appareil: idAppareil,
      id_application: resolution.idApplication,
      source_routage: resolution.source,
    })
    await traiterNotificationsEnAttente()

    return NextResponse.json(
      {
        message: 'SMS entrant enregistré',
        entrant: { id: entrant.id, id_application: resolution.idApplication },
        notification: idCharge ? 'en_file' : 'non_configuré',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
