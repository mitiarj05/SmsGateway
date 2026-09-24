import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'
import { STATUT_APPAREIL } from '@/lib/statuts'

/**
 * POST /api/appareils/[id]/offline — le téléphone signale son arrêt
 * (bouton Déconnecter, service tué). Auth : Bearer token de l'appareil.
 * Met HORS_LIGNE, jamais DESACTIVE (réservé à l'admin).
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

    if (appareil.statut === STATUT_APPAREIL.DESACTIVE) {
      return NextResponse.json({ device: { id: idAppareil, statut: STATUT_APPAREIL.DESACTIVE } })
    }

    const { error } = await supabaseAdmin
      .from('appareils')
      .update({
        statut: STATUT_APPAREIL.HORS_LIGNE,
        derniere_activite: new Date().toISOString(),
      })
      .eq('id', idAppareil)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ device: { id: idAppareil, statut: STATUT_APPAREIL.HORS_LIGNE } })
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
