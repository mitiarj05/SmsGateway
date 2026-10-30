import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { EVENEMENTS_DISPONIBLES, fabriquerSecretSignature, enfilerEvenement, traiterEvenementsEnAttente } from '@/lib/evenements'

/**
 * GET /api/api-clients/[id]?reveler=1 — renvoie la clé API complète (admin).
 * Sans le paramètre, renvoie la fiche masquée. La clé n'est exposée
 * qu'au clic explicite depuis le dashboard.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (request.nextUrl.searchParams.get('reveler') !== '1') {
      const { data, error } = await supabaseAdmin
        .from('client')
        .select('id, nom, date_creation')
        .eq('id', id)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
      }
      return NextResponse.json({ client: data })
    }
    const { data, error } = await supabaseAdmin
      .from('client')
      .select('id, cle_api')
      .eq('id', id)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
    }
    return NextResponse.json({ id: data.id, cle_api: data.cle_api })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/** DELETE /api/api-clients/[id] — révoque une clé API */export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: existant, error: erreurRecup } = await supabaseAdmin
      .from('client')
      .select('id')
      .eq('id', id)
      .single()

    if (erreurRecup || !existant) {
      return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
    }

    // Détacher les tâches liées (clé étrangère) en gardant l'historique.
    const { error: erreurDetachement } = await supabaseAdmin
      .from('tache')
      .update({ id_application: null })
      .eq('id_application', id)

    if (erreurDetachement) {
      return NextResponse.json({ error: erreurDetachement.message }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('client')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Clé révoquée', id })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * PATCH /api/api-clients/[id] — configuration webhooks.
 * Corps: { url_application?: string | null, evenements_souscrits?: string[],
 *   evenements_actifs?: boolean, regenerer_secret?: boolean, tester?: boolean }
 * Le secret n'est renvoyé en clair QU'À sa (re)génération.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const corps = await request.json().catch(() => null)
    if (!corps || typeof corps !== 'object') {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const { data: existant } = await supabaseAdmin
      .from('client')
      .select('id, secret_signature')
      .eq('id', id)
      .single()
    if (!existant) {
      return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
    }

    const maj: Record<string, unknown> = {}
    if ('url_application' in corps) {
      const url = corps.url_application
      if (url !== null && (typeof url !== 'string' || !/^https:\/\/.+/.test(url.trim()))) {
        return NextResponse.json(
          { error: 'Le champ "url_application" doit être une URL HTTPS valide ou null' },
          { status: 400 }
        )
      }
      maj.url_application = url === null ? null : (url as string).trim()
    }
    if ('evenements_souscrits' in corps) {
      const liste = corps.evenements_souscrits
      if (!Array.isArray(liste) || !liste.every((e) => (EVENEMENTS_DISPONIBLES as readonly string[]).includes(e))) {
        return NextResponse.json(
          { error: `Événements acceptés : ${EVENEMENTS_DISPONIBLES.join(', ')}` },
          { status: 400 }
        )
      }
      maj.evenements_souscrits = liste
    }
    if ('evenements_actifs' in corps) {
      if (typeof corps.evenements_actifs !== 'boolean') {
        return NextResponse.json({ error: 'Le champ "evenements_actifs" doit être un booléen' }, { status: 400 })
      }
      maj.evenements_actifs = corps.evenements_actifs
    }
    if ('suspendu' in corps) {
      if (typeof corps.suspendu !== 'boolean') {
        return NextResponse.json({ error: 'Le champ "suspendu" doit être un booléen' }, { status: 400 })
      }
      maj.suspendu = corps.suspendu
    }

    let secretVisible: string | null = null
    if (corps.regenerer_secret === true || ('url_application' in corps && maj.url_application && !existant.secret_signature)) {
      secretVisible = fabriquerSecretSignature()
      maj.secret_signature = secretVisible
    }

    if (Object.keys(maj).length > 0) {
      const { error } = await supabaseAdmin
        .from('client')
        .update(maj)
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const { data: client } = await supabaseAdmin
      .from('client')
      .select('id, nom, url_application, evenements_souscrits, evenements_actifs')
      .eq('id', id)
      .single()
    let test: Record<string, unknown> | null = null
    if (corps.tester === true) {
      const idCharge = await enfilerEvenement(id, 'sms.recu', {
        test: true,
        message_test: 'Ping de test depuis le dashboard SMSTSIKA',
      })
      const resultat = await traiterEvenementsEnAttente()
      test = { en_file: !!idCharge, ...resultat }
    }

    return NextResponse.json({
      message: 'Configuration notifications enregistrée',
      client,
      ...(secretVisible ? { secret_signature_visible: secretVisible } : {}),
      ...(test ? { test } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
