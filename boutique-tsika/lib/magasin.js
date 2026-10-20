/**
 * Le magasin de la boutique : SES commandes, SA base.
 *
 * Deux modes, choisis par les variables d'environnement :
 *  - mémoire (défaut)          : parfait pour une session de démonstration en continu,
 *                                mais un long redémarrage de la plateforme efface les commandes ;
 *  - sa propre base Supabase   : si BOUTIQUE_DB_URL + BOUTIQUE_DB_KEY (clé service de SA
 *                                propre base, jamais celle d'autrui) sont fournis, les
 *                                commandes survivent à tout. Voir bases/commandes.sql.
 */

const CATALOGUE = [
  { id: 'raphia', nom: 'Sac raphia tissé main', prix: 35000 },
  { id: 'vanille', nom: 'Panier de vanille (3 gousses)', prix: 28000 },
  { id: 'soie', nom: 'Tapis de soie sauvage — Ambositra', prix: 52000 },
]

const modeDurable = Boolean(process.env.BOUTIQUE_DB_URL && process.env.BOUTIQUE_DB_KEY)
const PREFIXE_REQUETES = {
  apikey: process.env.BOUTIQUE_DB_KEY || '',
  Authorization: 'Bearer ' + (process.env.BOUTIQUE_DB_KEY || ''),
  'Content-Type': 'application/json',
}

/* ---------- état en mémoire ---------- */
const commandesMemoire = new Map()

function nouveauCode() {
  return 'CMD-' + String(1000 + Math.floor(Math.random() * 9000))
}

/* ---------- Pont Supabase (optionnel, sa propre base) ---------- */
async function supabaseInserer(commande) {
  const reponse = await fetch(process.env.BOUTIQUE_DB_URL + '/rest/v1/commandes', {
    method: 'POST',
    headers: { ...PREFIXE_REQUETES, Prefer: 'return=representation' },
    body: JSON.stringify(commande),
  })
  if (!reponse.ok) throw new Error('base: ' + reponse.status + ' ' + (await reponse.text()))
  const lignes = await reponse.json()
  return lignes[0]
}

async function supabaseLireTout() {
  const reponse = await fetch(
    process.env.BOUTIQUE_DB_URL + '/rest/v1/commandes?select=*&order=date_creation.desc',
    { headers: PREFIXE_REQUETES }
  )
  if (!reponse.ok) throw new Error('base: ' + reponse.status)
  return reponse.json()
}

async function supabaseLireUne(code) {
  const reponse = await fetch(
    process.env.BOUTIQUE_DB_URL + '/rest/v1/commandes?select=*&code=eq.' + encodeURIComponent(code),
    { headers: PREFIXE_REQUETES }
  )
  if (!reponse.ok) throw new Error('base: ' + reponse.status)
  const lignes = await reponse.json()
  return lignes[0] || null
}

/* ---------- Interface unique ---------- */
async function creer(donnees) {
  const article = CATALOGUE.find((a) => a.id === donnees.articleId) || null
  let commande
  for (let essai = 0; essai < 50; essai++) {
    commande = {
      code: nouveauCode(),
      nom: donnees.nom,
      numero: donnees.numero,
      article: article ? article.nom : donnees.articleId,
      prix: article ? article.prix : null,
      statut: 'ATTENTE_PAIEMENT',
      cree_le: new Date().toISOString(),
      paye_le: null,
      paye_par: null,
      sms_envoye_le: null,
      sms_task: null,
      sms_erreur: null,
    }
    if (!modeDurable && !commandesMemoire.has(commande.code)) break
    if (modeDurable) {
      const existante = await supabaseLireUne(commande.code)
      if (!existante) break
    }
  }
  if (!modeDurable) {
    commandesMemoire.set(commande.code, commande)
    return commande
  }
  return supabaseInserer(commande)
}

async function parCode(code) {
  if (!modeDurable) return commandesMemoire.get(code) || null
  return supabaseLireUne(code)
}

async function toutes() {
  if (!modeDurable) return [...commandesMemoire.values()].sort((a, b) => a.cree_le < b.cree_le ? 1 : -1)
  return supabaseLireTout()
}

async function mettreAJour(code, champs) {
  if (!modeDurable) {
    const commande = commandesMemoire.get(code)
    if (!commande) return null
    Object.assign(commande, champs)
    return commande
  }
  const reponse = await fetch(
    process.env.BOUTIQUE_DB_URL + '/rest/v1/commandes?code=eq.' + encodeURIComponent(code),
    { method: 'PATCH', headers: { ...PREFIXE_REQUETES, Prefer: 'return=representation' }, body: JSON.stringify(champs) }
  )
  if (!reponse.ok) throw new Error('base: ' + reponse.status + ' ' + (await reponse.text()))
  const lignes = await reponse.json()
  return lignes[0] || null
}

/** Marque la commande payée (idempotent : rester payée n'est pas une erreur). */
async function payer(code, detail) {
  const commande = await parCode(code)
  if (!commande) return null
  if (commande.statut === 'PAYEE') return commande
  return mettreAJour(code, { statut: 'PAYEE', paye_le: detail.recu_le, paye_par: detail.expediteur })
}

/** Note le sort du SMS de confirmation (succès ou échec honnête). */
async function noterEnvoiSms(code, resultat) {
  const champs = { sms_envoye_le: new Date().toISOString() }
  if (resultat.ok) {
    champs.sms_task = resultat.task_id || null
    champs.sms_erreur = null
  } else {
    champs.sms_erreur = resultat.erreur || 'échec inconnu'
  }
  return mettreAJour(code, champs)
}

module.exports = {
  CATALOGUE,
  modeDurable,
  creer,
  parCode,
  toutes,
  payer,
  noterEnvoiSms,
}
