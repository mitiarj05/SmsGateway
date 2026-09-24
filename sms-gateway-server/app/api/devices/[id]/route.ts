import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'
import { STATUT_APPAREIL } from '@/lib/statuts'

/** GET /api/devices/[id] — détails d'un appareil */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await marquerAppareilsInactifs()
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('appareils')
      .select('id, nom, statut, jeton_fcm, sms_envoyes_heure, derniere_activite, date_creation')
      .eq('id', id)
      .single()

    if (error) {
      console.error('GET /api/devices/[id] erreur Supabase:', error)
      return NextResponse.json({ error: 'Appareil introuvable', details: error.message }, { status: 404 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Appareil introuvable' }, { status: 404 })
    }

    // Masquer le token FCM pour la sécurité (garder 8 premiers caractères).
    // Contrat UI : objet explicite (jamais de spread — ni jeton auth,
    // ni jeton_fcm complet, created_at mappée depuis date_creation).
    const masque = data.jeton_fcm
      ? `${data.jeton_fcm.substring(0, 8)}... (${data.jeton_fcm.length} chars)`
      : null

    // Compteur live (voir GET /api/devices).
    const smsDerniereHeure = await obtenirUsageAppareil(id)

    return NextResponse.json({ device: {
      id: data.id,
      nom: data.nom,
      statut: data.statut,
      sms_last_hour: smsDerniereHeure,
      fcm_token: masque,
      fcm_present: !!data.jeton_fcm,
      derniere_activite: data.derniere_activite,
      created_at: data.date_creation,
    } })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** PATCH /api/devices/[id] — activer/désactiver (corps: { statut: "DESACTIVE" | "HORS_LIGNE" }) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const corps = await request.json()
    const { statut } = corps

    if (![STATUT_APPAREIL.DESACTIVE, STATUT_APPAREIL.HORS_LIGNE].includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide (DESACTIVE | HORS_LIGNE)' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('appareils')
      .update({ statut })
      .eq('id', id)
      .select('id, nom, statut')
      .single()

    if (error) {
      console.error('PATCH /api/devices/[id] erreur Supabase:', error)
      return NextResponse.json({ error: 'Appareil introuvable', details: error.message }, { status: 404 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Appareil introuvable' }, { status: 404 })
    }

    return NextResponse.json({ device: data })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** DELETE /api/devices/[id] — supprime un appareil (+ détache ses tâches) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('appareils')
      .select('id, nom')
      .eq('id', id)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json({ error: 'Appareil introuvable' }, { status: 404 })
    }

    // Détacher les tâches liées (clé étrangère) en gardant l'historique.
    const { error: erreurDetachement } = await supabaseAdmin
      .from('messages')
      .update({ id_appareil: null })
      .eq('id_appareil', id)

    if (erreurDetachement) {
      return NextResponse.json({ error: erreurDetachement.message }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('appareils')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Appareil supprimé', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
