import { supabaseAdmin } from './supabase-serveur'
import { obtenirDisponibiliteAppareil } from './selection-appareil'
import { envoyerPushNouvelleTache } from './envoi-push'
import { STATUT_TACHE } from './statuts'

/**
 * Réponses automatiques aux SMS entrants :
 * - STOP / START système (blocage global ou par client, avec confirmation),
 * - règles mot-clé par client puis globales (préfixe, insensible à la casse).
 * Les réponses partent comme des tâches normales (file, quota, push).
 */

export async function numeroBloque(numero: string, idApplication: string | null): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('blocages')
    .select('id, id_application')
    .eq('numero_destinataire', numero)
    .limit(10)
  return (data ?? []).some(
    (b) => !b.id_application || (idApplication && b.id_application === idApplication)
  )
}

async function bloquer(numero: string, idApplication: string | null, motif: string) {
  const existe = await numeroBloque(numero, idApplication)
  if (existe) return
  await supabaseAdmin
    .from('blocages')
    .insert({ numero_destinataire: numero, id_application: idApplication, motif })
}

async function debloquer(numero: string, idApplication: string | null) {
  let requete = supabaseAdmin
    .from('blocages')
    .delete()
    .eq('numero_destinataire', numero)
  requete = idApplication ? requete.eq('id_application', idApplication) : requete.is('id_application', null)
  await requete
}

async function repondre(numero: string, idApplication: string | null, contenu: string) {
  const { data: tache } = await supabaseAdmin
    .from('taches')
    .insert({
      numero_destinataire: numero,
      contenu,
      statut: STATUT_TACHE.EN_ATTENTE,
      id_application: idApplication,
    })
    .select('id')
    .single()
  if (tache) {
    try {
      const disponibilite = await obtenirDisponibiliteAppareil()
      if (!disponibilite.sature && disponibilite.appareil?.jeton_fcm) {
        await envoyerPushNouvelleTache(disponibilite.appareil.jeton_fcm, tache.id)
      }
    } catch { /* le polling prendra le relais */ }
  }
}

export interface EntrantAutomatisme {
  id_entrant: string
  expediteur: string
  contenu: string
  id_application: string | null
}

/** Appliqué après chaque SMS entrant (route inbox). */
export async function traiterAutomatismes(entrant: EntrantAutomatisme): Promise<string | null> {
  const texte = entrant.contenu.trim()
  if (!texte) return null
  const majuscules = texte.toUpperCase()

  // STOP / START système (mot seul en tête de message).
  if (/^STOP\b/.test(majuscules)) {
    await bloquer(entrant.expediteur, entrant.id_application, 'STOP')
    await repondre(
      entrant.expediteur, entrant.id_application,
      'Vous êtes désinscrit. Pour vous réinscrire, envoyez START.'
    )
    return 'stop'
  }
  if (/^START\b/.test(majuscules)) {
    await debloquer(entrant.expediteur, entrant.id_application)
    await repondre(
      entrant.expediteur, entrant.id_application,
      'Vous êtes de nouveau inscrit.'
    )
    return 'start'
  }

  // Règles : client d'abord, globales ensuite, premier mot-clé qui matche.
  let requeteRegles = supabaseAdmin
    .from('automatismes')
    .select('mot_cle, reponse, id_application')
    .eq('actif', true)
    .limit(50)
  requeteRegles = entrant.id_application
    ? requeteRegles.or(`id_application.eq.${entrant.id_application},id_application.is.null`)
    : requeteRegles.is('id_application', null)
  const { data: regles } = await requeteRegles
  const triees = (regles ?? []).sort(
    (a, b) => (a.id_application ? 0 : 1) - (b.id_application ? 0 : 1)
  )
  const regle = triees.find((r) => r.mot_cle && majuscules.startsWith(r.mot_cle.toUpperCase()))
  if (regle) {
    await repondre(entrant.expediteur, entrant.id_application, regle.reponse)
    return 'regle'
  }
  return null
}
