import { createHmac, randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase-serveur'

/**
 * Notifications sortantes : le serveur prévient les systèmes clients à chaque
 * événement (sms.recu) au lieu d'être interrogé en boucle.
 *
 * Livraison fiable : file en base (notifications) + retry exponentiel,
 * traitée paresseusement à chaque point d'entrée (pas de cron, pas de Redis).
 */

export const EVENEMENTS_NOTIFICATION = ['sms.recu'] as const
export type EvenementNotification = (typeof EVENEMENTS_NOTIFICATION)[number]

const DELAIS_REJEU_MINUTES = [1, 5, 30, 120, 720]
const TENTATIVES_MAX = 5
const TIMEOUT_MS = 10_000
const LOT_TRAITEMENT = 5

/** Secret unique affiché une seule fois à la création (comme les clés API). */
export function fabriquerSecretNotification(): string {
  return randomBytes(32).toString('hex')
}

/** Signature HMAC-SHA256 du corps brut (en-tête X-Smsika-Signature). */
export function signerNotification(secret: string, corpsBrut: string): string {
  return createHmac('sha256', secret).update(corpsBrut, 'utf-8').digest('hex')
}

interface ApplicationNotification {
  id: string
  url_application: string | null
  secret_signature: string | null
  evenements_souscrits: string[] | null
  evenements_actifs: boolean | null
}

/**
 * Met en file une livraison si le client est éligible
 * (actif + URL + secret + abonné à l'événement).
 * Retourne l'id de la charge (traçabilité + idempotence côté client).
 */
export async function enfilerNotification(
  idApplication: string | null,
  type: EvenementNotification,
  donnees: Record<string, unknown>
): Promise<string | null> {
  if (!idApplication) return null
  const { data: app } = await supabaseAdmin
    .from('client')
    .select('id, url_application, secret_signature, evenements_souscrits, evenements_actifs')
    .eq('id', idApplication)
    .single()
  const application = app as ApplicationNotification | null
  if (
    !application ||
    application.evenements_actifs === false ||
    !application.url_application ||
    !application.secret_signature ||
    !(application.evenements_souscrits ?? []).includes(type)
  ) {
    return null
  }
  const charge = {
    id: `evt_${randomBytes(12).toString('hex')}`,
    type,
    cree_le: new Date().toISOString(),
    donnees,
  }
  const { data, error } = await supabaseAdmin
    .from('notification')
    .insert({
      id_application: idApplication,
      type_evenement: type,
      charge,
      statut: 'EN_ATTENTE',
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('enfilerNotification: impossible', error?.message)
    return null
  }
  return charge.id as string
}

/** Miroir du statut sur reponses quand la charge y fait référence. */
async function miroirStatutNotification(charge: Record<string, unknown>, statut: string, tentatives: number) {
  const idEntrant = charge?.donnees && typeof charge.donnees === 'object'
    ? (charge.donnees as Record<string, unknown>).id_reponse
    : null
  if (typeof idEntrant !== 'string' || !idEntrant) return
  await supabaseAdmin
      .from('reponse')
    .update({ statut_notification: statut, tentatives_notification: tentatives })
    .eq('id', idEntrant)
}

/**
 * Traite les livraisons dues (une passe courte, bornée).
 * À appeler en fin de routes (inbox, clic) : fire-and-forget interdit
 * en serverless, on await donc un lot limité.
 */
export async function traiterNotificationsEnAttente(): Promise<{ envoyes: number; echecs: number }> {
  let envoyes = 0
  let echecs = 0
  const { data: dues } = await supabaseAdmin
    .from('notification')
    .select('id, id_application, type_evenement, charge, tentatives')
    .eq('statut', 'EN_ATTENTE')
    .lte('prochaine_tentative', new Date().toISOString())
    .order('prochaine_tentative', { ascending: true })
    .limit(LOT_TRAITEMENT)
  for (const livraison of dues ?? []) {
    const { data: app } = await supabaseAdmin
      .from('client')
      .select('url_application, secret_signature, evenements_actifs')
      .eq('id', livraison.id_application)
      .single()
    const url = (app as { url_application: string | null } | null)?.url_application
    const secret = (app as { secret_signature: string | null } | null)?.secret_signature
    const actifs = (app as { evenements_actifs: boolean | null } | null)?.evenements_actifs !== false
    const tentatives = (livraison.tentatives ?? 0) + 1
    if (!url || !secret || !actifs) {
      await supabaseAdmin
        .from('notification')
        .update({ statut: 'ECHOUE', tentatives, date_maj: new Date().toISOString() })
        .eq('id', livraison.id)
      await miroirStatutNotification(livraison.charge, 'ECHOUE', tentatives)
      echecs++
      continue
    }
    const corpsBrut = JSON.stringify(livraison.charge)
    try {
      const controleur = new AbortController()
      const garde = setTimeout(() => controleur.abort(), TIMEOUT_MS)
      let reponse: Response
      try {
        reponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smsika-Signature': `sha256=${signerNotification(secret, corpsBrut)}`,
            'X-Smsika-Event': livraison.type_evenement,
          },
          body: corpsBrut,
          signal: controleur.signal,
        })
      } finally {
        clearTimeout(garde)
      }
      if (reponse.ok) {
        await supabaseAdmin
          .from('notification')
          .update({
            statut: 'ENVOYE',
            tentatives,
            date_maj: new Date().toISOString(),
          })
          .eq('id', livraison.id)
        await miroirStatutNotification(livraison.charge, 'ENVOYE', tentatives)
        envoyes++
      } else {
        throw new Error(`HTTP ${reponse.status}`)
      }
    } catch (erreur) {
      const definitive = tentatives >= TENTATIVES_MAX
      const delai = DELAIS_REJEU_MINUTES[Math.min(tentatives - 1, DELAIS_REJEU_MINUTES.length - 1)]
      await supabaseAdmin
        .from('notification')
        .update({
          statut: definitive ? 'ECHOUE' : 'EN_ATTENTE',
          tentatives,
          prochaine_tentative: new Date(Date.now() + delai * 60_000).toISOString(),
          date_maj: new Date().toISOString(),
        })
        .eq('id', livraison.id)
      await miroirStatutNotification(livraison.charge, definitive ? 'ECHOUE' : 'EN_ATTENTE', tentatives)
      console.warn(`notification ${livraison.id} (${livraison.type_evenement}) échec tentative ${tentatives}:`, (erreur as Error).message)
      echecs++
      if (definitive) {
        await couperNotificationsSiEnPanne(livraison.id_application)
      }
    }
  }
  return { envoyes, echecs }
}

/** Coupe les notifications d'un client durablement en panne (visible au dashboard). */
async function couperNotificationsSiEnPanne(idApplication: string) {
  const depuis = new Date(Date.now() - 24 * 3600_000).toISOString()
  const { count } = await supabaseAdmin
    .from('notification')
    .select('id', { count: 'exact', head: true })
    .eq('id_application', idApplication)
    .eq('statut', 'ECHOUE')
    .gte('date_maj', depuis)
  if ((count ?? 0) >= 20) {
    await supabaseAdmin
      .from('client')
      .update({ evenements_actifs: false })
      .eq('id', idApplication)
    console.warn(`notifications coupées pour ${idApplication} (URL durablement en panne)`)
  }
}
