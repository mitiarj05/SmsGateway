import nodemailer from 'nodemailer'

/**
 * Envoi d'e-mails transactionnels (clé API après validation, etc.).
 * SMTP générique via variables d'environnement :
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE ("true"/"false"),
 *   SMTP_USER, SMTP_PASS, SMTP_FROM ("SMSIKA <no-reply@exemple.mg>").
 * Sans config : envoi ignoré silencieusement (false), le dashboard
 * reste la voie de transmission (clé affichée une seule fois).
 */

let transporteur: ReturnType<typeof nodemailer.createTransport> | null = null

function obtenirTransporteur(): ReturnType<typeof nodemailer.createTransport> | null {
  if (transporteur) return transporteur
  const hote = process.env.SMTP_HOST?.trim()
  const utilisateur = process.env.SMTP_USER?.trim()
  const motDePasse = process.env.SMTP_PASS ?? ''
  if (!hote || !utilisateur) return null
  const port = Number(process.env.SMTP_PORT ?? '587')
  const securise = (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true'
  transporteur = nodemailer.createTransport({
    host: hote,
    port,
    secure: securise || port === 465,
    auth: { user: utilisateur, pass: motDePasse },
  })
  return transporteur
}

/** Configure (true) ou non ? */
export function courrielConfigure(): boolean {
  return obtenirTransporteur() !== null
}

/** Adresse e-mail plausible (le contact peut aussi être un téléphone). */
export function estAdresseCourriel(contact: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
}

/**
 * Envoie un e-mail texte + HTML minimal. Retourne true si accepté
 * par le serveur SMTP, false sinon (jamais d'exception levée).
 */
export async function envoyerCourriel(
  destinataire: string,
  sujet: string,
  texte: string
): Promise<boolean> {
  try {
    const transport = obtenirTransporteur()
    const expediteur = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || ''
    if (!transport || !expediteur) {
      console.warn('[courriel] SMTP non configuré — envoi ignoré')
      return false
    }
    const html = texte
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .split('\n')
      .map((ligne) => `<p>${ligne || '<br>'}</p>`)
      .join('')
    await transport.sendMail({
      from: expediteur,
      to: destinataire,
      subject: sujet,
      text: texte,
      html: `<!DOCTYPE html><html lang="fr"><body style="font-family:system-ui,sans-serif">${html}</body></html>`,
    })
    return true
  } catch (erreur) {
    console.error('[courriel] échec envoi:', (erreur as Error).message)
    return false
  }
}

/** Contenu du courriel de bienvenue avec clé API. */
export function texteCleApi(nom: string, cleApi: string, urlEspace: string): string {
  return [
    `Bonjour ${nom},`,
    '',
    'Votre accès à la passerelle SMS SMSIKA est validé.',
    '',
    `Votre clé API (à garder secrète) : ${cleApi}`,
    '',
    `Connectez-vous à votre espace : ${urlEspace}`,
    'Renseignez la clé pour voir vos statistiques, vos SMS reçus et configurer vos notifications.',
    '',
    'En cas de perte de clé, contactez votre administrateur (révocation + recréation).',
    '',
    '— L’équipe SMSIKA',
  ].join('\n')
}
