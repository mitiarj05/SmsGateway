import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'

/**
 * GET /api/espace/appareils — parc d'envoi DU client connecté.
 * Modèle individuel : seuls les appareils liés à SON application.
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    await marquerAppareilsInactifs()
    const { data, error } = await supabaseAdmin
      .from('appareil')
      .select('*')
      .eq('id_client', idApplication)
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
        fcm_present: Boolean(d.jeton_fcm || d.fcm_token),
        fcm_token: d.jeton_fcm || d.fcm_token || null,
        solde_sim: d.solde_sim ?? null,
        solde_devise: d.solde_devise ?? null,
        solde_texte: d.solde_texte ?? null,
        solde_maj_le: d.solde_maj_le ?? null,
        supprimable: true,
      }))
    )
    return NextResponse.json({ appareils })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
