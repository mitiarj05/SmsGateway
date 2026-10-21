import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { resoudreApplicationEspace } from '@/lib/espace-auth'
import { obtenirDisponibiliteAppareil } from '@/lib/selection-appareil'
import { envoyerPushNouvelleTache } from '@/lib/envoi-push'
import { expirerEnAttentePerimees } from '@/lib/expiration-attente'
import { promouvoirProgrammes } from '@/lib/programmes'
import { STATUT_TACHE } from '@/lib/statuts'

/**
 * POST /api/espace/envoyer — envoi depuis l'espace client (session, pas de clé).
 * Corps: { to, message, scheduled_at? }.
 * Mêmes garde-fous que /api/sms/send : quota mensuel, quota horaire.
 */
export async function POST(request: NextRequest) {
  try {
    const idApplication = await resoudreApplicationEspace(request)
    if (!idApplication) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    // Modèle individuel : sans téléphone lié, l'envoi est impossible.
    const { count: nbAppareils } = await supabaseAdmin
      .from('appareil')
      .select('id', { count: 'exact', head: true })
      .eq('id_application', idApplication)
    if (!nbAppareils) {
      return NextResponse.json(
        { error: 'Aucun téléphone lié à votre espace — associez-en un pour envoyer.' },
        { status: 400 }
      )
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

    // Forfait illimité : aucun quota mensuel — le seul vrai crédit est la SIM.

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

    const disponibilite = programmePour ? null : await obtenirDisponibiliteAppareil(idApplication)
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

    type LigneCree = {
      id: string; numero_destinataire: string; contenu: string
      statut: string; programme_a: string | null; date_creation: string
    }
    const { data, error } = await supabaseAdmin
      .from('tache')
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
    const lignesCreees: LigneCree[] = data

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
        push_sent: pushEnvoye,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
