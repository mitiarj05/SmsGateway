import { supabaseAdmin } from './supabase-serveur'
import { obtenirParametreEntier } from './parametres'
import { marquerAppareilsInactifs } from './statut-appareil'
import { STATUT_APPAREIL, STATUT_TACHE } from './statuts'

export interface AppareilCandidat {
  id: string
  nom: string
  jeton_fcm: string
  /** Envoyés + en cours d'envoi sur la dernière heure (voir obtenirUsageAppareil). */
  sms_derniere_heure: number
}

export interface DisponibiliteAppareil {
  appareil: AppareilCandidat | null
  /** true = des appareils existent mais tous ont atteint le quota. */
  sature: boolean
  quota: number
  /** Secondes avant qu'une place se libère (0 si non saturé). */
  delaiAttenteSecondes: number
}

function ilYaUneHeureIso(): string {
  return new Date(Date.now() - 60 * 60 * 1000).toISOString()
}

/**
 * Usage horaire d'un appareil = SMS envoyés (ENVOYE) + en cours d'envoi (RECLAME)
 * sur la dernière heure. Compter les en-cours empêche les rafales rapprochées
 * de contourner le quota : un SMS pas encore confirmé consomme déjà du quota.
 */
export async function obtenirUsageAppareil(idAppareil: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('taches')
    .select('id', { count: 'exact', head: true })
    .eq('id_appareil', idAppareil)
    .in('statut', [STATUT_TACHE.ENVOYE, STATUT_TACHE.RECLAME])
    .gte('date_modification', ilYaUneHeureIso())

  return count ?? 0
}

/** Délai avant libération d'une place pour UN appareil (0 si sous le quota). */
export async function obtenirDelaiAttenteSecondes(idAppareil: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('taches')
    .select('date_modification')
    .eq('id_appareil', idAppareil)
    .in('statut', [STATUT_TACHE.ENVOYE, STATUT_TACHE.RECLAME])
    .gte('date_modification', ilYaUneHeureIso())
    .order('date_modification', { ascending: true })
    .limit(1)
  const plusAncien = data?.[0]?.date_modification ?? null
  if (!plusAncien) return 60
  return Math.max(1, Math.ceil((new Date(plusAncien).getTime() + 3600_000 - Date.now()) / 1000))
}

/** Plus ancienne activité comptée -> délai avant libération d'une place. */
async function calculerDelaiAttente(idsAppareils: string[], extraIso: string | null): Promise<number> {
  let plusAncien: string | null = extraIso
  if (idsAppareils.length > 0) {
    const { data } = await supabaseAdmin
      .from('taches')
      .select('date_modification')
      .in('id_appareil', idsAppareils)
      .in('statut', [STATUT_TACHE.ENVOYE, STATUT_TACHE.RECLAME])
      .gte('date_modification', ilYaUneHeureIso())
      .order('date_modification', { ascending: true })
      .limit(1)
    const ts = data?.[0]?.date_modification ?? null
    if (ts && (!plusAncien || ts < plusAncien)) plusAncien = ts
  }
  if (!plusAncien) return 60
  return Math.max(1, Math.ceil((new Date(plusAncien).getTime() + 3600_000 - Date.now()) / 1000))
}

export async function obtenirDisponibiliteAppareil(): Promise<DisponibiliteAppareil> {
  const quota = await obtenirParametreEntier('sms_quota_per_hour')

  // Les appareils morts ne doivent ni être sélectionnés ni recevoir de push.
  await marquerAppareilsInactifs()

  const { data: appareils, error: erreurAppareils } = await supabaseAdmin
    .from('appareils')
    .select('id, nom, jeton_fcm')
    .eq('statut', STATUT_APPAREIL.EN_LIGNE)
    .not('jeton_fcm', 'is', null)

  if (erreurAppareils || !appareils || appareils.length === 0) {
    return { appareil: null, sature: false, quota, delaiAttenteSecondes: 0 }
  }

  // Pression globale : les EN_ATTENTE non assignés consommeront du quota sous peu.
  // Hypothèse conservative : elles iront à l'appareil le moins chargé.
  const { data: enAttente } = await supabaseAdmin
    .from('taches')
    .select('date_creation')
    .eq('statut', STATUT_TACHE.EN_ATTENTE)
    .is('id_appareil', null)
  const compteEnAttente = enAttente?.length ?? 0
  const plusAncienneEnAttente = (enAttente ?? []).reduce<string | null>(
    (min, m) => (!min || m.date_creation < min ? m.date_creation : min),
    null
  )

  const classes: { candidat: AppareilCandidat; usage: number }[] = []
  for (const appareil of appareils) {
    const usage = await obtenirUsageAppareil(appareil.id)
    if (usage < quota) {
      classes.push({
        candidat: {
          id: appareil.id,
          nom: appareil.nom,
          jeton_fcm: appareil.jeton_fcm,
          sms_derniere_heure: usage,
        },
        usage,
      })
    }
  }
  classes.sort((a, b) => a.usage - b.usage)

  const idsEnLigne = appareils.map((a) => a.id)
  if (classes.length === 0) {
    console.warn(`quota: tous les appareils saturés (${quota}/h)`)
    return {
      appareil: null,
      sature: true,
      quota,
      delaiAttenteSecondes: await calculerDelaiAttente(idsEnLigne, plusAncienneEnAttente),
    }
  }

  const meilleur = classes[0]
  if (meilleur.usage + compteEnAttente >= quota) {
    console.warn(`quota: file d'attente saturée (${meilleur.usage} en cours + ${compteEnAttente} EN_ATTENTE, quota ${quota}/h)`)
    return {
      appareil: null,
      sature: true,
      quota,
      delaiAttenteSecondes: await calculerDelaiAttente(idsEnLigne, plusAncienneEnAttente),
    }
  }

  return { appareil: meilleur.candidat, sature: false, quota, delaiAttenteSecondes: 0 }
}

/** Compat : meilleur appareil ou null (indisponible OU saturé, sans distinction). */
export async function selectionnerMeilleurAppareil(): Promise<AppareilCandidat | null> {
  const { appareil } = await obtenirDisponibiliteAppareil()
  return appareil
}
