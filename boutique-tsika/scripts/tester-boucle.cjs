/**
 * tester-boucle : vérifie hors ligne le cœur de la boutique —
 * création de commande, vérification de signature (le même algorithme que
 * la passerelle : HMAC-SHA256 hexadécimal du corps brut), passage à PAYEE,
 * idempotence, refus des intrus.
 *
 *   node scripts/tester-boucle.cjs
 */
const assert = require('node:assert')
const createHmac = require('node:crypto').createHmac
const gestionnaire = require('../api/boutique.js')

process.env.SMSTSIKA_SECRET = 'secret-de-test-local'
delete process.env.SMSTSIKA_CLE_API // pas de réseau : le SMS de confirmation échouera honnêtement

/* ---------- simulacres de requête / réponse ---------- */
function fauxReq(methode, url, corps, enTetes = {}) {
  const morceaux = corps === null ? [] : [corps]
  return {
    method: methode,
    url,
    headers: enTetes,
    async *[Symbol.asyncIterator]() {
      for (const morceau of morceaux) yield morceau
    },
  }
}

function fauxRes() {
  const memoire = { statut: 0, corps: null, enTetes: {} }
  memoire.res = {
    set statusCode(code) { memoire.statut = code },
    get statusCode() { return memoire.statut },
    setHeader(k, v) { memoire.enTetes[k] = v },
    end(b) { memoire.corps = b },
  }
  return memoire
}

async function appel(methode, url, corps, enTetes = {}) {
  const memoire = fauxRes()
  await gestionnaire(fauxReq(methode, url, corps === null ? null : JSON.stringify(corps), enTetes), memoire.res)
  return { statut: memoire.statut, corps: JSON.parse(memoire.corps || '{}') }
}

/* ---------- la charge et la signature exactes de la passerelle ---------- */
function signerCharge(secret, charge) {
  const brut = JSON.stringify(charge)
  return { brut, signature: 'sha256=' + createHmac('sha256', secret).update(brut, 'utf-8').digest('hex') }
}

function chargeServeur(contenu, expediteur) {
  const instant = new Date().toISOString()
  return {
    id: 'evt_' + Math.round(Math.random() * 1e9).toString(16),
    type: 'sms.recu',
    cree_le: instant,
    donnees: {
      id_reponse: 'rep-test-' + Math.round(Math.random() * 1e6),
      expediteur,
      contenu,
      date_reception: instant,
      id_appareil: 'appareil-test',
      id_application: null,
      source_routage: 'correlation',
    },
  }
}

/* ---------- déroulé ---------- */
let nombreTests = 0
async function test(nom, promesse, verifier) {
  const resultat = await promesse
  verifier(resultat)
  nombreTests++
  console.log('  ok —', nom)
}

const examen = async () => {
  console.log('Boutique Tsika — révélation de la boucle :')

  let creation
  await test('création de commande (SMS honnêtement non parti : clé absente en test)',
    appel('POST', '/api/boutique', { nom: 'Rakoto Jean', numero: '034 12 345 67', article: 'raphia' }),
    (r) => {
      assert.equal(r.statut, 201)
      assert.equal(r.corps.commande.numero, '+261341234567')
      assert.equal(r.corps.commande.statut, 'ATTENTE_PAIEMENT')
      assert.equal(r.corps.sms.ok, false)
      assert.match(r.corps.sms.erreur, /clé API/)
      creation = r.corps.commande
    })

  const code = creation.code

  await test('lecture d\'une commande par code',
    appel('GET', '/api/boutique?code=' + code, null),
    (r) => {
      assert.equal(r.statut, 200)
      assert.equal(r.corps.commande.statut, 'ATTENTE_PAIEMENT')
      assert.match(r.corps.commande.sms_erreur, /clé API/)
    })

  await test('intrus avec signature factice → refusé (401)',
    appel('POST', '/api/boutique', chargeServeur('PAYE ' + code, '+261329998877'), { 'x-smsika-signature': 'sha256=' + '0'.repeat(64) }),
    (r) => {
      assert.equal(r.statut, 401)
    })

  const payeur = '+261320998877'
  const charge = chargeServeur('Boutique a reçu : PAYE ' + code, payeur)
  const signee = signerCharge(process.env.SMSTSIKA_SECRET, charge)

  await test('webhook signé (même HMAC que la passerelle) → commande PAYEE',
    appel('POST', '/api/boutique', charge, { 'x-smsika-signature': signee.signature, 'x-smsika-event': 'sms.recu' }),
    (r) => {
      assert.equal(r.statut, 200)
      assert.equal(r.corps.recu, true)
      assert.equal(r.corps.payee, true)
      assert.equal(r.corps.commande, code)
    })

  await test('la commande est payée côté boutique',
    appel('GET', '/api/boutique?code=' + code, null),
    (r) => {
      assert.equal(r.corps.commande.statut, 'PAYEE')
      assert.equal(r.corps.commande.paye_par, payeur)
    })

  await test('réception en double : le même SMS reçu encore → « déjà payée », sans effet',
    appel('POST', '/api/boutique', charge, { 'x-smsika-signature': signee.signature }),
    (r) => {
      assert.equal(r.corps.payee, false)
      assert.match(r.corps.raison, /déjà payée/)
    })

  const autre = chargeServeur('Bonjour, une question ?', '+261340111222')
  const autreSigne = signerCharge(process.env.SMSTSIKA_SECRET, autre)
  await test('SMS sans code de paiement → 200 (rien à faire)',
    appel('POST', '/api/boutique', autre, { 'x-smsika-signature': autreSigne.signature }),
    (r) => {
      assert.equal(r.statut, 200)
      assert.match(r.corps.raison, /aucune confirmation/)
    })

  const inconnu = chargeServeur('PAYE CMD-9999', payeur)
  const inconnuSigne = signerCharge(process.env.SMSTSIKA_SECRET, inconnu)
  await test('code de commande inconnu ici → 200, on ne touche à rien',
    appel('POST', '/api/boutique', inconnu, { 'x-smsika-signature': inconnuSigne.signature }),
    (r) => {
      assert.equal(r.statut, 200)
      assert.match(r.corps.raison, /inconnue/)
    })

  await test('numéro invalide refusé à la création',
    appel('POST', '/api/boutique', { nom: 'X', numero: '06123456', article: 'vanille' }),
    (r) => {
      assert.equal(r.statut, 400)
    })

  console.log('')
  console.log('Boucle vérifiée : ' + nombreTests + ' tests OK. Le même mécanisme tournera en prod sur /api/boutique.')
}

examen().catch((erreur) => {
  console.error('  échec :', erreur.message)
  process.exit(1)
})
