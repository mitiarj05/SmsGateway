import { supabaseAdmin } from './supabase-serveur'
import { STATUT_TACHE } from './statuts'

/**
 * Facturation par client : 1 SMS facturé = 1 tâche créée dans le mois
 * (quel que soit son statut final), + recus compté à part.
 * Table `facturation` recalculée paresseusement à chaque lecture dashboard.
 */

/** Mois courant au format 'AAAA-MM'. */
export function moisActuel(): string {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`
}

/** Début du mois (ISO) pour filtrer les créations. */
export function debutMoisIso(mois: string): string {
  const [annee, numero] = mois.split('-').map(Number)
  return new Date(Date.UTC(annee, numero - 1, 1)).toISOString()
}

/** Unités facturables du mois pour un client (tâches créées). */
export async function compterEnvoisMois(idApplication: string, mois: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('tache')
    .select('id', { count: 'exact', head: true })
    .eq('id_client', idApplication)
    .gte('date_creation', debutMoisIso(mois))
  return count ?? 0
}

export interface LigneFacturation {
  id_client: string
  nom: string
  mois: string
  total_facture: number
  sms_envoye: number
  sms_recu: number
  echec: number
}

/** Recalcule la facturation du mois (tous clients) puis la retourne. */
export async function lireFacturation(mois: string): Promise<LigneFacturation[]> {
  const debut = debutMoisIso(mois)
  const { data: applications } = await supabaseAdmin
    .from('client')
    .select('id, nom')
    .order('nom', { ascending: true })

  const lignes: LigneFacturation[] = []
  for (const app of applications ?? []) {
    const [total, envoyes, echecs, recus] = await Promise.all([
      compterEnvoisMois(app.id, mois),
      supabaseAdmin.from('tache').select('id', { count: 'exact', head: true })
        .eq('id_client', app.id).eq('statut', STATUT_TACHE.ENVOYE).gte('date_creation', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('tache').select('id', { count: 'exact', head: true })
        .eq('id_client', app.id).eq('statut', STATUT_TACHE.ECHOUE).gte('date_creation', debut)
        .then((r) => r.count ?? 0),
      supabaseAdmin.from('reponse').select('id', { count: 'exact', head: true })
        .eq('id_client', app.id).gte('date_reception', debut)
        .then((r) => r.count ?? 0),
    ])
    await supabaseAdmin.from('facturation').upsert(
      {
        id_client: app.id, mois, sms_envoye: envoyes,
        sms_recu: recus, echec: echecs, date_modification: new Date().toISOString(),
      },
      { onConflict: 'id_client,mois' }
    )
    lignes.push({
      id_client: app.id, nom: app.nom, mois,
      total_facture: total,
      sms_envoye: envoyes, sms_recu: recus, echec: echecs,
    })
  }
  return lignes
}
