import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'

export async function GET() {
  try {
    await marquerAppareilsInactifs()
    const { data, error } = await supabaseAdmin
      .from('appareils')
      .select('id, nom, statut, jeton_fcm, sms_envoyes_heure, derniere_activite, date_creation')
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
      }))
    )

    return NextResponse.json({ devices: appareils })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
