import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { lireSessionClient } from '@/lib/session-client'
import { compterEnvoisMois, moisActuel } from '@/lib/facturation'
import { STATUT_TACHE } from '@/lib/statuts'

/**
 * GET /api/espace/moi — profil + quota + mini-stats du client connecté.
 * Tout est filtré par id_application issu de la session (401 sinon).
 */
export async function GET(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, nom, quota_mensuel')
      .eq('id', idApplication)
      .single()
    if (!app) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }
    const mois = moisActuel()
    const [utiliseMois, envoyes, attente, echoue, recus] = await Promise.all([
      compterEnvoisMois(idApplication, mois),
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', STATUT_TACHE.ENVOYE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', STATUT_TACHE.EN_ATTENTE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('taches').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication).eq('statut', STATUT_TACHE.ECHOUE)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('reponses').select('id', { count: 'exact', head: true })
        .eq('id_application', idApplication)
        .then((r) => r.count ?? 0),
    ])
    const quota = (app as { quota_mensuel: number | null }).quota_mensuel ?? null
    return NextResponse.json({
      id: app.id,
      nom: app.nom,
      mois,
      quota_mensuel: quota,
      utilise_mois: utiliseMois,
      depassement: quota !== null && utiliseMois >= quota,
      stats: { envoyes, attente, echoue, recus },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
