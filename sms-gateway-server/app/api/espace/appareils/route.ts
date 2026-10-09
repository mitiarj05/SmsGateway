import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'

/**
 * GET /api/espace/appareils — parc d'envoi visible du client connecté.
 * Les appareils forment un parc mutualisé : le client y voit l'état
 * (pas les secrets) pour comprendre par où partent ses SMS.
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    await marquerAppareilsInactifs()
    const { data, error } = await supabaseAdmin
      .from('appareils')
      .select('id, nom, statut, derniere_activite, date_creation')
      .order('statut', { ascending: false })
      .order('derniere_activite', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const appareils = await Promise.all(
      (data ?? []).map(async (d) => ({
        id: d.id,
        nom: d.nom,
        statut: d.statut,
        sms_last_hour: await obtenirUsageAppareil(d.id),
        derniere_activite: d.derniere_activite,
        created_at: d.date_creation,
      }))
    )
    return NextResponse.json({ appareils })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
