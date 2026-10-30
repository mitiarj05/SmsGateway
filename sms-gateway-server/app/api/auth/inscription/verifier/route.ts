import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import { obtenirOuCreerApplication } from '@/lib/compte-client'
import { poserCookieSessionClient } from '@/lib/session-client'

/**
 * POST /api/auth/inscription/verifier — vérifie le code à 6 chiffres.
 * Corps: { email, code }.
 * Publique.
 *
 * Confirme l'e-mail dans Supabase Auth, provisionne l'application cliente,
 * pose la session cookie et renvoie { ok: true }.
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const email = typeof corps?.email === 'string' ? corps.email.trim().toLowerCase() : ''
  const code = typeof corps?.code === 'string' ? corps.code.trim() : ''

  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Code invalide.' }, { status: 400 })
  }

  try {
    // 1. Retrouver le code non expiré pour cet e-mail.
    const { data: codes } = await supabaseAdmin
      .from('validation')
      .select('id, code, expire_le, user_id, nom, tentatives')
      .eq('email', email)
      .order('date_creation', { ascending: false })
      .limit(1)

    const codeEnregistrement = codes?.[0]
    if (!codeEnregistrement) {
      return NextResponse.json({ error: 'Aucun code trouvé pour cet e-mail.' }, { status: 404 })
    }

    // 2. Vérifier l'expiration.
    if (new Date(codeEnregistrement.expire_le) < new Date()) {
      return NextResponse.json({ error: 'Ce code a expiré — demandez un nouveau code.' }, { status: 410 })
    }

    // 3. Vérifier le code.
    if (codeEnregistrement.code !== code) {
      await supabaseAdmin
        .from('validation')
        .update({ tentatives: (codeEnregistrement.tentatives ?? 0) + 1 })
        .eq('id', codeEnregistrement.id)
      return NextResponse.json({ error: 'Code invalide — réessayez.' }, { status: 400 })
    }

    const utilisateurId = codeEnregistrement.user_id as string
    const nom = (codeEnregistrement as { nom?: string }).nom ?? ''

    // 4. Confirmer l'e-mail dans Supabase Auth.
    await supabaseAdmin.auth.admin.updateUserById(utilisateurId, { email_confirm: true })

    // 5. Provisions l'application cliente (crée la ligne client si nécessaire).
    const compte = await obtenirOuCreerApplication(utilisateurId, email, nom)

    // 6. Pose la session client et supprime le code utilisé.
    const reponse = NextResponse.json({ ok: true })
    poserCookieSessionClient(reponse, compte.applicationId)
    await supabaseAdmin.from('validation').delete().eq('email', email)

    return reponse
  } catch (e) {
    console.error('[verifier-code] échec:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
