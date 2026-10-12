import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { verifierJetonFirebase } from '@/lib/authentification'
import { verifierCodeLiaison } from '@/lib/lien-qr'
import { STATUT_APPAREIL } from '@/lib/statuts'

/**
 * POST /api/appareils/lier-par-code — { code, nom, android_id }.
 * Publique (auto-authentifiée : Firebase + code signé, hors matcher).
 *
 * Consomme un code QR de liaison : vérifie la signature et l'expiration,
 * retrouve l'application (refuse si suspendue), lie ce téléphone
 * (anti-doublon par android_id dans l'espace) et renvoie ses identifiants
 * à mémoriser — même contrat que /api/devices/register.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const code = typeof corps?.code === 'string' ? corps.code : ''
  const nom = (
    typeof corps?.nom === 'string' && corps.nom.trim() ? corps.nom.trim() : 'Téléphone Android'
  ).slice(0, 80)
  const androidId =
    typeof corps?.android_id === 'string' && corps.android_id.trim()
      ? corps.android_id.trim().slice(0, 128)
      : null
  if (!code) {
    return NextResponse.json({ error: 'Code de liaison manquant' }, { status: 400 })
  }
  if (!androidId) {
    return NextResponse.json({ error: 'Identifiant matériel manquant (android_id)' }, { status: 400 })
  }

  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ID token Firebase manquant (Authorization: Bearer <jetonId>)' },
        { status: 401 }
      )
    }
    const uidFirebase = await verifierJetonFirebase(authHeader.substring(7))
    if (!uidFirebase) {
      return NextResponse.json({ error: 'ID token Firebase invalide' }, { status: 401 })
    }

    let idApplication: string | null = null
    try {
      idApplication = verifierCodeLiaison(code)
    } catch {
      idApplication = null
    }
    if (!idApplication) {
      return NextResponse.json({ error: 'Code invalide ou expiré — régénérez le QR.' }, { status: 410 })
    }
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, suspendu')
      .eq('id', idApplication)
      .single()
    if (!app) {
      return NextResponse.json({ error: 'Espace introuvable' }, { status: 404 })
    }
    if ((app as { suspendu?: boolean }).suspendu === true) {
      return NextResponse.json(
        { error: 'Compte suspendu — contactez votre administrateur.' },
        { status: 403 }
      )
    }

    const { data: existants } = await supabaseAdmin
      .from('appareils')
      .select('id, jeton')
      .eq('android_id', androidId)
      .order('date_creation', { ascending: false })
      .limit(1)
    if (existants?.[0]) {
      const existant = existants[0] as { id: string; jeton: string }
      await supabaseAdmin
        .from('appareils')
        .update({ id_application: idApplication, nom, uid_firebase: uidFirebase })
        .eq('id', existant.id)
      return NextResponse.json({
        ok: true,
        device: { id: existant.id, token: existant.jeton },
      })
    }

    const jeton = randomBytes(32).toString('hex')
    let cree: { id: string } | null = null
    let erreurInsert: { message?: string } | null = null
    const tentative = await supabaseAdmin
      .from('appareils')
      .insert({
        nom,
        jeton,
        statut: STATUT_APPAREIL.HORS_LIGNE,
        id_application: idApplication,
        android_id: androidId,
        uid_firebase: uidFirebase,
      })
      .select('id')
      .single()
    cree = tentative.data as { id: string } | null
    erreurInsert = tentative.error
    if (erreurInsert && /android_id/i.test(erreurInsert.message ?? '')) {
      // Pré-migration (colonne absente) : crée sans l'identifiant matériel.
      const repli = await supabaseAdmin
        .from('appareils')
        .insert({
          nom,
          jeton,
          statut: STATUT_APPAREIL.HORS_LIGNE,
          id_application: idApplication,
          uid_firebase: uidFirebase,
        })
        .select('id')
        .single()
      cree = repli.data as { id: string } | null
      erreurInsert = repli.error
    }
    if (erreurInsert || !cree) {
      return NextResponse.json(
        { error: (erreurInsert as { message?: string } | null)?.message ?? 'Liaison impossible' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { ok: true, device: { id: cree.id, token: jeton } },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
