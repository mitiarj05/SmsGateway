import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { verifierCaptcha } from '@/lib/captcha'
import { obtenirOuCreerApplication } from '@/lib/compte-client'
import { poserCookieSessionClient } from '@/lib/session-client'

/**
 * POST /api/auth/inscription — inscription standard instantanée.
 * Corps: { prenom?, nom, email, mot_de_passe, captcha }.
 * Publique (hors matcher du proxy).
 *
 * Crée l'utilisateur Supabase Auth (e-mail confirmé d'office — modèle
 * d'accès immédiat), provisionne son application via
 * obtenirOuCreerApplication (anti-doublon avec les anciennes demandes) et
 * pose directement la session client → l'espace s'ouvre sans attendre.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const prenom = typeof corps?.prenom === 'string' ? corps.prenom.trim().slice(0, 80) : ''
  const nom = typeof corps?.nom === 'string' ? corps.nom.trim().slice(0, 80) : ''
  const email = typeof corps?.email === 'string' ? corps.email.trim().toLowerCase() : ''
  const motDePasse = typeof corps?.mot_de_passe === 'string' ? corps.mot_de_passe : ''

  if (!nom) {
    return NextResponse.json({ error: 'Indiquez votre nom ou celui de votre société' }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Indiquez une adresse e-mail valide' }, { status: 400 })
  }
  if (motDePasse.length < 8) {
    return NextResponse.json({ error: 'Mot de passe : 8 caractères minimum' }, { status: 400 })
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const captcha = await verifierCaptcha(corps?.captcha, ip)
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.raison ?? 'Vérification anti-robot requise' }, { status: 403 })
  }

  try {
    const nomComplet = (prenom ? `${prenom} ${nom}` : nom).slice(0, 80)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
      user_metadata: { nom_complet: nomComplet },
    })
    if (error || !data?.user) {
      const message = (error?.message ?? '').toLowerCase()
      const existe = error?.code === 'email_exists' || message.includes('already')
      return NextResponse.json(
        {
          error: existe
            ? 'Un compte existe déjà avec cet e-mail — connectez-vous.'
            : 'Inscription impossible — réessayez.',
        },
        { status: existe ? 409 : 500 }
      )
    }
    const compte = await obtenirOuCreerApplication(data.user.id, email, nomComplet)
    const reponse = NextResponse.json({ ok: true })
    poserCookieSessionClient(reponse, compte.applicationId)
    return reponse
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Compte suspendu')) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
