/**
 * Outils de branchement « Boutique Tsika » côté SMSTSIKA (à exécuter ICI, pas en prod).
 *
 *   node scripts/outils.mjs init                       → crée la fiche client + écrit .env.local
 *   node scripts/outils.mjs webhook <url>              → enregistre l'URL du récepteur
 *   node scripts/outils.mjs appareils                  → liste les appareils (pour choisir)
 *   node scripts/outils.mjs lier <idAppareil>          → le téléphone devient la passerelle de la boutique
 *   node scripts/outils.mjs rendre                     → le téléphone regagne son ancienne application
 *
 * Secrets : lus dans ../sms-gateway-server/.env.local, jamais affichés en clair.
 * Le fichier boutique-tsika/.env.local contient la clé de la boutique — gitignore,
 * à copier aussi dans les variables d'environnement Vercel de la boutique.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const cheminEnvServeur = join(racine, '..', 'sms-gateway-server', '.env.local')
const cheminEnvBoutique = join(racine, '.env.local')
const cheminBrouillon = join(racine, '.téléphone.brouillon.json')
const NOM_APPLICATION = 'Boutique Tsika'

/* ---------- lecture du .env du serveur (clé de service) ---------- */
function lireEnvServeur() {
  if (!existsSync(cheminEnvServeur)) {
    throw new Error('sms-gateway-server/.env.local introuvable — lancez ce script depuis le dépôt complet.')
  }
  const contenu = readFileSync(cheminEnvServeur, 'utf-8')
  const valeurs = {}
  for (const ligne of contenu.split(/\r?\n/)) {
    const morceau = /^([A-Z0-9_]+)=(.*)$/.exec(ligne.trim())
    if (morceau) valeurs[morceau[1]] = morceau[2]
  }
  const lienBase = valeurs.NEXT_PUBLIC_SUPABASE_URL
  const cleService = valeurs.SUPABASE_SERVICE_ROLE_KEY
  if (!lienBase || !cleService) throw new Error('Clé de service absente de sms-gateway-server/.env.local')
  return { lienBase: lienBase.replace(/\/+$/, ''), cleService }
}

function enTetesRest(cleService, extra = {}) {
  return { apikey: cleService, Authorization: 'Bearer ' + cleService, 'Content-Type': 'application/json', ...extra }
}

function masquer(cle) {
  return String(cle).slice(0, 8) + '…' + String(cle).slice(-4)
}

async function rest(lienBase, cleService, chemin, options = {}) {
  const reponse = await fetch(lienBase + chemin, {
    ...options,
    headers: enTetesRest(cleService, options.headers || {}),
  })
  return reponse
}

/* ---------- init ---------- */
async function init() {
  const { lienBase, cleService } = lireEnvServeur()

  // 1. Fiche existante ? (idempotent : on ne fabrique jamais deux clés pour rien)
  let reponse = await rest(lienBase, cleService, `/rest/v1/applications?select=*&nom=eq.${encodeURIComponent(NOM_APPLICATION)}`)
  const existantes = await reponse.json()
  let fiche = Array.isArray(existantes) && existantes[0] ? existantes[0] : null

  const changements = {
    evenements_notification: ['sms.recu'],
    notifications_actives: true,
    suspendu: false,
    quota_mensuel: null,
    user_id: null,
    email: null,
  }
  if (!fiche) {
    changements.nom = NOM_APPLICATION
    changements.cle_api = 'cle_' + randomBytes(16).toString('hex')
    changements.secret_notification = randomBytes(32).toString('hex')
    reponse = await rest(lienBase, cleService, '/rest/v1/applications', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(changements),
    })
    if (!reponse.ok) throw new Error('création impossible : ' + (await reponse.text()))
    fiche = (await reponse.json())[0]
    console.log('Fiche client créée :', fiche.id)
  } else {
    const completions = { ...changements }
    if (!fiche.cle_api) completions.cle_api = 'cle_' + randomBytes(16).toString('hex')
    if (!fiche.secret_notification) completions.secret_notification = randomBytes(32).toString('hex')
    reponse = await rest(lienBase, cleService, `/rest/v1/applications?id=eq.${fiche.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(completions),
    })
    if (!reponse.ok) throw new Error('mise à jour impossible : ' + (await reponse.text()))
    fiche = (await reponse.json())[0]
    console.log('Fiche client retrouvée et complétée :', fiche.id)
  }

  // 2. Écrire .env.local de la boutique (gitignore) : la clé + le secret du webhook.
  const url = (process.env.SMSTSIKA_URL || 'https://smstsika.vercel.app').replace(/\/+$/, '')
  const numero = process.env.SMSTSIKA_NUMERO_PAIEMENT || fiche.numero_paiement || ''
  const contenu = [
    '# Boutique Tsika — branchement SMS (voir README.md). Ne commite jamais ce fichier.',
    'SMSTSIKA_URL=' + url,
    'SMSTSIKA_CLE_API=' + fiche.cle_api,
    'SMSTSIKA_SECRET=' + (fiche.secret_notification || ''),
    'SMSTSIKA_NUMERO_PAIEMENT=' + numero,
    '',
  ].join('\n')
  writeFileSync(cheminEnvBoutique, contenu, 'utf-8')

  console.log('')
  console.log('Clé API        :', masquer(fiche.cle_api))
  console.log('Secret webhook :', masquer(fiche.secret_notification || ''))
  console.log('URL webhook    :', fiche.url_notification || '(pas encore enregistrée — commandes : webhook <url>)')
  console.log('')
  console.log('→ boutique-tsika/.env.local écrit. Copiez ces 4 variables dans l\'environnement Vercel de la boutique.')
}

/* ---------- webhook <url> ---------- */
async function webhook(url) {
  if (!url) throw new Error('Donnez l\'URL : node scripts/outils.mjs webhook https://…/api/boutique')
  const { lienBase, cleService } = lireEnvServeur()
  const fiche = await trouverFiche(lienBase, cleService)
  const reponse = await rest(lienBase, cleService, `/rest/v1/applications?id=eq.${fiche.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ url_notification: url }),
  })
  if (!reponse.ok) throw new Error('échec : ' + (await reponse.text()))
  console.log('URL webhook enregistrée pour', NOM_APPLICATION, '→', url)
}

/* ---------- appareils ---------- */
async function trouverFiche(lienBase, cleService) {
  const reponse = await rest(lienBase, cleService, `/rest/v1/applications?select=*&nom=eq.${encodeURIComponent(NOM_APPLICATION)}`)
  const lignes = await reponse.json()
  const fiche = Array.isArray(lignes) && lignes[0] ? lignes[0] : null
  if (!fiche) throw new Error('Aucune fiche « ' + NOM_APPLICATION + ' » — lancez d\'abord : node scripts/outils.mjs init')
  return fiche
}

const ERREUR_MIGRATION = "Colonne « id_applications_supplementaires » absente — exécutez d'abord le SQL de migration dans le Supabase Dashboard (voir README)."

async function appareils() {
  const { lienBase, cleService } = lireEnvServeur()
  let reponse = await rest(lienBase, cleService, '/rest/v1/appareils?select=id,nom,statut,id_application,id_applications_supplementaires&order=date_creation.desc')
  if (!reponse.ok) {
    // Avant migration : on retombe sur les seules colonnes historiques.
    reponse = await rest(lienBase, cleService, '/rest/v1/appareils?select=id,nom,statut,id_application&order=date_creation.desc')
  }
  const lignes = await reponse.json()
  for (const a of lignes) {
    const serve = Array.isArray(a.id_applications_supplementaires) && a.id_applications_supplementaires.length > 0
      ? '  · sert ' + a.id_applications_supplementaires.map((x) => String(x).slice(0, 8)).join(', ')
      : ''
    console.log((a.id || '').slice(0, 8), '…', a.nom, '·', a.statut, '· app', (a.id_application || '—').slice(0, 8), serve)
  }
}

/* ---------- lier / rendre : le téléphone reste chez son propriétaire,
   la boutique devient simplement BÉNÉFICIAIRE de sa passerelle ---------- */
async function lier(idAppareil) {
  if (!idAppareil) throw new Error('Donnez l\'id de l\'appareil (voir : node scripts/outils.mjs appareils)')
  const { lienBase, cleService } = lireEnvServeur()
  const fiche = await trouverFiche(lienBase, cleService)
  const reponse = await rest(lienBase, cleService, '/rest/v1/appareils?select=id,nom,id_application,id_applications_supplementaires')
  if (!reponse.ok) throw new Error(ERREUR_MIGRATION)
  const liste = await reponse.json()
  const appareil = Array.isArray(liste) ? liste.find((a) => String(a.id).startsWith(idAppareil)) : null
  if (!appareil) throw new Error('Appareil introuvable pour le préfixe ' + idAppareil)

  const changements = {}
  // Réparation d'un ancien transfert complet : le téléphone regagne son espace.
  const brouillon = existsSync(cheminBrouillon) ? JSON.parse(readFileSync(cheminBrouillon, 'utf-8')) : null
  if (appareil.id_application === fiche.id && brouillon && brouillon.ancienne_application) {
    changements.id_application = brouillon.ancienne_application
  }
  const benefices = new Set((appareil.id_applications_supplementaires ?? []).filter(Boolean))
  benefices.add(fiche.id)
  changements.id_applications_supplementaires = [...benefices]

  const maj = await rest(lienBase, cleService, `/rest/v1/appareils?id=eq.${appareil.id}`, {
    method: 'PATCH',
    body: JSON.stringify(changements),
  })
  if (!maj.ok) throw new Error('échec de la liaison : ' + (await maj.text()))
  const reparé = changements.id_application
    ? ' (espace principal réparé : ' + String(changements.id_application).slice(0, 8) + '…)'
    : ''
  console.log(appareil.nom, '→ reste dans son espace principal' + reparé + ', et sert désormais « ' + NOM_APPLICATION + ' » comme passerelle partagée.')
}

async function rendre() {
  const { lienBase, cleService } = lireEnvServeur()
  const fiche = await trouverFiche(lienBase, cleService)
  const reponse = await rest(lienBase, cleService, '/rest/v1/appareils?select=id,nom,id_application,id_applications_supplementaires')
  if (!reponse.ok) throw new Error(ERREUR_MIGRATION)
  const liste = await reponse.json()
  const brouillon = existsSync(cheminBrouillon) ? JSON.parse(readFileSync(cheminBrouillon, 'utf-8')) : null
  let touche = false
  for (const appareil of liste) {
    const sertLaBoutique = Array.isArray(appareil.id_applications_supplementaires) && appareil.id_applications_supplementaires.includes(fiche.id)
    const ancienTransfert = appareil.id_application === fiche.id
    if (!sertLaBoutique && !ancienTransfert) continue
    const changements = {}
    if (sertLaBoutique) {
      changements.id_applications_supplementaires = appareil.id_applications_supplementaires.filter((x) => x !== fiche.id)
    }
    if (ancienTransfert) {
      if (brouillon && brouillon.ancienne_application && brouillon.appareil === appareil.id) {
        changements.id_application = brouillon.ancienne_application
      } else {
        console.warn('⚠', appareil.nom, 'a « ' + NOM_APPLICATION + ' » comme espace principal mais je ne connais plus l\'ancien — rendez-le à la main (QR/espace ou SQL).')
        continue
      }
    }
    const maj = await rest(lienBase, cleService, `/rest/v1/appareils?id=eq.${appareil.id}`, {
      method: 'PATCH',
      body: JSON.stringify(changements),
    })
    if (!maj.ok) throw new Error('échec du rendu : ' + (await maj.text()))
    console.log(appareil.nom, '→ rendu à son espace principal, plus aucun bénéfice partagé.')
    touche = true
  }
  if (existsSync(cheminBrouillon)) unlinkSync(cheminBrouillon)
  if (!touche) console.log('Rien à rendre : aucun appareil ne sert « ' + NOM_APPLICATION + ' ».')
}

/* ---------- aiguillage ---------- */
const [, , commande, ...arguments_2] = process.argv
if (commande === 'init') await init()
else if (commande === 'webhook') await webhook(arguments_2[0])
else if (commande === 'appareils') await appareils()
else if (commande === 'lier') await lier(arguments_2[0])
else if (commande === 'rendre') await rendre()
else {
  console.log('Usage : node scripts/outils.mjs init | webhook <url> | appareils | lier <idAppareil> | rendre')
}
