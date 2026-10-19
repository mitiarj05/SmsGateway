import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'
import { STATUT_APPAREIL, LIVRAISON, LIVRAISON_VALEURS } from '@/lib/statuts'

/**
 * POST /api/devices/[id]/tasks/[tacheId]/livraison
 *
 * Accusé de réception RÉSEAU (DLR) remonté par le téléphone quand l'opérateur
 * confirme — ou refuse — la remise du SMS au destinataire.
 *
 * Route volontairement SÉPARÉE de /status :
 *  - le DLR arrive souvent plusieurs minutes APRÈS l'envoi, quand la tâche est
 *    déjà ENVOYE (état final) : /status répondrait 409 « déjà finalisée » ;
 *  - le statut d'envoi ne doit jamais être réécrit par un accusé de livraison,
 *    car facturation, quotas et statistiques s'appuient sur ENVOYE.
 *
 * Idempotence : un rejeu du même accusé répond 200, et un LIVRE déjà
 * enregistré n'est jamais dégradé en ECHEC_LIVRAISON (l'information la plus
 * forte gagne).
 *
 * Corps attendu : { livraison: 'LIVRE' | 'ECHEC_LIVRAISON', code?: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tacheId: string }> }
) {
  try {
    const brut = await params
    const idAppareil = brut.id
    const tacheId = brut.tacheId

    if (!tacheId) {
      return NextResponse.json({ error: 'Paramètre tâche manquant' }, { status: 400 })
    }

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

    const corps = await request.json()
    const { livraison, code } = corps

    if (!livraison || !LIVRAISON_VALEURS.includes(livraison)) {
      return NextResponse.json(
        { error: `Accusé invalide. Valeurs acceptées : ${LIVRAISON_VALEURS.join(', ')}` },
        { status: 400 }
      )
    }

    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('taches')
      .select('id, id_appareil, statut, livraison')
      .eq('id', tacheId)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    }

    // Un seul appareil fait autorité sur une tâche (même règle que /status).
    if (existant.id_appareil && existant.id_appareil !== idAppareil) {
      return NextResponse.json(
        { error: 'Tâche assignée à un autre appareil', assigned_to: existant.id_appareil },
        { status: 409 }
      )
    }

    // Idempotence : même accusé déjà enregistré → succès, rien à écrire.
    if (existant.livraison === livraison) {
      return NextResponse.json(
        { message: 'Accusé déjà enregistré (idempotent)', task: existant },
        { status: 200 }
      )
    }

    // Jamais de downgrade : un SMS livré le reste, même si un accusé tardif
    // de mauvaise qualité arrive ensuite (le réseau en émet parfois).
    if (existant.livraison === LIVRAISON.LIVRE) {
      return NextResponse.json(
        { message: 'Déjà livré : le premier accusé positif est conservé', task: existant },
        { status: 200 }
      )
    }

    const donneesMaj: Record<string, unknown> = {
      livraison,
      livre_le: new Date().toISOString(),
    }
    if (typeof code === 'number' && Number.isFinite(code)) {
      donneesMaj.livraison_code = Math.trunc(code)
    }

    const { data, error } = await supabaseAdmin
      .from('taches')
      .update(donneesMaj)
      .eq('id', tacheId)
      .select('id, statut, livraison, livre_le')
      .single()

    if (error) {
      console.error('Erreur Supabase (accusé de livraison) :', error)
      // 42703 = colonne inexistante : la migration n'a pas encore été exécutée.
      if (error.code === '42703') {
        return NextResponse.json(
          {
            error: 'Colonnes de livraison absentes',
            details:
              'Exécutez dans Supabase : ALTER TABLE taches ADD COLUMN IF NOT EXISTS livraison TEXT; ' +
              'ALTER TABLE taches ADD COLUMN IF NOT EXISTS livre_le TIMESTAMPTZ; ' +
              'ALTER TABLE taches ADD COLUMN IF NOT EXISTS livraison_code INTEGER;',
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de l'accusé", details: error.message },
        { status: 500 }
      )
    }

    // Toute remontée prouve que l'appareil est vivant (même règle que /status).
    if (appareil.statut !== STATUT_APPAREIL.DESACTIVE) {
      await supabaseAdmin
        .from('appareils')
        .update({
          statut: STATUT_APPAREIL.EN_LIGNE,
          derniere_activite: new Date().toISOString(),
        })
        .eq('id', idAppareil)
    } else {
      await supabaseAdmin
        .from('appareils')
        .update({ derniere_activite: new Date().toISOString() })
        .eq('id', idAppareil)
    }

    return NextResponse.json(
      { message: 'Accusé de livraison enregistré', task: data },
      { status: 200 }
    )
  } catch (erreur) {
    console.error('Erreur inattendue (accusé de livraison) :', erreur)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
