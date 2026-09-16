import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import {
  getAllSettings,
  isSettingKey,
  validateSettingValue,
} from '@/lib/settings'

/** GET /api/settings — réglages serveur (quota, seuils) */
export async function GET() {
  try {
    const settings = await getAllSettings()
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * PATCH /api/settings — met à jour un réglage.
 * Body: { cle: "sms_quota_per_hour" | "queue_alert_threshold", valeur: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const cle = body?.cle
    const valeur = body?.valeur

    if (typeof cle !== 'string' || !isSettingKey(cle)) {
      return NextResponse.json(
        { error: 'Clé inconnue (sms_quota_per_hour | queue_alert_threshold | max_pending_hours)' },
        { status: 400 }
      )
    }

    const invalid = validateSettingValue(cle, valeur)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ cle, valeur: String(valeur), updated_at: new Date().toISOString() }, { onConflict: 'cle' })

    if (error) {
      // Table non créée ? Message actionnable.
      return NextResponse.json(
        { error: `Écriture impossible (${error.message}). Exécutez sql/add-settings.sql dans Supabase.` },
        { status: 503 }
      )
    }

    const settings = await getAllSettings()
    return NextResponse.json({ message: 'Réglage enregistré', settings })
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
