import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { verifierCaptcha } from '@/lib/captcha'
import { obtenirOuCreerApplication } from '@/lib/compte-client'
import { poserCookieSessionClient } from '@/lib/session-client'
import { envoyerCourriel } from '@/lib/courriel'

/**
 * POST /api/auth/inscription — inscription en 2 temps (code par e-mail).
 * Corps: { nom, email, mot_de_passe, captcha?, renvoyer_code? }.
 * Publique (hors matcher du proxy).
 *
 * Flux :
 *   1. Crée l'utilisateur Supabase Auth (e-mail NON confirmé).
 *   2. Génère un code à 6 chiffres, l'envoie par e-mail, le stocke 15 min.
 *   3. Renvoie { code_envoye: true } → le front affiche l'étape vérification.
 *
 * Si le corps contient renvoyer_code: true, seule l'étape 2 est répétée
 * (le compte Supabase existe déjà, on renouvelle juste le code).
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const nom = typeof corps?.nom === 'string' ? corps.nom.trim().slice(0, 80) : ''
  const email = typeof corps?.email === 'string' ? corps.email.trim().toLowerCase() : ''
  const motDePasse = typeof corps?.mot_de_passe === 'string' ? corps.mot_de_passe : ''
  const renvoyerCode = corps?.renvoyer_code === true

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Indiquez une adresse e-mail valide' }, { status: 400 })
  }
  if (!renvoyerCode && !nom) {
    return NextResponse.json({ error: 'Indiquez votre nom ou celui de votre société' }, { status: 400 })
  }
  if (!renvoyerCode && motDePasse.length < 8) {
    return NextResponse.json({ error: 'Mot de passe : 8 caractères minimum' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const captcha = await verifierCaptcha(corps?.captcha, ip)
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.raison ?? 'Vérification anti-robot requise' }, { status: 403 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expireLe = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  try {
    // 1. Créer (ou retrouver) l'utilisateur Supabase Auth — email non confirmé.
    let utilisateurId: string
    let compteExistant = false

    if (!renvoyerCode) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: motDePasse,
        email_confirm: false,
        user_metadata: { nom_complet: nom },
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
      utilisateurId = data.user.id
    } else {
      // Renvoi de code : retrouver l'utilisateur par email (Supabase Auth).
      const { data: utilisateurs } = await supabaseAdmin.auth.admin.listUsers()
      const trouve = utilisateurs?.users?.find((u) => u.email?.toLowerCase() === email)
      if (!trouve) {
        return NextResponse.json({ error: 'Aucun compte trouvé pour cet e-mail.' }, { status: 404 })
      }
      utilisateurId = trouve.id
      compteExistant = true
    }

    // 2. Stocker le code (remplace tout code précédent pour cet email).
    await supabaseAdmin.from('validation').delete().eq('email', email)
    await supabaseAdmin.from('validation').insert({
      email,
      code,
      user_id: utilisateurId,
      nom: compteExistant ? '' : nom,
      expire_le: expireLe,
    })

    // 3. Envoyer le code par e-mail (si SMTP configuré).
    await envoyerCourriel(
      email,
      'Votre code de vérification SMSTSIKA',
      [
        `Bonjour ${nom || 'client'},`,
        '',
        'Voici votre code de vérification pour activer votre compte SMSTSIKA :',
        '',
        `  ${code}`,
        '',
        'Ce code est valide 15 minutes.',
        '',
        '— L’équipe SMSTSIKA',
      ].join('\n')
    )

    return NextResponse.json({ code_envoye: true }, { status: 200 })
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Compte suspendu')) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    console.error('[inscription] échec:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
