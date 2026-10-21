import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { verifierCompteFirebase } from '@/lib/authentification'
import { STATUT_APPAREIL } from '@/lib/statuts'

/**
 * POST /api/appareils/auto-lier — lie CE téléphone à l'espace du client
 * connecté sur l'app mobile. Publique (auto-authentifiante, hors matcher).
 *
 * Corps: { nom, android_id, id_token? } (Google natif) ou
 *        { nom, android_id, email, mot_de_passe } (compte standard).
 *
 * 1. Résout l'application : Firebase (uid → e-mail) ou Supabase (user_id).
 *    Sans espace : 404 (créer un compte d'abord). Suspendu : 403.
 * 2. Retrouve l'appareil par android_id (pas de doublon), sinon le crée,
 *    puis le lie à l'espace. Renvoie { device: { id, token } } — même
 *    contrat que /api/devices/register pour réutilisation côté app.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const nom = (
    typeof corps?.nom === 'string' && corps.nom.trim() ? corps.nom.trim() : 'Téléphone Android'
  ).slice(0, 80)
  const androidId =
    typeof corps?.android_id === 'string' && corps.android_id.trim()
      ? corps.android_id.trim().slice(0, 128)
      : null
  if (!androidId) {
    return NextResponse.json({ error: 'Identifiant matériel manquant (android_id)' }, { status: 400 })
  }

  try {
    let applicationId: string | null = null
    let uidFirebase: string | null = null

    if (typeof corps?.id_token === 'string' && corps.id_token) {
      const compte = await verifierCompteFirebase(corps.id_token)
      if (!compte) {
        return NextResponse.json({ error: 'Jeton Google invalide' }, { status: 401 })
      }
      uidFirebase = compte.uid
      // L'application se déduit : e-mail vérifié, sinon UID Firebase.
      if (compte.email) {
        const { data: parEmail } = await supabaseAdmin
          .from('client')
          .select('id')
          .ilike('email', compte.email)
          .order('date_creation', { ascending: false })
          .limit(1)
        applicationId = (parEmail?.[0] as { id: string } | undefined)?.id ?? null
      }
      if (!applicationId) {
        const { data: parUidApp } = await supabaseAdmin
          .from('client')
          .select('id')
          .eq('uid_firebase', compte.uid)
          .order('date_creation', { ascending: false })
          .limit(1)
        applicationId = (parUidApp?.[0] as { id: string } | undefined)?.id ?? null
      }
    } else if (typeof corps?.email === 'string' && typeof corps?.mot_de_passe === 'string') {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const cleAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !cleAnon) {
        return NextResponse.json({ error: 'Serveur non configuré' }, { status: 503 })
      }
      const supa = createClient(url, cleAnon)
      const { data, error } = await supa.auth.signInWithPassword({
        email: corps.email.trim(),
        password: corps.mot_de_passe,
      })
      if (error || !data?.user) {
        return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
      }
      const { data: parUser } = await supabaseAdmin
        .from('client')
        .select('id')
        .eq('user_id', data.user.id)
        .order('date_creation', { ascending: false })
        .limit(1)
      applicationId = (parUser?.[0] as { id: string } | undefined)?.id ?? null
    } else {
      return NextResponse.json(
        { error: 'Authentification requise (id_token ou email + mot_de_passe)' },
        { status: 400 }
      )
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Aucun espace associé à ce compte — inscrivez-vous d\u2019abord.' },
        { status: 404 }
      )
    }
    const { data: app } = await supabaseAdmin
      .from('client')
      .select('id, suspendu')
      .eq('id', applicationId)
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
      .from('appareil')
      .select('id, jeton')
      .eq('android_id', androidId)
      .order('date_creation', { ascending: false })
      .limit(1)
    if (existants?.[0]) {
      const existant = existants[0] as { id: string; jeton: string }
      await supabaseAdmin
        .from('appareil')
        .update({
          id_application: applicationId,
          nom,
          ...(uidFirebase ? { uid_firebase: uidFirebase } : {}),
        })
        .eq('id', existant.id)
      return NextResponse.json({
        ok: true,
        device: { id: existant.id, token: existant.jeton },
      })
    }

    const jeton = randomBytes(32).toString('hex')
    const { data: cree, error: erreurInsert } = await supabaseAdmin
      .from('appareil')
      .insert({
        nom,
        jeton,
        statut: STATUT_APPAREIL.HORS_LIGNE,
        id_application: applicationId,
        android_id: androidId,
        ...(uidFirebase ? { uid_firebase: uidFirebase } : {}),
      })
      .select('id')
      .single()
    if (erreurInsert || !cree) {
      return NextResponse.json({ error: erreurInsert?.message ?? 'Enregistrement impossible' }, { status: 500 })
    }
    return NextResponse.json(
      { ok: true, device: { id: (cree as { id: string }).id, token: jeton } },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
