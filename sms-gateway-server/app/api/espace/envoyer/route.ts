import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { lireSessionClient } from '@/lib/session-client'
import { obtenirDisponibiliteAppareil } from '@/lib/selection-appareil'
import { envoyerPushNouvelleTache } from '@/lib/envoi-push'
import { expirerEnAttentePerimees } from '@/lib/expiration-attente'
import { promouvoirProgrammes } from '@/lib/programmes'
import { genererCode, urlPublique } from '@/lib/liens'
import { compterEnvoisMois, moisActuel } from '@/lib/facturation'
import { STATUT_TACHE } from '@/lib/statuts'

/**
 * POST /api/espace/envoyer — envoi depuis l'espace client (session, pas de clé).
 * Corps: { to, message, scheduled_at?, lien_intelligent? }.
 * Mêmes garde-fous que /api/sms/send : quota mensuel, quota horaire.
 */
export async function POST(request: NextRequest) {
  try {
    const idApplication = lireSessionClient(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const corps = await request.json().catch(() => null)
    const to = corps?.to
    const message = typeof corps?.message === 'string' ? corps.message : ''

    const MAX_DESTINATAIRES = 100
    const destinatairesBruts = Array.isArray(to) ? to : [to]
    if (destinatairesBruts.length === 0 || destinatairesBruts.length > MAX_DESTINATAIRES) {
      return NextResponse.json(
        { error: `Le champ "to" doit contenir entre 1 et ${MAX_DESTINATAIRES} destinataire(s)` },
        { status: 400 }
      )
    }
    const indexInvalides: number[] = []
    let numeros = destinatairesBruts.map((r, i) => {
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
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire' },
        { status: 400 }
      )
    }

    const { data: fiche } = await supabaseAdmin
      .from('applications')
      .select('quota_mensuel')
      .eq('id', idApplication)
      .single()
    const quotaMensuel = (fiche as { quota_mensuel: number | null } | null)?.quota_mensuel ?? null
    if (quotaMensuel !== null) {
      const utiliseMois = await compterEnvoisMois(idApplication, moisActuel())
      if (utiliseMois >= quotaMensuel) {
        return NextResponse.json(
          {
            error: `Quota mensuel atteint (${utiliseMois}/${quotaMensuel} SMS). Contactez votre administrateur.`,
            quota_mensuel: quotaMensuel,
            utilise_mois: utiliseMois,
          },
          { status: 429 }
        )
      }
    }

    await expirerEnAttentePerimees()
    await promouvoirProgrammes()

    let programmePour: Date | null = null
    if (corps?.scheduled_at) {
      const d = new Date(corps.scheduled_at)
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'Le champ "scheduled_at" doit être une date ISO future' },
          { status: 400 }
        )
      }
      programmePour = d
    }

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

    const avecLien = message.includes('{LIEN}') || corps?.lien_intelligent === true
    const baseUrl = urlPublique(
      request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    )

    type LigneCree = {
      id: string; numero_destinataire: string; contenu: string
      statut: string; programme_a: string | null; date_creation: string
    }
    const lignesCreees: LigneCree[] = []
    const liensCrees: { numero_destinataire: string; url: string }[] = []
    if (!avecLien) {
      const { data, error } = await supabaseAdmin
        .from('taches')
        .insert(
          numeros.map((numero) => ({
            numero_destinataire: numero,
            contenu: message.trim(),
            statut: programmePour ? STATUT_TACHE.PROGRAMME : STATUT_TACHE.EN_ATTENTE,
            programme_a: programmePour ? programmePour.toISOString() : null,
            id_application: idApplication,
          }))
        )
        .select('id, numero_destinataire, contenu, statut, programme_a, date_creation')
      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { error: 'Erreur lors de la création des tâches', details: error?.message },
          { status: 500 }
        )
      }
      lignesCreees.push(...data)
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
            id_application: idApplication,
          })
          .select('id, numero_destinataire, contenu, statut, programme_a, date_creation')
          .single()
        if (erreurInsert || !ligne) {
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
            id_application: idApplication,
            numero_destinataire: numero,
          })
        if (erreurLien) {
          return NextResponse.json(
            { error: 'Erreur lors de la création du lien', details: erreurLien.message },
            { status: 500 }
          )
        }
        lignesCreees.push(ligne)
        liensCrees.push({ numero_destinataire: numero, url: `${baseUrl}/c/${code}` })
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

    const appareil = disponibilite?.appareil ?? null
    let pushEnvoye = false
    if (!programmePour && appareil?.jeton_fcm) {
      try {
        pushEnvoye = await envoyerPushNouvelleTache(appareil.jeton_fcm, tachesCreees[0].id)
      } catch {
        pushEnvoye = false
      }
    }

    return NextResponse.json(
      {
        message: programmePour
          ? `SMS programmé pour le ${programmePour.toLocaleString('fr-FR')}`
          : Array.isArray(to) && to.length > 1
            ? `${tachesCreees.length} SMS mis en file d'attente`
            : 'SMS mis en file d\u2019attente',
        count: tachesCreees.length,
        tasks: tachesCreees,
        ...(avecLien ? { liens: liensCrees } : {}),
        push_sent: pushEnvoye,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
