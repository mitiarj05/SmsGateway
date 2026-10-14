import { supabaseAdmin } from './supabase-serveur'
import { envoyerPushNouvelleTache } from './envoi-push'
import { obtenirDisponibiliteAppareil } from './selection-appareil'
import { expirerEnAttentePerimees } from './expiration-attente'
import { promouvoirProgrammes } from './programmes'
import { compterEnvoisMois, moisActuel } from './facturation'
import { STATUT_TACHE } from './statuts'

export interface ResultatEnvoi {
  statut: number
  corps: unknown
}

interface LigneCree {
  id: string
  numero_destinataire: string
  contenu: string
  statut: string
  programme_a: string | null
  date_creation: string
}

/**
 * Cœur d'envoi mutualisé (clé API ou session admin) : validation,
 * quotas, création des tâches, push, réponse. L'authentification
 * (qui a le droit, pour quel espace) reste à la charge de l'appelant.
 */
export async function traiterEnvoiSms(
  client: { id: string; nom: string },
  corps: any
): Promise<ResultatEnvoi> {
  const erreur = (message: string, statut: number, extra?: Record<string, unknown>) => ({
    statut,
    corps: { error: message, ...extra },
  })

  const { to, message } = corps ?? {}

  // 1. Validation — `to` : un numéro ou une liste (envoi groupé).
  const MAX_DESTINATAIRES = 100
  const destinatairesBruts = Array.isArray(to) ? to : [to]
  if (destinatairesBruts.length === 0 || destinatairesBruts.length > MAX_DESTINATAIRES) {
    return erreur(`Le champ "to" doit contenir entre 1 et ${MAX_DESTINATAIRES} destinataire(s)`, 400)
  }
  const indexInvalides: number[] = []
  const numeros = destinatairesBruts.map((r, i) => {
    if (typeof r !== 'string' || r.trim().length === 0) {
      indexInvalides.push(i)
      return ''
    }
    return r.trim()
  })
  if (indexInvalides.length > 0) {
    return erreur(`Numéro(s) invalide(s) aux position(s) : ${indexInvalides.join(', ')}`, 400)
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return erreur('Le champ "message" est obligatoire', 400)
  }

  // 2. Modèle individuel : sans téléphone lié, l'envoi est impossible.
  const { count: nbAppareils } = await supabaseAdmin
    .from('appareils')
    .select('id', { count: 'exact', head: true })
    .eq('id_application', client.id)
  if (!nbAppareils) {
    return erreur('Aucun téléphone lié à votre espace — associez-en un pour envoyer.', 400)
  }

  // 3. Quota mensuel du client (facturation) : refusé AVANT toute création.
  const { data: ficheClient } = await supabaseAdmin
    .from('applications')
    .select('quota_mensuel')
    .eq('id', client.id)
    .single()
  const quotaMensuel = (ficheClient as { quota_mensuel: number | null } | null)?.quota_mensuel ?? null
  if (quotaMensuel !== null) {
    const utiliseMois = await compterEnvoisMois(client.id, moisActuel())
    if (utiliseMois >= quotaMensuel) {
      return erreur(
        `Quota mensuel atteint (${utiliseMois}/${quotaMensuel} SMS). Contactez l'administrateur.`,
        429,
        { quota_mensuel: quotaMensuel, utilise_mois: utiliseMois }
      )
    }
  }

  // Expiration des EN_ATTENTE trop anciens + promotion des PROGRAMME
  // (ne bloquent jamais l'envoi)
  await expirerEnAttentePerimees()
  await promouvoirProgrammes()

  // Envoi différé : date ISO future (max 1 an). Ni quota ni push :
  // la tâche attend sa date, promue EN_ATTENTE à l'heure dite.
  let programmePour: Date | null = null
  if (corps?.scheduled_at) {
    const d = new Date(corps.scheduled_at)
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      return erreur('Le champ "scheduled_at" doit être une date ISO future', 400)
    }
    programmePour = d
  }

  // 4. Quota horaire : refuser AVANT de créer la tâche si tout est saturé.
  // Modèle individuel : seuls les appareils de CE client comptent.
  const disponibilite = programmePour ? null : await obtenirDisponibiliteAppareil(client.id)
  if (disponibilite?.sature) {
    return erreur(
      `Quota SMS/heure atteint (${disponibilite.quota}/h/appareil). Réessayez dans ~${disponibilite.delaiAttenteSecondes}s.`,
      429,
      { quota: disponibilite.quota, retry_after_seconds: disponibilite.delaiAttenteSecondes }
    )
  }

  // 5. Créer une tâche par destinataire (envoi groupé).
  const { data, error } = await supabaseAdmin
    .from('taches')
    .insert(
      numeros.map((numero) => ({
        numero_destinataire: numero,
        contenu: message.trim(),
        statut: programmePour ? STATUT_TACHE.PROGRAMME : STATUT_TACHE.EN_ATTENTE,
        programme_a: programmePour ? programmePour.toISOString() : null,
        id_application: client.id,
      }))
    )
    .select('id, numero_destinataire, contenu, statut, programme_a, date_creation')
  if (error || !data || data.length === 0) {
    console.error('Erreur Supabase:', error)
    return erreur('Erreur lors de la création des tâches', 500, { details: error?.message })
  }
  const lignesCreees: LigneCree[] = data

  const tachesCreees = lignesCreees.map((t) => ({
    id: t.id,
    numero_destinataire: t.numero_destinataire,
    message: t.contenu,
    statut: t.statut,
    scheduled_at: t.programme_a,
    created_at: t.date_creation,
  }))

  // 6. Un seul push (sauf différé) : il réveille le téléphone, qui dépile ensuite
  // les tâches une par une à la scrutation (5 par passage).
  const appareil = disponibilite?.appareil ?? null
  let pushEnvoye = false
  if (!programmePour && appareil?.jeton_fcm) {
    try {
      pushEnvoye = await envoyerPushNouvelleTache(appareil.jeton_fcm, tachesCreees[0].id)
      console.log(`Push FCM envoyé à l'appareil ${appareil.id} (${appareil.sms_derniere_heure} SMS/heure) : ${pushEnvoye}`)
    } catch (erreurPush) {
      console.error('Erreur push FCM (non bloquant):', erreurPush)
    }
  } else if (!programmePour) {
    console.warn('Aucun appareil disponible — pas de push')
  }

  // 7. Réponse (forme simple pour 1 numéro, détaillée pour un groupe)
  const appareilSelectionne = appareil
    ? { id: appareil.id, nom: appareil.nom, sms_last_hour: appareil.sms_derniere_heure }
    : null
  if (programmePour) {
    return {
      statut: 201,
      corps: {
        message: `SMS programmé pour le ${programmePour.toLocaleString('fr-FR')}`,
        count: tachesCreees.length,
        tasks: tachesCreees,
        scheduled_for: programmePour.toISOString(),
        push_sent: false,
        client: { id: client.id, nom: client.nom },
      },
    }
  }
  if (!Array.isArray(to)) {
    return {
      statut: 201,
      corps: {
        message: 'SMS mis en file d\u2019attente',
        task: tachesCreees[0],
        push_sent: pushEnvoye,
        device_selected: appareilSelectionne,
        client: { id: client.id, nom: client.nom },
      },
    }
  }
  return {
    statut: 201,
    corps: {
      message: `${tachesCreees.length} SMS mis en file d'attente`,
      count: tachesCreees.length,
      tasks: tachesCreees,
      push_sent: pushEnvoye,
      device_selected: appareilSelectionne,
      client: { id: client.id, nom: client.nom },
    },
  }
}
