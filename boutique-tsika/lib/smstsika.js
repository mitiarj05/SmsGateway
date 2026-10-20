/**
 * Boutique Tsika — sa propre information de branchement SMS.
 *
 * La boutique ne connaît de sa passerelle SMS que trois choses :
 *   - l'adresse d'appel    (SMSTSIKA_URL)          → pour envoyer,
 *   - sa clé personnelle   (SMSTSIKA_CLE_API)      → pour être reconnue,
 *   - un secret partagé    (SMSTSIKA_SECRET)       → pour vérifier qui l'appelle.
 * Elle ne partage ni base, ni code, ni compte avec la passerelle.
 */

const SMSTSIKA_URL = (process.env.SMSTSIKA_URL || 'https://smstsika.vercel.app').replace(/\/+$/, '')

/** Envoie le SMS de confirmation d'une commande (côté sortant de la passerelle). */
async function envoyerConfirmation(commande, article) {
  const cle = process.env.SMSTSIKA_CLE_API || ''
  if (!cle) {
    return { ok: false, code_http: null, erreur: 'Boutique non configurée : clé API absente (voir README)' }
  }
  const numeroPaiement = (process.env.SMSTSIKA_NUMERO_PAIEMENT || '').trim()
  const morceaux = [
    'Boutique Tsika - commande ' + commande.code + ' reçue (' + article.prix + ' Ar).',
    numeroPaiement
      ? ' Payez par mobile money au ' + numeroPaiement + ', puis répondez : PAYE ' + commande.code + '.'
      : ' Payez, puis répondez : PAYE ' + commande.code + '.',
    ' Merci !',
  ]
  const message = morceaux.join('').replace(/\s+/g, ' ').trim()
  try {
    const reponse = await fetch(SMSTSIKA_URL + '/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle_api: cle, to: commande.numero, message }),
    })
    let corps = null
    try { corps = await reponse.json() } catch { /* corps absent */ }
    if (!reponse.ok) {
      return {
        ok: false,
        code_http: reponse.status,
        erreur: (corps && corps.error) || 'Erreur ' + reponse.status,
      }
    }
    const tache = (corps && corps.task) || null
    return { ok: true, code_http: reponse.status, task_id: tache ? tache.id : null, statut_tache: tache ? tache.statut : null }
  } catch (erreur) {
    return { ok: false, code_http: null, erreur: 'Injoignable : ' + (erreur && erreur.message) }
  }
}

/** Vérifie la signature du webhook : HMAC-SHA256 du corps brut, hexadécimal. */
function signatureValide(corpsBrut, enTete) {
  const secret = process.env.SMSTSIKA_SECRET || ''
  const valeur = String(enTete || '')
  if (!secret || !valeur) return false
  const presentation = /^sha256=([0-9a-f]{64})$/i.exec(valeur)
  if (!presentation) return false
  const calculee = require('crypto').createHmac('sha256', secret).update(corpsBrut, 'utf-8').digest('hex')
  const a = Buffer.from(calculee, 'hex')
  const b = Buffer.from(presentation[1], 'hex')
  return a.length === b.length && require('crypto').timingSafeEqual(a, b)
}

module.exports = { SMSTSIKA_URL, envoyerConfirmation, signatureValide }
