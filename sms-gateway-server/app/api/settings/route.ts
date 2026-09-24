import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import {
  obtenirTousParametres,
  estCleParametre,
  validerValeurParametre,
} from '@/lib/parametres'

/** GET /api/settings — réglages serveur (quota, seuils) */
export async function GET() {
  try {
    const parametres = await obtenirTousParametres()
    return NextResponse.json({ settings: parametres })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * PATCH /api/settings — met à jour un réglage.
 * Corps: { cle: "sms_quota_per_hour" | "queue_alert_threshold", valeur: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const corps = await request.json().catch(() => null)
    const cle = corps?.cle
    const valeur = corps?.valeur

    if (typeof cle !== 'string' || !estCleParametre(cle)) {
      return NextResponse.json(
        { error: 'Clé inconnue (sms_quota_per_hour | queue_alert_threshold | max_pending_hours)' },
        { status: 400 }
      )
    }

    const invalide = validerValeurParametre(cle, valeur)
    if (invalide) {
      return NextResponse.json({ error: invalide }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('parametres')
      .upsert({ cle, valeur: String(valeur), date_modification: new Date().toISOString() }, { onConflict: 'cle' })

    if (error) {
      // Table non créée ? Message actionnable.
      return NextResponse.json(
        { error: `Écriture impossible (${error.message}). Exécutez sql/add-settings.sql dans Supabase.` },
        { status: 503 }
      )
    }

    const parametres = await obtenirTousParametres()
    return NextResponse.json({ message: 'Réglage enregistré', settings: parametres })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
