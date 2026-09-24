import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierClientApi } from '@/lib/authentification'
import { envoyerPushNouvelleTache } from '@/lib/envoi-push'
import { obtenirDisponibiliteAppareil } from '@/lib/selection-appareil'
import { expirerEnAttentePerimees } from '@/lib/expiration-attente'
import { promouvoirProgrammes } from '@/lib/programmes'
import { genererCode, urlPublique } from '@/lib/liens'
import { STATUT_TACHE } from '@/lib/statuts'

export async function POST(request: NextRequest) {
  try {
    const corps = await request.json()
    const { to, message, cle_api } = corps

    // 1. Validation — `to` : un numéro ou une liste (envoi groupé).
    const MAX_DESTINATAIRES = 100
    const destinatairesBruts = Array.isArray(to) ? to : [to]
    if (destinatairesBruts.length === 0 || destinatairesBruts.length > MAX_DESTINATAIRES) {
      return NextResponse.json(
        { error: `Le champ "to" doit contenir entre 1 et ${MAX_DESTINATAIRES} destinataire(s)` },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: `Numéro(s) invalide(s) aux position(s) : ${indexInvalides.join(', ')}` },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire' },
        { status: 400 }
      )
    }

    if (!cle_api || typeof cle_api !== 'string' || cle_api.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "cle_api" est obligatoire' },
        { status: 400 }
      )
    }

    // 2. Authentification du client API
    const cleNettoyee = cle_api.trim()
    const client = await authentifierClientApi(cleNettoyee)
    if (!client) {
      console.warn(
        `[sms/send] cle_api rejetée (longueur=${cleNettoyee.length}, préfixe=${cleNettoyee.slice(0, 8)}…, suffixe=${cleNettoyee.slice(-3)})`
      )
      return NextResponse.json(
        { error: 'Clé API invalide' },
        { status: 401 }
      )
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
        return NextResponse.json(
          { error: 'Le champ "scheduled_at" doit être une date ISO future' },
          { status: 400 }
        )
      }
      if (d.getTime() - Date.now() > 366 * 24 * 3600_000) {
        return NextResponse.json(
          { error: 'Le champ "scheduled_at" est limité à un an maximum' },
          { status: 400 }
        )
      }
      programmePour = d
    }

    // 3. Quota strict : refuser AVANT de créer la tâche si tout est saturé
    const disponibilite = programmePour ? null : await obtenirDisponibiliteAppareil()
    if (disponibilite?.sature) {
      return NextResponse.json(
        {
          error: `Quota SMS/heure atteint (${disponibilite.quota}/h/appareil). Réessayez dans ~${disponibilite.delaiAttenteSecondes}s.`,
          quota: disponibilite.quota,
          retry_after_seconds: disponibilite.delaiAttenteSecondes,
        },
        { status: 429 }
      )
    }

    // 4. Créer une tâche par destinataire.
    // Raccourcis : si le message contient {LIEN} (ou option
    // lien_intelligent: true), un code court distinct par destinataire
    // est généré et substitué (une ligne par destinataire, sinon bulk).
    // Contrat JSON inchangé : les clés restent message/device_id/created_at.
    const avecLien = message.includes('{LIEN}') || corps?.lien_intelligent === true
    const baseUrl = urlPublique()

    type LigneCree = {
      id: string; numero_destinataire: string; contenu: string
      statut: string; programme_a: string | null; date_creation: string
    }
    let lignesCreees: LigneCree[] = []
    if (!avecLien) {
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
        return NextResponse.json(
          { error: 'Erreur lors de la création des tâches', details: error?.message },
          { status: 500 }
        )
      }
      lignesCreees = data
    } else {
      for (const numero of numeros) {
        const code = await genererCode()
        const gabarit = message.includes('{LIEN}') ? message : `${message}\n{LIEN}`
        const contenu = gabarit.replaceAll('{LIEN}', `${baseUrl}/c/${code}`)
        const { data: ligne, error: erreurInsert } = await supabaseAdmin
          .from('taches')
          .insert({
            numero_destinataire: numero,
            contenu: contenu.trim(),
            statut: programmePour ? STATUT_TACHE.PROGRAMME : STATUT_TACHE.EN_ATTENTE,
            programme_a: programmePour ? programmePour.toISOString() : null,
            id_application: client.id,
          })
          .select('id, numero_destinataire, contenu, statut, programme_a, date_creation')
          .single()
        if (erreurInsert || !ligne) {
          console.error('Erreur Supabase (lien):', erreurInsert)
          return NextResponse.json(
            { error: 'Erreur lors de la création des tâches', details: erreurInsert?.message },
            { status: 500 }
          )
        }
        const { error: erreurLien } = await supabaseAdmin
          .from('liens')
          .insert({
            id: code,
            id_tache: ligne.id,
            id_application: client.id,
            numero_destinataire: numero,
          })
        if (erreurLien) {
          console.error('Erreur Supabase (liens):', erreurLien)
          return NextResponse.json(
            { error: 'Erreur lors de la création du raccourci', details: erreurLien.message },
            { status: 500 }
          )
        }
        lignesCreees.push(ligne)
      }
    }

    const tachesCreees = lignesCreees.map((t) => ({
      id: t.id,
      numero_destinataire: t.numero_destinataire,
      message: t.contenu,
      statut: t.statut,
      scheduled_at: t.programme_a,
      created_at: t.date_creation,
    }))

    // 5. Un seul push (sauf différé) : il réveille le téléphone, qui dépile ensuite
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

    // 6. Réponse (forme simple pour 1 numéro, détaillée pour un groupe)
    const appareilSelectionne = appareil
      ? { id: appareil.id, nom: appareil.nom, sms_last_hour: appareil.sms_derniere_heure }
      : null
    if (programmePour) {
      return NextResponse.json(
        {
          message: `SMS programmé pour le ${programmePour.toLocaleString('fr-FR')}`,
          count: tachesCreees.length,
          tasks: tachesCreees,
          scheduled_for: programmePour.toISOString(),
          push_sent: false,
          client: { id: client.id, nom: client.nom },
        },
        { status: 201 }
      )
    }
    if (!Array.isArray(to)) {
      return NextResponse.json(
        {
          message: 'SMS mis en file d\'attente',
          task: tachesCreees[0],
          push_sent: pushEnvoye,
          device_selected: appareilSelectionne,
          client: { id: client.id, nom: client.nom },
        },
        { status: 201 }
      )
    }
    return NextResponse.json(
      {
        message: `${tachesCreees.length} SMS mis en file d'attente`,
        count: tachesCreees.length,
        tasks: tachesCreees,
        push_sent: pushEnvoye,
        device_selected: appareilSelectionne,
        client: { id: client.id, nom: client.nom },
      },
      { status: 201 }
    )
  } catch (erreur) {
    console.error('Erreur inattendue:', erreur)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
