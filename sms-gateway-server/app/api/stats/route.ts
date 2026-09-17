import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { expireStalePending } from '@/lib/pending-expiry'
import { promoteScheduled } from '@/lib/scheduled'

export async function GET() {
  try {
    await expireStalePending()
    await promoteScheduled()
    const { count: onlineDevices } = await supabaseAdmin
      .from('devices').select('*', { count: 'exact', head: true }).eq('statut', 'ONLINE')
    const { count: tasksSent } = await supabaseAdmin
      .from('sms_tasks').select('*', { count: 'exact', head: true }).eq('statut', 'SENT')
    const { count: tasksPending } = await supabaseAdmin
      .from('sms_tasks').select('*', { count: 'exact', head: true }).eq('statut', 'PENDING')
    const { count: tasksFailed } = await supabaseAdmin
      .from('sms_tasks').select('*', { count: 'exact', head: true }).eq('statut', 'FAILED')

    return NextResponse.json({
      stats: {
        online_devices: onlineDevices ?? 0,
        tasks_sent: tasksSent ?? 0,
        tasks_pending: tasksPending ?? 0,
        tasks_failed: tasksFailed ?? 0,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
