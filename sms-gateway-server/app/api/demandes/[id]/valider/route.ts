import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { envoyerCourriel, estAdresseCourriel, texteCleApi } from '@/lib/courriel'
import { urlPublique } from '@/lib/liens'

/**
 * POST /api/demandes/[id]/valider — crée le client API (admin).
 * Génère la clé (retournée UNE SEULE FOIS) + quota de départ prudent (100/mois).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: demande } = await supabaseAdmin
      .from('demandes')
      .select('id, nom, contact, statut')
      .eq('id', id)
      .single()
    if (!demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }
    if (demande.statut !== 'EN_ATTENTE') {
      return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 409 })
    }

    const cle_api = `cle_${randomBytes(16).toString('hex')}`
    const { data: client, error } = await supabaseAdmin
      .from('applications')
      .insert({ nom: demande.nom, cle_api, quota_mensuel: 100 })
      .select('id, nom, cle_api, date_creation')
      .single()
    if (error || !client) {
      return NextResponse.json({ error: error?.message ?? 'Erreur création' }, { status: 500 })
    }
    await supabaseAdmin
      .from('demandes')
      .update({ statut: 'VALIDEE', date_traitement: new Date().toISOString() })
      .eq('id', id)

    // Envoi réel de la clé par e-mail si le contact en est un
    // (sinon : transmission manuelle via le dashboard, inchangée).
    let courrielEnvoye = false
    const contact = (demande as { contact?: string }).contact ?? ''
    if (estAdresseCourriel(contact)) {
      courrielEnvoye = await envoyerCourriel(
        contact.trim(),
        'Votre clé API SMSTSIKA',
        texteCleApi(demande.nom, cle_api, `${urlPublique()}/espace/login`)
      )
    }

    return NextResponse.json(
      {
        message: courrielEnvoye
          ? 'Client créé — clé envoyée par e-mail'
          : 'Client créé — copiez sa clé maintenant',
        client,
        courriel_envoye: courrielEnvoye,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
