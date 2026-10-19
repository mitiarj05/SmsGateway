import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'

export async function GET() {
  try {
    await marquerAppareilsInactifs()
    // select('*') volontaire : les colonnes de solde SIM peuvent ne pas exister
    // encore (migration non exécutée). Les nommer ferait échouer toute la page
    // des appareils ; le mapping ci-dessous reste explicite, donc rien de
    // sensible (jeton) ne sort de ce route handler.
    const { data, error } = await supabaseAdmin
      .from('appareils')
      .select('*')
      .order('statut', { ascending: false })
      .order('derniere_activite', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Compteur live : la colonne est persistée à chaque ENVOYE mais peut dater
    // de plus d'1 h — on recalcule sur la fenêtre glissante pour l'affichage.
    // Contrat UI (devices, devices/add) : fcm_token masqué + created_at mappée.
    const appareils = await Promise.all(
      (data ?? []).map(async (d) => ({
        id: d.id,
        nom: d.nom,
        statut: d.statut,
        sms_last_hour: await obtenirUsageAppareil(d.id),
        fcm_token: d.jeton_fcm ? `${d.jeton_fcm.substring(0, 8)}...` : null,
        fcm_present: !!d.jeton_fcm,
        derniere_activite: d.derniere_activite,
        created_at: d.date_creation,
        // Relevé du solde SIM (code USSD) — null tant qu'aucun relevé n'existe.
        solde_sim: d.solde_sim ?? null,
        solde_devise: d.solde_devise ?? null,
        solde_texte: d.solde_texte ?? null,
        solde_maj_le: d.solde_maj_le ?? null,
      }))
    )

    return NextResponse.json({ devices: appareils })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
