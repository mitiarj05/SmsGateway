import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'

/**
 * POST /api/auth/google/commencer — { email } -> { google: boolean }.
 * Publique (hors matcher du proxy). Indique si cet e-mail correspond à une
 * demande VALIDEE (compte client existant) : le login bascule alors vers le
 * OAuth Google au lieu de l'étape mot de passe. Réponse toujours 200
 * (anti-énumération : un booléen ne révèle ni clé ni mot de passe).
 */
export async function POST(request: NextRequest) {
  const corps = await request.json().catch(() => null)
  const email = typeof corps?.email === 'string' ? corps.email.trim().toLowerCase() : ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ google: false })
  }
  try {
    // Compte standard : e-mail déjà rattaché à une application.
    const { data: apps } = await supabaseAdmin
      .from('applications')
      .select('id')
      .ilike('email', email)
      .limit(1)
    if ((apps?.length ?? 0) > 0) return NextResponse.json({ google: true })
    // Héritage : ancienne demande validée sans compte lié.
    const { data } = await supabaseAdmin
      .from('demandes')
      .select('id')
      .ilike('contact', email)
      .eq('statut', 'VALIDEE')
      .limit(1)
    return NextResponse.json({ google: (data?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ google: false })
  }
}
