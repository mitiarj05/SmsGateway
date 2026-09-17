import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

const VERSION = '0.1.0'

/**
 * GET /api/health — état du système (public, pour monitoring/démo).
 * 200 si la base répond, 503 sinon. N'expose aucun secret.
 */
export async function GET() {
  const started = Date.now()

  let supabase: { ok: boolean; latency_ms: number; error?: string } = {
    ok: false,
    latency_ms: 0,
  }
  try {
    const t0 = Date.now()
    const { error } = await supabaseAdmin
      .from('devices')
      .select('id', { count: 'exact', head: true })
    supabase = error
      ? { ok: false, latency_ms: Date.now() - t0, error: error.message }
      : { ok: true, latency_ms: Date.now() - t0 }
  } catch (err) {
    supabase = { ok: false, latency_ms: Date.now() - started, error: (err as Error).message }
  }

  let settingsTable = false
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .select('cle', { count: 'exact', head: true })
    settingsTable = !error
  } catch {
    settingsTable = false
  }

  const fcmConfigured =
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
        settings_table: settingsTable,
        fcm_configured: fcmConfigured,
      },
    },
    { status: ok ? 200 : 503 }
  )
}
