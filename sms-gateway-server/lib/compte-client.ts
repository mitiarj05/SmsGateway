import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase-serveur'

export interface ResultatCompte {
  applicationId: string
  /** true si l'espace vient d'être provisionné, false si retrouvé/existant. */
  cree: boolean
}

/**
 * Phase 1 — Comptes standard : retrouve ou provisionne l'application cliente
 * d'un utilisateur Supabase Auth, sans doublon.
 *
 * Ordre :
 * 1. application déjà liée (user_id) ;
 * 2. demande existante pour cet e-mail → on lie l'application du même nom
 *    (la plus récente) et on solde la demande ; sans application, on la
 *    provisionne (fin de l'attente manuelle) ;
 * 3. création fraîche (inscription instantanée).
 */
export async function obtenirOuCreerApplication(
  userId: string,
  email: string,
  nom: string
): Promise<ResultatCompte> {
  const courriel = email.trim().toLowerCase()
  const nomPropre = (nom.trim() || courriel.split('@')[0]).slice(0, 80)

  const { data: liee } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('user_id', userId)
    .order('date_creation', { ascending: false })
    .limit(1)
  if (liee?.[0]) {
    const id = (liee[0] as { id: string }).id
    await supabaseAdmin.from('applications').update({ email: courriel }).eq('id', id)
    await refuserSiSuspendu(id)
    return { applicationId: id, cree: false }
  }

  const { data: demandes } = await supabaseAdmin
    .from('demandes')
    .select('id, nom, statut')
    .ilike('contact', courriel)
    .order('date_creation', { ascending: false })
    .limit(1)
  const demande = demandes?.[0] as { id: string; nom: string; statut: string } | undefined

  if (demande && (demande.statut === 'VALIDEE' || demande.statut === 'EN_ATTENTE')) {
    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('nom', demande.nom)
      .order('date_creation', { ascending: false })
      .limit(1)
    if (apps?.[0]) {
      await supabaseAdmin
        .from('applications')
        .update({ user_id: userId, email: courriel })
        .eq('id', apps[0].id)
      if (demande.statut !== 'VALIDEE') {
        await supabaseAdmin
          .from('demandes')
          .update({ statut: 'VALIDEE', date_traitement: new Date().toISOString() })
          .eq('id', demande.id)
      }
      await refuserSiSuspendu(apps[0].id as string)
      return { applicationId: apps[0].id as string, cree: false }
    }
    const cleAttente = `cle_${randomBytes(16).toString('hex')}`
    const { data: provisionnee } = await supabaseAdmin
      .from('applications')
      .insert({ nom: demande.nom, cle_api: cleAttente, quota_mensuel: 100, user_id: userId, email: courriel })
      .select('id')
      .single()
    if (provisionnee) {
      await supabaseAdmin
        .from('demandes')
        .update({ statut: 'VALIDEE', date_traitement: new Date().toISOString() })
        .eq('id', demande.id)
      return { applicationId: provisionnee.id as string, cree: true }
    }
  }

  const cle = `cle_${randomBytes(16).toString('hex')}`
  const { data: nouvelle, error } = await supabaseAdmin
    .from('applications')
    .insert({ nom: nomPropre, cle_api: cle, quota_mensuel: 100, user_id: userId, email: courriel })
    .select('id')
    .single()
  if (error || !nouvelle) throw new Error('Création de l\u2019espace impossible')
  return { applicationId: nouvelle.id as string, cree: true }
}

/**
 * Variante Firebase (application Android native) : l'UID Firebase n'étant
 * pas un UUID, la liaison passe par `firebase_uid` (texte, sans FK).
 * Même anti-doublon : UID connu → demande validée rattachée → création.
 */
export async function obtenirOuCreerParFirebase(
  firebaseUid: string,
  email: string | null,
  nom: string
): Promise<ResultatCompte> {
  const courriel = (email ?? '').trim().toLowerCase()

  const { data: liee } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .order('date_creation', { ascending: false })
    .limit(1)
  if (liee?.[0]) {
    const id = (liee[0] as { id: string }).id
    if (courriel) {
      await supabaseAdmin.from('applications').update({ email: courriel }).eq('id', id)
    }
    await refuserSiSuspendu(id)
    return { applicationId: id, cree: false }
  }

  if (courriel) {
    // Rattachement direct : une application existe déjà pour cet e-mail.
    const { data: parEmail } = await supabaseAdmin
      .from('applications')
      .select('id')
      .ilike('email', courriel)
      .order('date_creation', { ascending: false })
      .limit(1)
    if (parEmail?.[0]) {
      const id = (parEmail[0] as { id: string }).id
      await supabaseAdmin.from('applications').update({ firebase_uid: firebaseUid }).eq('id', id)
      await refuserSiSuspendu(id)
      return { applicationId: id, cree: false }
    }
    const { data: demandes } = await supabaseAdmin
      .from('demandes')
      .select('id, nom, statut')
      .ilike('contact', courriel)
      .eq('statut', 'VALIDEE')
      .order('date_creation', { ascending: false })
      .limit(1)
    const demande = demandes?.[0] as { id: string; nom: string; statut: string } | undefined
    if (demande) {
      const { data: apps } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('nom', demande.nom)
        .order('date_creation', { ascending: false })
        .limit(1)
      if (apps?.[0]) {
        const id = (apps[0] as { id: string }).id
        await supabaseAdmin
          .from('applications')
          .update({ firebase_uid: firebaseUid, email: courriel })
          .eq('id', id)
        await refuserSiSuspendu(id)
        return { applicationId: id, cree: false }
      }
    }
  }

  const nomPropre = (nom.trim() || courriel.split('@')[0] || 'Client Android').slice(0, 80)
  const cle = `cle_${randomBytes(16).toString('hex')}`
  const { data: nouvelle, error } = await supabaseAdmin
    .from('applications')
    .insert({
      nom: nomPropre,
      cle_api: cle,
      quota_mensuel: 100,
      firebase_uid: firebaseUid,
      email: courriel || null,
    })
    .select('id')
    .single()
  if (error || !nouvelle) throw new Error('Création de l\u2019espace impossible')
  return { applicationId: (nouvelle as { id: string }).id, cree: true }
}

/**
 * Lève une erreur « Compte suspendu » si l'application est gelée par l'admin.
 * Tolérant pré-migration (colonne absente = non suspendu).
 */
async function refuserSiSuspendu(idApplication: string): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('suspendu')
      .eq('id', idApplication)
      .single()
    if (!error && data && (data as { suspendu?: boolean }).suspendu === true) {
      throw new Error('Compte suspendu — contactez votre administrateur.')
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Compte suspendu')) throw e
  }
}
