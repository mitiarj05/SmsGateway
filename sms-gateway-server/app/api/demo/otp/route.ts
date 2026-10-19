import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { envoyerPushNouvelleTache } from '@/lib/envoi-push'
import { normaliserNumero } from '@/lib/entrant'
import { marquerAppareilsInactifs } from '@/lib/statut-appareil'
import { STATUT_APPAREIL, STATUT_TACHE } from '@/lib/statuts'

/**
 * POST /api/demo/otp — envoie un VRAI code de vérification par SMS.
 *
 * La démonstration emprunte la chaîne d'envoi de production : une tâche est
 * créée pour l'application de la passerelle en ligne, le téléphone la dépile et
 * envoie le SMS. Aucun « envoyé » de façade : s'il n'y a pas de téléphone en
 * ligne, on le dit au visiteur au lieu de faire semblant.
 *
 * Corps : { numero: string }
 *
 * PUT /api/demo/otp — vérifie le code saisi. Corps : { numero, code }
 *
 * Le code n'est PAS gardé en mémoire du serveur : il vit dans le contenu de la
 * tâche créée. Deux raisons — le redémarrage d'une instance (Vercel) ne doit pas
 * perdre les codes en cours, et retrouver la tâche prouve que le SMS a bien été
 * fabriqué pour ce numéro.
 */

const PREFIXE_DEMO = '[DEMO SMSTSIKA]'
const VALIDITE_CODE_MS = 5 * 60 * 1000
/** Deux demandes pour le même numéro à moins de 30 s : c'est un double clic. */
const ANTI_REBOND_MS = 30 * 1000

/** L'application qui envoie les SMS de démonstration. Par défaut : la passerelle en ligne. */
async function trouverPasserelle() {
  await marquerAppareilsInactifs()

  let requete = supabaseAdmin
    .from('appareils')
    .select('id, nom, jeton_fcm, id_application')
    .eq('statut', STATUT_APPAREIL.EN_LIGNE)
    .not('id_application', 'is', null)
    .order('derniere_activite', { ascending: false })
    .limit(1)

  // Épinglage possible : DEMO_ID_APPLICATION évite qu'une démonstration publique
  // consomme le crédit d'un client dont le téléphone se trouve en ligne.
  const applicationEpinglee = process.env.DEMO_ID_APPLICATION
  if (applicationEpinglee) {
    requete = requete.eq('id_application', applicationEpinglee)
  }

  const { data, error } = await requete.maybeSingle()
  if (error) {
    console.error('[demo/otp] Recherche de la passerelle impossible :', error.message)
    return null
  }
  return data
}

/** Dernière tâche de démonstration envoyée à ce numéro (la plus récente d'abord). */
async function derniereTacheDemo(numero: string) {
  const { data } = await supabaseAdmin
    .from('taches')
    .select('id, contenu, statut, date_creation')
    .eq('numero_destinataire', numero)
    .like('contenu', `${PREFIXE_DEMO}%`)
    .order('date_creation', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as { id: string; contenu: string; statut: string; date_creation: string } | null
}

export async function POST(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => null)
    const numeroBrut = typeof corps?.numero === 'string' ? corps.numero : ''
    const numero = normaliserNumero(numeroBrut)

    // Un numéro utilisable : indicatif optionnel, 8 à 15 chiffres.
    if (!/^\+?\d{8,15}$/.test(numero)) {
      return NextResponse.json(
        { error: 'Numéro invalide. Exemple : 034 00 000 00 ou +261 34 00 000 00.' },
        { status: 400 }
      )
    }

    // 1. La passerelle : sans téléphone en ligne, rien ne partira.
    const passerelle = await trouverPasserelle()
    if (!passerelle) {
      return NextResponse.json(
        {
          error:
            'Aucune passerelle en ligne pour le moment. Ouvrez l’application Android et vérifiez qu’elle affiche « Appareil en ligne ».',
        },
        { status: 503 }
      )
    }

    // 2. Anti-rebond : le même numéro n'enchaîne pas deux démonstrations.
    const precedente = await derniereTacheDemo(numero)
    if (precedente) {
      const age = Date.now() - new Date(precedente.date_creation).getTime()
      if (age < ANTI_REBOND_MS) {
        return NextResponse.json(
          { error: 'Un code vient d’être envoyé à ce numéro. Patientez quelques secondes.' },
          { status: 429 }
        )
      }
    }

    // 3. Le code, puis la tâche : c'est elle que le téléphone enverra telle quelle.
    const codeOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const message = `${PREFIXE_DEMO} Votre code de vérification est : ${codeOtp}. Valable 5 minutes.`

    const { data: tache, error } = await supabaseAdmin
      .from('taches')
      .insert({
        numero_destinataire: numero,
        contenu: message,
        statut: STATUT_TACHE.EN_ATTENTE,
        // L'application de la passerelle : c'est par elle que le téléphone
        // réclame ses tâches (il ignore celles des autres espaces).
        id_application: passerelle.id_application,
      })
      .select('id, date_creation')
      .single()

    if (error || !tache) {
      console.error('[demo/otp] Création de la tâche impossible :', error?.message)
      return NextResponse.json(
        { error: 'Impossible de préparer l’envoi du SMS.' },
        { status: 500 }
      )
    }

    // 4. Réveil immédiat du téléphone (la scrutation l'aurait pris dans ~30 s).
    let pushEnvoye = false
    if (passerelle.jeton_fcm) {
      try {
        pushEnvoye = await envoyerPushNouvelleTache(passerelle.jeton_fcm, tache.id)
      } catch (erreurPush) {
        console.warn('[demo/otp] Push FCM refusé (non bloquant) :', erreurPush)
      }
    }

    return NextResponse.json(
      {
        message: 'Code généré : le téléphone passerelle l’envoie par SMS.',
        tacheId: tache.id,
        numero,
        passerelle: passerelle.nom,
        push_envoye: pushEnvoye,
        // Filet de sécurité pour une démonstration sans téléphone sous la main :
        // l'interface le cache derrière un clic, le vrai chemin reste le SMS.
        code_demo_debug: codeOtp,
      },
      { status: 201 }
    )
  } catch (erreur) {
    console.error('[demo/otp] Erreur inattendue :', erreur)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => null)
    const numero = normaliserNumero(typeof corps?.numero === 'string' ? corps.numero : '')
    const codeSaisi = typeof corps?.code === 'string' ? corps.code.trim() : ''

    if (!numero || !/^\d{6}$/.test(codeSaisi)) {
      return NextResponse.json(
        { error: 'Le numéro et un code à 6 chiffres sont obligatoires.' },
        { status: 400 }
      )
    }

    const tache = await derniereTacheDemo(numero)
    if (!tache) {
      return NextResponse.json(
        { error: 'Aucun code n’a été demandé pour ce numéro. Demandez-en un nouveau.' },
        { status: 400 }
      )
    }

    if (Date.now() - new Date(tache.date_creation).getTime() > VALIDITE_CODE_MS) {
      return NextResponse.json(
        { error: 'Ce code a expiré (5 minutes). Demandez-en un nouveau.' },
        { status: 400 }
      )
    }

    const codeAttendu = tache.contenu.match(/(\d{6})/)?.[1] ?? null
    if (!codeAttendu || codeAttendu !== codeSaisi) {
      return NextResponse.json(
        { error: 'Code incorrect. Vérifiez le SMS reçu.' },
        { status: 400 }
      )
    }

    // Le statut de la tâche dit si la passerelle a réellement envoyé le SMS :
    // c'est la seule preuve d'un envoi, le code n'en est pas une.
    return NextResponse.json(
      {
        valide: true,
        message: 'Code correct.',
        envoi: tache.statut,
        envoye: tache.statut === STATUT_TACHE.ENVOYE,
      },
      { status: 200 }
    )
  } catch (erreur) {
    console.error('[demo/otp PUT] Erreur inattendue :', erreur)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
