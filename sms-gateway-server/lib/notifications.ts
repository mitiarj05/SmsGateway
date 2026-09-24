import { createHmac, randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase-serveur'

/**
 * Notifications sortantes : le serveur prévient les systèmes clients à chaque
 * événement (sms.recu, lien.clique) au lieu d'être interrogé en boucle.
 *
 * Livraison fiable : file en base (notifications) + retry exponentiel,
 * traitée paresseusement à chaque point d'entrée (pas de cron, pas de Redis).
 */

export const EVENEMENTS_NOTIFICATION = ['sms.recu', 'lien.clique'] as const
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
  url_notification: string | null
  secret_notification: string | null
  evenements_notification: string[] | null
  notifications_actives: boolean | null
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
    .from('applications')
    .select('id, url_notification, secret_notification, evenements_notification, notifications_actives')
    .eq('id', idApplication)
    .single()
  const application = app as ApplicationNotification | null
  if (
    !application ||
    application.notifications_actives === false ||
    !application.url_notification ||
    !application.secret_notification ||
    !(application.evenements_notification ?? []).includes(type)
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
    .from('notifications')
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

/** Miroir du statut sur entrants quand la charge y fait référence. */
async function miroirStatutNotification(charge: Record<string, unknown>, statut: string, tentatives: number) {
  const idEntrant = charge?.donnees && typeof charge.donnees === 'object'
    ? (charge.donnees as Record<string, unknown>).id_reponse
    : null
  if (typeof idEntrant !== 'string' || !idEntrant) return
  await supabaseAdmin
    .from('entrants')
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
    .from('notifications')
    .select('id, id_application, type_evenement, charge, tentatives')
    .eq('statut', 'EN_ATTENTE')
    .lte('prochaine_tentative', new Date().toISOString())
    .order('prochaine_tentative', { ascending: true })
    .limit(LOT_TRAITEMENT)
  for (const livraison of dues ?? []) {
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('url_notification, secret_notification, notifications_actives')
      .eq('id', livraison.id_application)
      .single()
    const url = (app as { url_notification: string | null } | null)?.url_notification
    const secret = (app as { secret_notification: string | null } | null)?.secret_notification
    const actifs = (app as { notifications_actives: boolean | null } | null)?.notifications_actives !== false
    const tentatives = (livraison.tentatives ?? 0) + 1
    if (!url || !secret || !actifs) {
      await supabaseAdmin
        .from('notifications')
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
          .from('notifications')
          .update({
            statut: 'ENVOYE',
            tentatives,
            dernier_code_http: reponse.status,
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
        .from('notifications')
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
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('id_application', idApplication)
    .eq('statut', 'ECHOUE')
    .gte('date_maj', depuis)
  if ((count ?? 0) >= 20) {
    await supabaseAdmin
      .from('applications')
      .update({ notifications_actives: false })
      .eq('id', idApplication)
    console.warn(`notifications coupées pour ${idApplication} (URL durablement en panne)`)
  }
}
