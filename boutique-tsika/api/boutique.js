/**
 * Boutique Tsika — LE point d'entrée serveur du site (api/boutique.js).
 * Un seul fichier : le webhook est reconnu par son en-tête de signature,
 * tout le reste est servi par la boutique elle-même. Pas de magie de routing.
 *
 *   POST avec en-tête X-Smsika-Signature  → récepteur webhook (SMS reçu)
 *   POST sans signature                   → création d'une commande
 *   GET ?code=CMD-1234                    → une commande précise
 *   GET                                   → toutes les commandes (page)
 */
const smstsika = require('../lib/smstsika')
const magasin = require('../lib/magasin')

/** "PAYE CMD-1234" — tolérant à la casse, aux espaces multiples et aux tirets. */
const REGEX_PAIEMENT = /(?:^|[^A-Z0-9])PAYE\s*CMD[-\s]?(\d{3,6})\b/i

function repondre(res, codeStatut, corps) {
  res.statusCode = codeStatut
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(corps))
}

async function lireCorpsBrut(req) {
  let brut = ''
  for await (const morceau of req) brut += morceau
  return brut
}

/** 0341234567 / +261 34 12 345 67 → +261341234567. */
function normaliserNumero(brut) {
  const nettoye = String(brut || '').replace(/[\s.\-()]/g, '')
  const match = /^(?:\+261|0)(3[0-9])\d{7}$/.exec(nettoye)
  if (!match) return null
  return '+261' + nettoye.slice(-9)
}

function nettoyerTexte(brut, maximum) {
  return String(brut || '').trim().slice(0, maximum)
}

/* ------------------------------------------------------------------ */
/* Récepteur webhook : ce que la passerelle appelle quand un SMS arrive */
/* ------------------------------------------------------------------ */
async function recevoirWebhook(req, res) {
  const brut = await lireCorpsBrut(req)
  if (!smstsika.signatureValide(brut, req.headers['x-smsika-signature'])) {
    // Intrus : on ne dit rien d'autre qu'invalide, on ne traite jamais rien.
    return repondre(res, 401, { recu: false, erreur: 'Signature invalide' })
  }
  let charge = null
  try {
    charge = JSON.parse(brut)
  } catch {
    return repondre(res, 400, { recu: false, erreur: 'Corps illisible' })
  }
  const donnees = (charge && charge.donnees) || {}
  const contenu = typeof donnees.contenu === 'string' ? donnees.contenu : ''
  const expediteur = typeof donnees.expediteur === 'string' ? donnees.expediteur : ''

  const trouvaille = REGEX_PAIEMENT.exec(contenu)
  const compteRendu = { recu: true, commande: null, payee: false, raison: null }
  if (!trouvaille) {
    compteRendu.raison = 'aucune confirmation de paiement reconnue'
    return repondre(res, 200, compteRendu)
  }
  const code = 'CMD-' + trouvaille[1]
  const commande = await magasin.parCode(code)
  if (!commande) {
    compteRendu.raison = 'commande ' + code + ' inconnue ici'
    return repondre(res, 200, compteRendu)
  }
  if (commande.statut === 'PAYEE') {
    compteRendu.commande = code
    compteRendu.raison = 'déjà payée'
    return repondre(res, 200, compteRendu)
  }
  await magasin.payer(code, { expediteur, recu_le: new Date().toISOString() })
  compteRendu.commande = code
  compteRendu.payee = true
  return repondre(res, 200, compteRendu)
}

/* ------------------------------------------------------------------ */
/* Commande : créée par la page, confirmée par un SMS envoyé via clé API */
/* ------------------------------------------------------------------ */
async function creerCommande(req, res) {
  const brut = await lireCorpsBrut(req)
  let corps = null
  try {
    corps = JSON.parse(brut)
  } catch {
    return repondre(res, 400, { erreur: 'Corps illisible' })
  }
  const nom = nettoyerTexte(corps && corps.nom, 80)
  const numero = normaliserNumero(corps && corps.numero)
  const article = magasin.CATALOGUE.find((a) => a.id === (corps && corps.article)) || null
  if (!nom) return repondre(res, 400, { erreur: 'Le champ "nom" est obligatoire' })
  if (!numero) {
    return repondre(res, 400, { erreur: 'Numéro invalide : format malgache attendu (ex. 034 12 345 67)' })
  }
  if (!article) return repondre(res, 400, { erreur: 'Article inconnu' })

  const commande = await magasin.creer({ nom, numero, articleId: article.id })
  const resultatSms = await smstsika.envoyerConfirmation(commande, article)
  await magasin.noterEnvoiSms(commande.code, resultatSms)
  const versionFinale = await magasin.parCode(commande.code)
  return repondre(res, 201, {
    commande: versionFinale,
    sms: { ok: resultatSms.ok, erreur: resultatSms.erreur || null },
  })
}

/* ------------------------------------------------------------------ */
/* Entrée unique                                                       */
/* ------------------------------------------------------------------ */
module.exports = async function gestionnaire(req, res) {
  try {
    if (req.method === 'POST') {
      return req.headers['x-smsika-signature']
        ? recevoirWebhook(req, res)
        : creerCommande(req, res)
    }
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://local')
      const code = url.searchParams.get('code')
      if (code) {
        const commande = await magasin.parCode(code.trim().toUpperCase())
        return commande
          ? repondre(res, 200, { commande })
          : repondre(res, 404, { erreur: 'Commande inconnue' })
      }
      return repondre(res, 200, {
        commandes: await magasin.toutes(),
        durable: magasin.modeDurable,
      })
    }
    return repondre(res, 405, { erreur: 'Méthode non prévue' })
  } catch (erreur) {
    console.error('[boutique]', erreur)
    return repondre(res, 500, { erreur: 'Erreur interne de la boutique' })
  }
}
