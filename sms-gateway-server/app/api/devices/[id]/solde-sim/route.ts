import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'

/**
 * POST /api/devices/[id]/solde-sim
 *
 * Relevé du solde de la carte SIM, obtenu par code USSD (ex. #123#) exécuté
 * depuis le téléphone. L'appareil envoie ce que l'opérateur a répondu ; le
 * serveur ne fait AUCUN calcul de solde, il archive le relevé.
 *
 * Pourquoi garder `texte` (la réponse brute) et pas seulement le montant ?
 * Les formats changent d'un opérateur à l'autre, et l'appareil ne joint parfois
 * qu'une réponse incomplète. Conserver la source évite d'afficher un chiffre
 * inventé : la console montre le montant lu si on a su l'extraire, et la
 * réponse brute sinon.
 *
 * Corps attendu : { montant?: string, devise?: string, texte?: string, horodatage?: number }
 *
 * Ce n'est PAS un battement de cœur : le statut et la dernière activité de
 * l'appareil ne sont pas touchés ici (la scrutation s'en charge).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idAppareil } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Header Authorization manquant ou mal formé' },
        { status: 401 }
      )
    }
    const jeton = authHeader.substring(7)

    const appareil = await authentifierAppareil(idAppareil, jeton)
    if (!appareil) {
      return NextResponse.json(
        { error: 'Appareil inconnu ou token invalide' },
        { status: 401 }
      )
    }

    const corps = await request.json().catch(() => ({}))

    // Champs courts par nature : on borne pour ne pas laisser écrire un roman
    // dans la base depuis un appareil.
    const normaliser = (v: unknown, max: number): string | null => {
      if (typeof v !== 'string') return null
      const propre = v.trim()
      return propre ? propre.slice(0, max) : null
    }

    const montant = normaliser(corps?.montant, 40)
    const devise = normaliser(corps?.devise, 12)
    const texte = normaliser(corps?.texte, 500)

    if (!montant && !texte) {
      return NextResponse.json(
        { error: 'Relevé vide : montant ou texte requis' },
        { status: 400 }
      )
    }

    // Date du relevé : celle de l'appareil si elle est plausible, sinon
    // maintenant (une horloge déréglée ne doit pas dater le solde de 1970).
    const horodatage = Number(corps?.horodatage)
    const dateReleve =
      Number.isFinite(horodatage) &&
      horodatage > Date.now() - 7 * 24 * 3600 * 1000 &&
      horodatage <= Date.now() + 3600 * 1000
        ? new Date(horodatage).toISOString()
        : new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('appareil')
      .update({
        solde_sim: montant,
        solde_devise: devise,
        solde_texte: texte,
        solde_maj_le: dateReleve,
      })
      .eq('id', idAppareil)
      .select('id, solde_sim, solde_devise, solde_texte, solde_maj_le')
      .single()

    if (error) {
      console.error('Erreur Supabase (relevé de solde) :', error)
      // 42703 = colonne inexistante : migration non exécutée.
      if (error.code === '42703') {
        return NextResponse.json(
          {
            error: 'Colonnes de solde absentes',
            details:
              'Exécutez dans Supabase : ALTER TABLE appareils ADD COLUMN IF NOT EXISTS solde_sim TEXT; ' +
              'ALTER TABLE appareils ADD COLUMN IF NOT EXISTS solde_devise TEXT; ' +
              'ALTER TABLE appareils ADD COLUMN IF NOT EXISTS solde_texte TEXT; ' +
              'ALTER TABLE appareils ADD COLUMN IF NOT EXISTS solde_maj_le TIMESTAMPTZ;',
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du relevé', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Relevé enregistré', appareil: data }, { status: 200 })
  } catch (erreur) {
    console.error('Erreur inattendue (relevé de solde) :', erreur)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
