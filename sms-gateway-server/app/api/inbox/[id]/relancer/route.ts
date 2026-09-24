import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { enfilerNotification, traiterNotificationsEnAttente } from '@/lib/notifications'

/**
 * POST /api/inbox/[id]/relancer — rejoue la notification sms.recu
 * d'un entrant (après correction de l'URL cliente, par exemple).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: entrant } = await supabaseAdmin
      .from('entrants')
      .select('id, id_application, id_appareil, expediteur, contenu, date_reception')
      .eq('id', id)
      .single()
    if (!entrant) {
      return NextResponse.json({ error: 'Entrant introuvable' }, { status: 404 })
    }
    if (!entrant.id_application) {
      return NextResponse.json(
        { error: 'Aucun client résolu pour cet entrant (visible dashboard uniquement)' },
        { status: 400 }
      )
    }
    const idCharge = await enfilerNotification(entrant.id_application, 'sms.recu', {
      id_reponse: entrant.id,
      expediteur: entrant.expediteur,
      contenu: entrant.contenu,
      date_reception: entrant.date_reception,
      id_appareil: entrant.id_appareil,
      id_application: entrant.id_application,
      relance_manuelle: true,
    })
    const resultat = await traiterNotificationsEnAttente()
    return NextResponse.json({
      message: idCharge ? 'Notification remise en file' : 'Client non éligible (URL/secret/abonnement)',
      notification: idCharge ? 'en_file' : 'non_configuré',
      ...resultat,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
