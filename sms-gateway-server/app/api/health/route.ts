import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-serveur'
import fs from 'fs'
import path from 'path'

const VERSION = '0.1.0'

/**
 * GET /api/health — état du système (public, pour monitoring/démo).
 * 200 si la base répond, 503 sinon. N'expose aucun secret.
 */
export async function GET() {
  const debut = Date.now()

  let supabase: { ok: boolean; latency_ms: number; error?: string } = {
    ok: false,
    latency_ms: 0,
  }
  try {
    const debutRequete = Date.now()
    const { error } = await supabaseAdmin
      .from('appareils')
      .select('id', { count: 'exact', head: true })
    supabase = error
      ? { ok: false, latency_ms: Date.now() - debutRequete, error: error.message }
      : { ok: true, latency_ms: Date.now() - debutRequete }
  } catch (erreur) {
    supabase = { ok: false, latency_ms: Date.now() - debut, error: (erreur as Error).message }
  }

  let tableParametres = false
  try {
    const { error } = await supabaseAdmin
      .from('parametres')
      .select('cle', { count: 'exact', head: true })
    tableParametres = !error
  } catch {
    tableParametres = false
  }

  const fcmEstConfigure =
    fs.existsSync(path.join(process.cwd(), 'firebase-service-account.json')) ||
    !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  const ok = supabase.ok
  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      version: VERSION,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        supabase,
        settings_table: tableParametres,
        fcm_configured: fcmEstConfigure,
      },
    },
    { status: ok ? 200 : 503 }
  )
}
