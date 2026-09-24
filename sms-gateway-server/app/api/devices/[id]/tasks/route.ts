import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'
import { obtenirParametreEntier } from '@/lib/parametres'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'
import { expirerEnAttentePerimees } from '@/lib/expiration-attente'
import { promouvoirProgrammes } from '@/lib/programmes'
import { STATUT_APPAREIL, STATUT_TACHE } from '@/lib/statuts'

// Un message RECLAME depuis plus de 5 minutes est considéré abandonné
const DELAI_RECLAMATION_MS = 5 * 60 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idAppareil } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
        { status: 401 }
      )
    }
    const jeton = authHeader.substring(7)

    const appareil = await authentifierAppareil(idAppareil, jeton)
    if (!appareil) {
      return NextResponse.json(
        { error: 'Appareil inconnu ou token invalide' },
        { status: 401 }
      )
    }

    // Quota strict : un appareil au quota ne reçoit plus de tâches pendant 1 h.
    // Les EN_ATTENTE restent en file pour plus tard ou un autre appareil.
    const quota = await obtenirParametreEntier('sms_quota_per_hour')
    const usage = await obtenirUsageAppareil(idAppareil)
    const quotaAtteint = usage >= quota
    if (quotaAtteint) {
      console.warn(`quota: ${idAppareil} au quota (${usage}/${quota}), scrutation sans tâches`)
    }

    await expirerEnAttentePerimees()
    await promouvoirProgrammes()

    // 1. Récupérer les tâches EN_ATTENTE (jamais assignées)
    const { data: tachesEnAttente, error: erreur1 } = await supabaseAdmin
      .from('taches')
      .select('id, numero_destinataire, contenu, statut, date_creation')
      .eq('statut', STATUT_TACHE.EN_ATTENTE)
      .is('id_appareil', null)
      .order('date_creation', { ascending: true })
      .limit(5)

    if (erreur1) {
      console.error('Erreur Supabase (en-attente):', erreur1)
      return NextResponse.json(
        { error: 'Erreur récupération tâches', details: erreur1.message },
        { status: 500 }
      )
    }

    // 2. Récupérer les tâches RECLAME expirées (abandonnées)
    // Anti-doublon : une tâche RECLAME n'est réassignée QUE si son
    // reclame_a dépasse le timeout (> 5 min). Avant ça, elle reste
    // la propriété exclusive de l'appareil qui l'a réclamée, même si cet
    // appareil est temporairement hors-ligne (retry côté téléphone).
    // On inclut aussi reclame_a NULL (anciennes tâches sans lease).
    const seuilDelai = new Date(Date.now() - DELAI_RECLAMATION_MS).toISOString()
    const { data: tachesExpirees, error: erreur2 } = await supabaseAdmin
      .from('taches')
      .select('id, numero_destinataire, contenu, statut, date_creation, id_appareil')
      .eq('statut', STATUT_TACHE.RECLAME)
      .or(`reclame_a.is.null,reclame_a.lt.${seuilDelai}`)
      .order('date_creation', { ascending: true })
      .limit(5)

    if (erreur2) {
      console.error('Erreur Supabase (expirées):', erreur2)
      // On ne bloque pas : les EN_ATTENTE restent utilisables
    }

    // 3. Marquer les tâches expirées comme EN_ATTENTE pour réassignation
    // Garde-fou atomique : on ne reset QUE les tâches encore en RECLAME.
    // Si l'appareil d'origine a confirmé ENVOYE/ECHOUE entre le SELECT et
    // l'UPDATE (retry réseau qui finit par passer), on ne l'écrase pas.
    const idsExpirees = (tachesExpirees || []).map(t => t.id)
    if (idsExpirees.length > 0) {
      await supabaseAdmin
        .from('taches')
        .update({
          statut: STATUT_TACHE.EN_ATTENTE,
          id_appareil: null,
          reclame_a: null,
          date_modification: new Date().toISOString(),
        })
        .in('id', idsExpirees)
        .eq('statut', STATUT_TACHE.RECLAME)
    }

    // 4. Fusionner les deux listes (vide si quota atteint)
    // Contrat JSON inchangé : les champs restent message/statut/appareil_id.
    const versContrat = (t: {
      id: string; numero_destinataire: string; contenu: string;
      statut: string; date_creation: string
    }) => ({
      id: t.id,
      numero_destinataire: t.numero_destinataire,
      message: t.contenu,
      statut: t.statut,
      created_at: t.date_creation,
    })
    const toutesTaches = [
      ...(tachesEnAttente || []).map(versContrat),
      ...(tachesExpirees || []).map(t => ({
        ...versContrat(t),
        statut: STATUT_TACHE.EN_ATTENTE,  // désormais réassignable
      })),
    ]
    const tachesVisibles = quotaAtteint ? [] : toutesTaches.slice(0, 5)  // max 5 par scrutation

    // 5. Mettre l'appareil en EN_LIGNE — SAUF s'il est désactivé manuellement
    // (sinon la scrutation réactiverait un appareil DESACTIVE quelques secondes après)
    if (appareil.statut !== STATUT_APPAREIL.DESACTIVE) {
      await supabaseAdmin
        .from('appareils')
        .update({
          statut: STATUT_APPAREIL.EN_LIGNE,
          derniere_activite: new Date().toISOString(),
        })
        .eq('id', idAppareil)
    } else {
      // On met juste à jour l'activité, sans toucher au statut
      await supabaseAdmin
        .from('appareils')
        .update({
          derniere_activite: new Date().toISOString(),
        })
        .eq('id', idAppareil)
    }

    return NextResponse.json(
      {
        device: { id: appareil.id, nom: appareil.nom },
        tasks: tachesVisibles,
        count: tachesVisibles.length,
        quota_reached: quotaAtteint,
        quota,
      },
      { status: 200 }
    )
  } catch (erreur) {
    console.error('Erreur inattendue:', erreur)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
