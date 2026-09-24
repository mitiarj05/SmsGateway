import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { authentifierAppareil } from '@/lib/authentification'
import { obtenirUsageAppareil } from '@/lib/selection-appareil'
import { STATUT_APPAREIL, STATUT_TACHE } from '@/lib/statuts'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tacheId: string }> }
) {
  try {
    const brut = await params
    const idAppareil = brut.id
    const tacheId = brut.tacheId

    if (!tacheId) {
      return NextResponse.json(
        { error: 'Paramètre tâche manquant' },
        { status: 400 }
      )
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
    const { statut, error_message } = corps

    const statutsValides = [STATUT_TACHE.RECLAME, STATUT_TACHE.ENVOYE, STATUT_TACHE.ECHOUE]
    if (!statut || !statutsValides.includes(statut)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${statutsValides.join(', ')}` },
        { status: 400 }
      )
    }

    // Vérifier que la tâche n'appartient pas déjà à un autre appareil
    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('taches')
      .select('id, id_appareil, statut')
      .eq('id', tacheId)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json(
        { error: 'Tâche introuvable' },
        { status: 404 }
      )
    }

    // Anti-doublon / idempotence : si la tâche est déjà ENVOYE/ECHOUE...
    // - retry du même statut (cas Piège 3 : le SMS est parti, la 1re
    //   confirmation a été perdue à cause du WiFi, le téléphone retry) → 200 OK
    // - tentative de CHANGER un état final → 409 Conflict
    if (existant.statut === STATUT_TACHE.ENVOYE || existant.statut === STATUT_TACHE.ECHOUE) {
      if (existant.statut === statut) {
        return NextResponse.json(
          {
            message: 'Statut déjà confirmé (idempotent)',
            task: existant,
          },
          { status: 200 }
        )
      }
      return NextResponse.json(
        {
          error: 'Tâche déjà finalisée',
          current_status: existant.statut,
        },
        { status: 409 }  // Conflict
      )
    }

    // Anti-doublon : si la tâche est assignée à un AUTRE appareil, on refuse
    if (existant.id_appareil && existant.id_appareil !== idAppareil) {
      return NextResponse.json(
        {
          error: 'Tâche déjà assignée à un autre appareil',
          assigned_to: existant.id_appareil,
        },
        { status: 409 }
      )
    }

    // Construction de la mise à jour
    const donneesMaj: Record<string, unknown> = {
      statut: statut,
      date_modification: new Date().toISOString(),
    }

    if (statut === STATUT_TACHE.RECLAME) {
      donneesMaj.id_appareil = idAppareil
      donneesMaj.reclave_a = new Date().toISOString()
    } else {
      // ENVOYE / ECHOUE : on garde la traçabilité de l'appareil qui a fait le travail.
      // Si la tâche vient de EN_ATTENTE (id_appareil NULL), on l'attribue.
      // Si elle est déjà réclamée par cet appareil, on ne touche pas au lease.
      if (!existant.id_appareil) {
        donneesMaj.id_appareil = idAppareil
        donneesMaj.reclave_a = new Date().toISOString()
      }
    }

    if (statut === STATUT_TACHE.ECHOUE && error_message) {
      donneesMaj.message_erreur = error_message
    }

    const { data, error } = await supabaseAdmin
      .from('taches')
      .update(donneesMaj)
      .eq('id', tacheId)
      .select('id, numero_destinataire, contenu, statut, id_appareil, reclame_a, date_modification')
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour', details: error.message },
        { status: 500 }
      )
    }

    // Compteurs horaires de l'appareil : recalculés sur la dernière heure glissante
    // (pas d'incrément simple, sinon ils ne redescendraient jamais).
    // Seul un passage en ENVOYE les fait bouger ; les lectures les calculent en live.
    if (statut === STATUT_TACHE.ENVOYE) {
      const usage = await obtenirUsageAppareil(idAppareil)
      await supabaseAdmin
        .from('appareils')
        .update({ sms_envoyes_heure: usage })
        .eq('id', idAppareil)
    }

    // Ne jamais réactiver un appareil DESACTIVE via la scrutation/confirmations.
    // Toute confirmation prouve l'activité : l'appareil reste EN_LIGNE
    // (pas de statut "occupé" dans l'enum réel).
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
        .update({
          derniere_activite: new Date().toISOString(),
        })
        .eq('id', idAppareil)
    }

    return NextResponse.json(
      {
        message: 'Statut mis à jour',
        task: data,
      },
      { status: 200 }
    )
  } catch (erreur) {
    console.error('Erreur inattendue:', erreur)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
